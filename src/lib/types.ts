export type PriceType = 'VB' | 'FP';

/** One price level in a listing's plan, plus the move that starts it. */
export interface Phase {
  id: string;
  /** What has to happen on the platform before this phase can run. */
  action: string;
  /** null for a step that isn't a price, e.g. giving the thing away. */
  price: number | null;
  priceType: PriceType;
  /** How long this price is meant to run before the next step is owed. */
  days: number;
  /** Stamped when the move is confirmed as done. null = not reached yet. */
  startedAt: string | null;
}

export interface Listing {
  id: string;
  title: string;
  category: string;
  /** Data URL. Kept small on the way in — see compressImage. */
  photo: string | null;
  createdAt: string;
  phases: Phase[];
  soldAt: string | null;
  soldPrice: number | null;
}

/** Where a phase sits relative to the one that is running. */
export type PhaseState = 'done' | 'running' | 'due' | 'next' | 'later';
