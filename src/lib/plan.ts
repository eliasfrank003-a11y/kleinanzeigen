import type { Listing, Phase, PhaseState } from './types';

export const DAY = 86_400_000;

export function daysBetween(from: string, to: number | string): number {
  const end = typeof to === 'string' ? Date.parse(to) : to;
  return Math.floor((end - Date.parse(from)) / DAY);
}

/** Index of the last phase that has been started, or -1 before the first move. */
export function activeIndex(listing: Listing): number {
  let last = -1;
  listing.phases.forEach((p, i) => {
    if (p.startedAt) last = i;
  });
  return last;
}

export function phaseState(listing: Listing, index: number, now: number): PhaseState {
  const active = activeIndex(listing);
  if (index < active) return 'done';
  if (index > active) return index === active + 1 ? 'next' : 'later';

  const phase = listing.phases[index];
  // A phase with no runtime — the last resort at the end of a plan — never
  // falls due, because there is nothing after it to fall due for.
  if (!phase.days) return 'running';
  return daysBetween(phase.startedAt!, now) >= phase.days ? 'due' : 'running';
}

/** 0…1 through the phase's intended runtime; past 1 while it is overdue. */
export function progress(phase: Phase, now: number): number {
  if (!phase.startedAt || !phase.days) return 0;
  return (now - Date.parse(phase.startedAt)) / (phase.days * DAY);
}

/** How long a finished phase actually ran, which is rarely what was planned. */
export function ranFor(listing: Listing, index: number): number | null {
  const phase = listing.phases[index];
  const next = listing.phases[index + 1];
  if (!phase.startedAt || !next?.startedAt) return null;
  return daysBetween(phase.startedAt, next.startedAt);
}

export function currentPhase(listing: Listing): Phase | null {
  const i = activeIndex(listing);
  return i < 0 ? null : listing.phases[i];
}

/** Days a listing has been live, counted from the first confirmed move. */
export function ageInDays(listing: Listing, now: number): number | null {
  const first = listing.phases.find((p) => p.startedAt);
  return first ? daysBetween(first.startedAt!, now) : null;
}

/**
 * Sorting for the one screen: anything owing a decision first, then what is
 * merely running, then what is done. Inside a group, the oldest is on top —
 * the listing that has been sitting longest is the one worth looking at.
 */
export function sortListings(listings: Listing[], now: number): Listing[] {
  const rank = (l: Listing) => {
    if (l.soldAt) return 3;
    const i = activeIndex(l);
    if (i < 0) return 0; // not yet posted — the first move is owed
    return phaseState(l, i, now) === 'due' ? 0 : 1;
  };
  return [...listings].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d) return d;
    return (ageInDays(b, now) ?? -1) - (ageInDays(a, now) ?? -1);
  });
}
