import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Listing, Phase, PhaseState } from '@/lib/types';
import { formatDate, formatDays, formatDaysDative, formatPrice } from '@/lib/format';
import { daysBetween, progress, ranFor } from '@/lib/plan';

const DOT: Record<PhaseState, string> = {
  done: 'border-done bg-done',
  running: 'border-primary bg-primary',
  due: 'border-due bg-due',
  next: 'border-primary bg-background',
  later: 'border-border bg-background',
};

export function PhaseRow({
  listing,
  index,
  state,
  now,
  isLast,
  owed,
  onStart,
  onEdit,
}: {
  listing: Listing;
  index: number;
  state: PhaseState;
  now: number;
  isLast: boolean;
  /** True when the phase before this one has run out — the move is owed now. */
  owed: boolean;
  onStart: () => void;
  onEdit: (patch: Partial<Phase>) => void;
}) {
  const phase = listing.phases[index];
  const [editing, setEditing] = useState(false);

  const dim = state === 'done' || state === 'later';
  const ran = state === 'done' ? ranFor(listing, index) : null;
  const elapsed = phase.startedAt ? daysBetween(phase.startedAt, now) : 0;
  const overdue = state === 'due' ? elapsed - phase.days : 0;

  // Only a step that has not started yet is worth changing: the price of a
  // phase already running lives on the platform, not here.
  const editable = state === 'next' || state === 'later';

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {/* rail */}
      <div className="relative flex w-3 shrink-0 justify-center pt-[3px]">
        <span
          className={`z-10 h-3 w-3 rounded-full border-2 ${DOT[state]} ${
            state === 'due' ? 'ring-4 ring-due/20' : ''
          }`}
        />
        {!isLast && (
          <span className="absolute top-4 bottom-[-1rem] w-px bg-border" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <button
            className={`text-left text-sm leading-snug ${
              dim ? 'text-muted-foreground' : 'text-foreground'
            } ${editable ? 'underline decoration-border underline-offset-4' : ''}`}
            onClick={() => editable && setEditing((v) => !v)}
          >
            {phase.action}
          </button>
          <span
            className={`shrink-0 text-sm tabular-nums ${
              state === 'running' || state === 'due'
                ? 'font-medium text-primary'
                : dim
                  ? 'text-muted-foreground'
                  : 'text-foreground'
            }`}
          >
            {formatPrice(phase.price, phase.priceType)}
          </span>
        </div>

        <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
          {state === 'done' && phase.startedAt && (
            <>
              ab {formatDate(phase.startedAt)}
              {ran !== null && ` · lief ${formatDays(ran)}`}
            </>
          )}
          {(state === 'running' || state === 'due') && phase.startedAt && (
            <>
              seit {formatDate(phase.startedAt)} ·{' '}
              {!phase.days
                ? 'letzter Schritt'
                : state === 'due'
                  ? `geplant waren ${formatDays(phase.days)}`
                  : `Tag ${elapsed + 1} von ${phase.days}`}
            </>
          )}
          {state === 'next' && `geplant für ${formatDays(phase.days)}`}
          {state === 'later' && (phase.days ? formatDays(phase.days) : 'letzter Schritt')}
        </div>

        {(state === 'running' || state === 'due') && phase.days > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full ${state === 'due' ? 'bg-due' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, Math.max(3, progress(phase, now) * 100))}%` }}
            />
          </div>
        )}

        {state === 'due' && (
          <p className="mt-2 text-[11px] font-medium text-due">
            {overdue > 0 ? `seit ${formatDaysDative(overdue)} fällig` : 'jetzt fällig'}
          </p>
        )}

        {state === 'next' && (
          // Loud once the step is actually owed, quiet while the phase before it
          // still has days left — the button is available early, not urging.
          <button
            onClick={onStart}
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium active:opacity-80 ${
              owed
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground'
            }`}
          >
            <Check size={13} strokeWidth={3} />
            erledigt
          </button>
        )}

        {editing && editable && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={phase.price ?? ''}
              placeholder="—"
              onChange={(e) =>
                onEdit({ price: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums outline-none focus:border-primary"
            />
            <button
              onClick={() => onEdit({ priceType: phase.priceType === 'VB' ? 'FP' : 'VB' })}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
            >
              {phase.priceType === 'VB' ? 'VB' : 'Festpreis'}
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={phase.days}
              onChange={(e) => onEdit({ days: Math.max(0, Number(e.target.value)) })}
              className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums outline-none focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">Tage</span>
          </div>
        )}
      </div>
    </div>
  );
}
