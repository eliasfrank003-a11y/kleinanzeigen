import { useRef, useState } from 'react';
import { Camera, MoreHorizontal, Trash2, Undo2 } from 'lucide-react';
import type { Listing, Phase } from '@/lib/types';
import { activeIndex, ageInDays, currentPhase, daysBetween, phaseState } from '@/lib/plan';
import { formatDate, formatDays, formatDaysDative, formatPrice } from '@/lib/format';
import { compressImage } from '@/lib/storage';
import { PhaseRow } from './PhaseRow';

/**
 * A listing is a band across the page rather than a card on it. Boxes inside
 * boxes make a phone screen feel like a form; a rule above and below says the
 * same thing and leaves the content the full width.
 */
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
  const due = state === 'due' && !sold;

  const visible = sold ? listing.phases.filter((p) => p.startedAt) : listing.phases;

  const status = sold
    ? `verkauft am ${formatDate(listing.soldAt!)}`
    : active < 0
      ? 'noch nicht eingestellt'
      : due
        ? 'Aktion fällig'
        : current?.days && current.startedAt
          ? `noch ${formatDays(Math.max(0, current.days - daysBetween(current.startedAt, now)))}`
          : 'letzter Schritt';

  return (
    <article
      className={`border-t border-border px-5 py-8 ${sold ? 'opacity-50' : ''} ${
        due ? 'bg-card' : ''
      }`}
    >
      <header className="flex gap-4">
        <button
          onClick={() => file.current?.click()}
          className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-muted"
          aria-label="Foto wählen"
        >
          {listing.photo ? (
            <img src={listing.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera size={20} />
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
          <h2 className="text-[19px] font-medium leading-tight">{listing.title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{listing.category}</p>
        </div>

        <button
          onClick={() => setMenu((v) => !v)}
          className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
          aria-label="Mehr"
        >
          <MoreHorizontal size={18} />
        </button>
      </header>

      <p className="mt-5 flex items-baseline gap-3">
        <span className="tnum text-[38px] font-semibold leading-none">
          {sold
            ? listing.soldPrice !== null
              ? `${listing.soldPrice} €`
              : '—'
            : formatPrice(current?.price ?? listing.phases[0].price, current?.priceType ?? 'VB')}
        </span>
        <span className={`text-[14px] ${due ? 'text-due' : 'text-muted-foreground'}`}>
          {status}
        </span>
      </p>

      {menu && (
        <div className="mt-5 flex flex-wrap gap-2 text-[14px]">
          {active >= 0 && !sold && (
            <button
              onClick={() => {
                onUndo();
                setMenu(false);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-muted-foreground"
            >
              <Undo2 size={14} /> Schritt zurücknehmen
            </button>
          )}
          {listing.photo && (
            <button
              onClick={() => {
                onPhoto(null);
                setMenu(false);
              }}
              className="rounded-full border border-border px-4 py-2 text-muted-foreground"
            >
              Foto entfernen
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Anzeige löschen?')) onDelete();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-muted-foreground"
          >
            <Trash2 size={14} /> Löschen
          </button>
        </div>
      )}

      <div className="mt-8">
        {visible.map((phase, shown) => {
          const i = listing.phases.indexOf(phase);
          return (
            <PhaseRow
              key={phase.id}
              listing={listing}
              index={i}
              state={sold ? 'done' : phaseState(listing, i, now)}
              now={now}
              owed={due || active < 0}
              isLast={shown === visible.length - 1}
              onStart={() => onStartPhase(phase.id)}
              onEdit={(patch) => onEditPhase(phase.id, patch)}
            />
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">
          {sold
            ? age !== null
              ? `${formatDays(age)} bis zum Verkauf`
              : ''
            : age !== null
              ? `online seit ${formatDaysDative(age)}`
              : 'Plan steht'}
        </span>
        {sold ? (
          <button onClick={onReopen} className="text-muted-foreground underline">
            zurückholen
          </button>
        ) : (
          <button onClick={onSold} className="text-muted-foreground underline">
            verkauft
          </button>
        )}
      </div>
    </article>
  );
}
