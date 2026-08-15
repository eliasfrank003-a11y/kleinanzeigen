import { useCallback, useEffect, useState } from 'react';
import type { Listing, Phase } from '@/lib/types';
import { load, save } from '@/lib/storage';
import { activeIndex } from '@/lib/plan';

export function useListings() {
  const [listings, setListings] = useState<Listing[]>(load);

  useEffect(() => save(listings), [listings]);

  const update = useCallback((id: string, fn: (l: Listing) => Listing) => {
    setListings((all) => all.map((l) => (l.id === id ? fn(l) : l)));
  }, []);

  return {
    listings,

    add: useCallback((listing: Listing) => setListings((all) => [listing, ...all]), []),

    replaceAll: useCallback((next: Listing[]) => setListings(next), []),

    remove: useCallback(
      (id: string) => setListings((all) => all.filter((l) => l.id !== id)),
      [],
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
