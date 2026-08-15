import type { Listing } from './types';

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * The plan the app is built around: post it, give the price a run, cut, cut
 * again, and have a last resort so the thing cannot quietly become furniture.
 * Steps are pre-filled but every price and duration stays editable.
 */
export function defaultPhases(start: number): Listing['phases'] {
  const step = (n: number) => Math.max(5, Math.round((start * n) / 5) * 5);
  return [
    { id: uid(), action: 'Anzeige einstellen', price: start, priceType: 'VB', days: 10, startedAt: null },
    { id: uid(), action: 'Preis senken', price: step(0.78), priceType: 'VB', days: 10, startedAt: null },
    { id: uid(), action: 'Neu einstellen', price: step(0.55), priceType: 'FP', days: 14, startedAt: null },
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
        { id: uid(), action: 'Anzeige einstellen', price: 89, priceType: 'VB', days: 10, startedAt: null },
        { id: uid(), action: 'Preis senken', price: 69, priceType: 'VB', days: 10, startedAt: null },
        { id: uid(), action: 'Neu einstellen', price: 49, priceType: 'FP', days: 14, startedAt: null },
        { id: uid(), action: 'Verschenken oder spenden', price: null, priceType: 'FP', days: 0, startedAt: null },
      ],
    },
  ];
}
