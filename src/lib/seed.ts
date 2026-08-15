import type { Listing } from './types';

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Durations are tuned to how Kleinanzeigen actually shows things rather than to
 * how fast buyers turn up. A listing gets its visibility in the first days and
 * then sinks, so a price that has run two weeks has been seen by everyone it is
 * going to be seen by — and cutting it alone does not bring the views back.
 * That is why every step after the first is a fresh listing rather than an edit:
 * the new price and the new visibility have to arrive together.
 */
export function defaultPhases(start: number): Listing['phases'] {
  const step = (n: number) => Math.max(5, Math.round((start * n) / 5) * 5);
  return [
    { id: uid(), action: 'Anzeige einstellen', price: start, priceType: 'VB', days: 14, startedAt: null },
    { id: uid(), action: 'Neu einstellen', price: step(0.78), priceType: 'VB', days: 14, startedAt: null },
    { id: uid(), action: 'Neu einstellen', price: step(0.55), priceType: 'FP', days: 21, startedAt: null },
    { id: uid(), action: 'Verschenken oder spenden', price: null, priceType: 'FP', days: 0, startedAt: null },
  ];
}

/** The listing this was built for, so the app is never empty on first open. */
export function seedListings(): Listing[] {
  return [
    {
      id: uid(),
      title: 'Villeroy & Boch Botanica, 23 Teile',
      category: 'Küche & Esszimmer',
      photo: null,
      createdAt: new Date().toISOString(),
      soldAt: null,
      soldPrice: null,
      phases: [
        { id: uid(), action: 'Anzeige einstellen', price: 89, priceType: 'VB', days: 14, startedAt: null },
        { id: uid(), action: 'Neu einstellen', price: 69, priceType: 'VB', days: 14, startedAt: null },
        { id: uid(), action: 'Neu einstellen', price: 49, priceType: 'FP', days: 21, startedAt: null },
        { id: uid(), action: 'Verschenken oder spenden', price: null, priceType: 'FP', days: 0, startedAt: null },
      ],
    },
  ];
}
