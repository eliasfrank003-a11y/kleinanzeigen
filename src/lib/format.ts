const date = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });

export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}

export function formatPrice(value: number | null, type: 'VB' | 'FP'): string {
  if (value === null) return 'zu verschenken';
  return `${value} €${type === 'VB' ? ' VB' : ''}`;
}

/** "3 Tage" / "1 Tag" — used often enough that the branch is worth a home. */
export function formatDays(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? 'Tag' : 'Tage'}`;
}

/** The same count after "seit", where German wants the dative. */
export function formatDaysDative(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? 'Tag' : 'Tagen'}`;
}
