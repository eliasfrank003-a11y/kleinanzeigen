import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Listing, Phase, PhaseState } from '@/lib/types';
import { formatDaysDative, formatPrice } from '@/lib/format';
import { daysBetween, ranFor } from '@/lib/plan';

const DOT: Record<PhaseState, string> = {
  done: 'border-done bg-done',
  running: 'border-primary bg-primary',
  due: 'border-due bg-due',
  next: 'border-border bg-background',
  later: 'border-border bg-background',
};

/**
 * The rail below a step is one small square per day of its runtime, filled as
 * each day closes. A continuous bar tells you roughly how far along you are;
 * counting squares tells you it is Tuesday and you have four left, which is the
 * thing you actually decide on.
 *
 * An overdue step grows past its planned length — the extra squares are the
 * overrun, drawn in the same amber as the rest of the warning.
 */
function ticksFor(
  state: PhaseState,
  phase: Phase,
  elapsed: number,
  ran: number | null,
): { total: number; filled: number; tone: string; overrunFrom?: number } {
  switch (state) {
    case 'done': {
      const total = ran ?? phase.days;
      return { total, filled: total, tone: 'bg-done' };
    }
    case 'due':
      // Everything past the plan is drawn paler, so the overrun stays legible as
      // an overrun rather than blending into a longer plan.
      return {
        total: Math.max(phase.days, elapsed),
        filled: elapsed,
        tone: 'bg-due',
        overrunFrom: phase.days,
      };
    case 'running':
      return { total: phase.days, filled: Math.min(elapsed, phase.days), tone: 'bg-primary' };
    default:
      return { total: phase.days, filled: 0, tone: 'bg-primary' };
  }
}

export function PhaseRow({
  listing,
  index,
  state,
  now,
  owed,
  isLast,
  onStart,
  onEdit,
}: {
  listing: Listing;
  index: number;
  state: PhaseState;
  now: number;
  /** True when the step before this one has run out — the move is owed now. */
  owed: boolean;
  isLast: boolean;
  onStart: () => void;
  onEdit: (patch: Partial<Phase>) => void;
}) {
  const phase = listing.phases[index];
  const [editing, setEditing] = useState(false);

  const ahead = state === 'next' || state === 'later';
  const ran = state === 'done' ? ranFor(listing, index) : null;
  const elapsed = phase.startedAt ? daysBetween(phase.startedAt, now) : 0;
  const overdue = state === 'due' ? elapsed - phase.days : 0;
  const ticks = ticksFor(state, phase, elapsed, ran);

  return (
    <div className="relative flex gap-5 pb-7 last:pb-0">
      {/* Because each day is a square, a step's height is its duration: three
          weeks is visibly longer on the page than two. */}
      <div className="flex w-4 shrink-0 flex-col items-center pt-[6px]">
        <span
          className={`h-4 w-4 shrink-0 rounded-full border-2 ${DOT[state]} ${
            state === 'due' ? 'ring-[6px] ring-due/20' : ''
          } ${state === 'running' ? 'ring-[6px] ring-primary/15' : ''}`}
        />
        {!isLast && ticks.total > 0 && (
          <span className="mt-2.5 flex flex-col gap-[3px]" aria-hidden>
            {Array.from({ length: ticks.total }, (_, i) => (
              <span
                key={i}
                className={`h-[7px] w-[7px] rounded-[2px] ${
                  i >= ticks.filled
                    ? 'bg-track'
                    : ticks.overrunFrom !== undefined && i >= ticks.overrunFrom
                      ? 'bg-due/50'
                      : ticks.tone
                }`}
              />
            ))}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <button
            className={`text-left text-[20px] leading-snug ${
              ahead || state === 'done' ? 'text-muted-foreground' : 'text-foreground'
            }`}
            onClick={() => ahead && setEditing((v) => !v)}
          >
            {phase.action}
          </button>
          <span
            className={`tnum shrink-0 text-[20px] ${
              ahead || state === 'done' ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {formatPrice(phase.price, phase.priceType)}
          </span>
        </div>

        {phase.days > 0 && (
          <div className="tnum mt-1.5 text-[15px] text-muted-foreground">
            {/* Days done over days planned, in every state — a step that has not
                started reads 0/14, which says what it is and how long it lasts
                in three characters. */}
            {/* The day you are on while it runs, the days it took once it is
                over, and a plain 0 for a step still ahead. */}
            {state === 'done'
              ? (ran ?? phase.days)
              : state === 'due'
                ? elapsed
                : ahead
                  ? 0
                  : elapsed + 1}
            /{phase.days}
          </div>
        )}

        {state === 'due' && (
          <p className="mt-2 text-[15px] text-due">
            {overdue > 0 ? `seit ${formatDaysDative(overdue)} fällig` : 'jetzt fällig'}
          </p>
        )}

        {/* Only offered once the step before it has actually run its course.
            Before that there is nothing to confirm, and a button sitting there
            is an invitation to cut the price a week early by accident. */}
        {state === 'next' && owed && (
          <button
            onClick={onStart}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[16px] font-medium text-primary-foreground active:opacity-80"
          >
            <Check size={16} strokeWidth={3} />
            erledigt
          </button>
        )}

        {editing && ahead && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={phase.price ?? ''}
              placeholder="—"
              onChange={(e) =>
                onEdit({ price: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="tnum w-24 rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
            <button
              onClick={() => onEdit({ priceType: phase.priceType === 'VB' ? 'FP' : 'VB' })}
              className="rounded-lg border border-border px-3 py-2 text-[16px] text-muted-foreground"
            >
              {phase.priceType === 'VB' ? 'VB' : 'Festpreis'}
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={phase.days}
              onChange={(e) => onEdit({ days: Math.max(0, Number(e.target.value)) })}
              className="tnum w-20 rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
            <span className="text-[16px] text-muted-foreground">Tage</span>
          </div>
        )}
      </div>
    </div>
  );
}
