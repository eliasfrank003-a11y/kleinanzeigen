import { useRef, useState } from 'react';
import { Camera, MoreHorizontal, PackageCheck, Trash2, Undo2 } from 'lucide-react';
import type { Listing, Phase } from '@/lib/types';
import { activeIndex, ageInDays, currentPhase, daysBetween, phaseState } from '@/lib/plan';
import { formatDate, formatDays, formatDaysDative, formatPrice } from '@/lib/format';
import { compressImage } from '@/lib/storage';
import { PhaseRow } from './PhaseRow';

export function ListingCard({
  listing,
  now,
  onStartPhase,
  onEditPhase,
  onUndo,
  onPhoto,
  onSold,
  onReopen,
  onDelete,
}: {
  listing: Listing;
  now: number;
  onStartPhase: (phaseId: string) => void;
  onEditPhase: (phaseId: string, patch: Partial<Phase>) => void;
  onUndo: () => void;
  onPhoto: (photo: string | null) => void;
  onSold: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);

  const active = activeIndex(listing);
  const current = currentPhase(listing);
  const state = active >= 0 ? phaseState(listing, active, now) : null;
  const age = ageInDays(listing, now);
  const sold = Boolean(listing.soldAt);

  const status = sold
    ? `verkauft am ${formatDate(listing.soldAt!)}`
    : active < 0
      ? 'noch nicht eingestellt'
      : state === 'due'
        ? 'Aktion fällig'
        : current?.days && current.startedAt
          ? `noch ${formatDays(Math.max(0, current.days - daysBetween(current.startedAt, now)))}`
          : 'letzter Schritt';

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-card ${
        state === 'due' && !sold ? 'border-due/40' : 'border-border'
      } ${sold ? 'opacity-60' : ''}`}
    >
      <header className="flex gap-3 p-4">
        <button
          onClick={() => file.current?.click()}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
          aria-label="Foto wählen"
        >
          {listing.photo ? (
            <img src={listing.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera size={18} />
            </span>
          )}
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onPhoto(await compressImage(f));
            e.target.value = '';
          }}
        />

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium leading-snug">{listing.title}</h2>
          <p className="truncate text-[11px] text-muted-foreground">{listing.category}</p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-primary">
              {sold
                ? listing.soldPrice !== null
                  ? `${listing.soldPrice} €`
                  : '—'
                : formatPrice(current?.price ?? listing.phases[0].price, current?.priceType ?? 'VB')}
            </span>
            <span
              className={`text-[11px] ${state === 'due' && !sold ? 'font-medium text-due' : 'text-muted-foreground'}`}
            >
              {status}
            </span>
          </p>
        </div>

        <button
          onClick={() => setMenu((v) => !v)}
          className="-m-2 flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground"
          aria-label="Mehr"
        >
          <MoreHorizontal size={16} />
        </button>
      </header>

      {menu && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 text-xs">
          {active >= 0 && !sold && (
            <button
              onClick={() => {
                onUndo();
                setMenu(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground"
            >
              <Undo2 size={13} /> Schritt zurücknehmen
            </button>
          )}
          {listing.photo && (
            <button
              onClick={() => {
                onPhoto(null);
                setMenu(false);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-muted-foreground"
            >
              Foto entfernen
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Anzeige löschen?')) onDelete();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground"
          >
            <Trash2 size={13} /> Löschen
          </button>
        </div>
      )}

      {/* A sold listing keeps its track, trimmed to the steps that actually ran:
          the record of how long it took at which price is the whole point of
          having written the plan down. */}
      <div className="border-t border-border px-4 pt-4 pb-3">
        {listing.phases.map((phase, i) => {
          if (sold && !phase.startedAt) return null;
          return (
            <PhaseRow
              key={phase.id}
              listing={listing}
              index={i}
              state={sold ? 'done' : phaseState(listing, i, now)}
              now={now}
              isLast={
                sold
                  ? i === active
                  : i === listing.phases.length - 1
              }
              owed={state === 'due' || active < 0}
              onStart={() => onStartPhase(phase.id)}
              onEdit={(patch) => onEditPhase(phase.id, patch)}
            />
          );
        })}
      </div>

      <footer className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="text-[11px] text-muted-foreground">
          {sold
            ? age !== null
              ? `${formatDays(age)} bis zum Verkauf`
              : ''
            : age !== null
              ? `online seit ${formatDaysDative(age)}`
              : 'Plan steht'}
        </span>
        {sold ? (
          <button onClick={onReopen} className="text-[11px] text-muted-foreground underline">
            zurückholen
          </button>
        ) : (
          <button
            onClick={onSold}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary"
          >
            <PackageCheck size={13} /> verkauft
          </button>
        )}
      </footer>
    </article>
  );
}
