import { useCallback, useEffect, useRef, useState } from 'react';
import type { Listing, Phase } from '@/lib/types';
import { load, save } from '@/lib/storage';
import { activeIndex } from '@/lib/plan';
import { deleteListing, fetchListings, upsertListings } from '@/lib/supabaseStore';

/**
 * The table is the record and localStorage is the cache in front of it. The
 * cache renders first so the app opens instantly and works on a train; the
 * fetch that follows replaces it. Writes go to state immediately — a tap has
 * to feel done — and to the table right after.
 *
 * There is no merge logic, deliberately: one person uses this from a phone and
 * from an assistant, never both in the same second, and "last write wins" is
 * the honest description of that.
 */
export function useListings() {
  const [listings, setListings] = useState<Listing[]>(load);
  const [syncError, setSyncError] = useState<string | null>(null);

  // setState's updater form can't be used to decide what to persist: React may
  // call it twice. This ref is the single answer to "what is on screen now".
  const current = useRef(listings);

  const apply = useCallback((next: Listing[]) => {
    current.current = next;
    setListings(next);
    save(next);
  }, []);

  // Writes that failed, keyed by listing. Without this a change made on a bad
  // connection would survive in the cache only until the next fetch overwrote
  // it — the app would look like it had saved and quietly had not.
  const pending = useRef(new Map<string, Listing>());

  const persist = useCallback((changed: Listing[]) => {
    upsertListings(changed)
      .then(() => {
        changed.forEach((l) => pending.current.delete(l.id));
        if (pending.current.size === 0) setSyncError(null);
      })
      .catch((e: Error) => {
        changed.forEach((l) => pending.current.set(l.id, l));
        setSyncError(e.message);
      });
  }, []);

  useEffect(() => {
    fetchListings()
      .then((rows) => {
        // An empty table next to a filled cache means this device holds the
        // only copy — the phone that ran on localStorage before there was a
        // table. It seeds the table rather than being wiped by it.
        if (rows.length === 0 && current.current.length > 0) {
          persist(current.current);
          return;
        }
        // Unsent changes outrank the server's answer; push, don't overwrite.
        if (pending.current.size > 0) {
          persist([...pending.current.values()]);
          return;
        }
        apply(rows);
        setSyncError(null);
      })
      .catch((e: Error) => setSyncError(e.message));
  }, [apply, persist]);

  // Coming back to the app is the moment the connection is most likely to have
  // returned, so it is when a failed write gets its second chance.
  useEffect(() => {
    const retry = () => {
      if (document.visibilityState === 'visible' && pending.current.size > 0) {
        persist([...pending.current.values()]);
      }
    };
    document.addEventListener('visibilitychange', retry);
    return () => document.removeEventListener('visibilitychange', retry);
  }, [persist]);

  const update = useCallback(
    (id: string, fn: (l: Listing) => Listing) => {
      const next = current.current.map((l) => (l.id === id ? fn(l) : l));
      apply(next);
      const changed = next.find((l) => l.id === id);
      if (changed) persist([changed]);
    },
    [apply, persist],
  );

  return {
    listings,

    /** Set when the table could not be reached. The cache still renders. */
    syncError,

    add: useCallback(
      (listing: Listing) => {
        apply([listing, ...current.current]);
        persist([listing]);
      },
      [apply, persist],
    ),

    /** Reading a backup replaces the record, on this device and in the table. */
    replaceAll: useCallback(
      (next: Listing[]) => {
        apply(next);
        persist(next);
      },
      [apply, persist],
    ),

    remove: useCallback(
      (id: string) => {
        apply(current.current.filter((l) => l.id !== id));
        deleteListing(id)
          .then(() => setSyncError(null))
          .catch((e: Error) => setSyncError(e.message));
      },
      [apply],
    ),

    /** Confirm the move that starts a phase. Time starts running here. */
    startPhase: useCallback(
      (id: string, phaseId: string) =>
        update(id, (l) => ({
          ...l,
          phases: l.phases.map((p) =>
            p.id === phaseId ? { ...p, startedAt: new Date().toISOString() } : p,
          ),
        })),
      [update],
    ),

    /** Undo the most recent confirmation — the only one that can be wrong. */
    undoLast: useCallback(
      (id: string) =>
        update(id, (l) => {
          const i = activeIndex(l);
          if (i < 0) return l;
          return {
            ...l,
            phases: l.phases.map((p, index) =>
              index === i ? { ...p, startedAt: null } : p,
            ),
          };
        }),
      [update],
    ),

    editPhase: useCallback(
      (id: string, phaseId: string, patch: Partial<Phase>) =>
        update(id, (l) => ({
          ...l,
          phases: l.phases.map((p) => (p.id === phaseId ? { ...p, ...patch } : p)),
        })),
      [update],
    ),

    setPhoto: useCallback(
      (id: string, photo: string | null) => update(id, (l) => ({ ...l, photo })),
      [update],
    ),

    markSold: useCallback(
      (id: string, price: number | null) =>
        update(id, (l) => ({ ...l, soldAt: new Date().toISOString(), soldPrice: price })),
      [update],
    ),

    reopen: useCallback(
      (id: string) => update(id, (l) => ({ ...l, soldAt: null, soldPrice: null })),
      [update],
    ),
  };
}
