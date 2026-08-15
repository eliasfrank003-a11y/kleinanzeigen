import { useEffect, useMemo, useState } from 'react';
import { Moon, Plus, Sun } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { useTheme } from '@/hooks/useTheme';
import { sortListings } from '@/lib/plan';
import { defaultPhases, uid } from '@/lib/seed';
import { ListingCard } from '@/components/ListingCard';
import { Sheet, fieldClass, labelClass } from '@/components/Sheet';

export default function App() {
  const store = useListings();
  const { dark, toggle } = useTheme();
  const [adding, setAdding] = useState(false);
  const [selling, setSelling] = useState<string | null>(null);

  // Phases fall due at a date, not on a render, so the clock has to advance on
  // its own — otherwise an app left open overnight still shows yesterday.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const ordered = useMemo(() => sortListings(store.listings, now), [store.listings, now]);
  const open = store.listings.filter((l) => !l.soldAt).length;

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-md pb-20 pt-6">
        <header className="mb-7 flex items-center justify-between px-5">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">Kleinanzeigen</h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {open === 0
                ? 'nichts offen'
                : `${open} ${open === 1 ? 'Anzeige' : 'Anzeigen'} offen`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="-m-1 p-2 text-muted-foreground"
              aria-label="Hell oder dunkel"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={() => setAdding(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground active:opacity-80"
              aria-label="Anzeige hinzufügen"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div>
          {ordered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              now={now}
              onStartPhase={(phaseId) => store.startPhase(listing.id, phaseId)}
              onEditPhase={(phaseId, patch) => store.editPhase(listing.id, phaseId, patch)}
              onUndo={() => store.undoLast(listing.id)}
              onPhoto={(photo) => store.setPhoto(listing.id, photo)}
              onSold={() => setSelling(listing.id)}
              onReopen={() => store.reopen(listing.id)}
              onDelete={() => store.remove(listing.id)}
            />
          ))}

          {ordered.length === 0 && (
            <p className="border-t border-border px-5 py-16 text-center text-[15px] text-muted-foreground">
              Noch nichts drin. Oben rechts anlegen.
            </p>
          )}
          {ordered.length > 0 && <div className="border-t border-border" />}
        </div>
      </div>

      <NewListing
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={(title, price) => {
          store.add({
            id: uid(),
            title,
            photo: null,
            createdAt: new Date().toISOString(),
            soldAt: null,
            soldPrice: null,
            phases: defaultPhases(price),
          });
          setAdding(false);
        }}
      />

      <SoldSheet
        open={selling !== null}
        onClose={() => setSelling(null)}
        onConfirm={(price) => {
          if (selling) store.markSold(selling, price);
          setSelling(null);
        }}
      />
    </div>
  );
}

function NewListing({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, price: number) => void;
}) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  const valid = title.trim().length > 0 && Number(price) > 0;

  return (
    <Sheet open={open} title="Neue Anzeige" onClose={onClose}>
      <div>
        <div>
          <label className={labelClass}>Was verkaufst du</label>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Citizen Promaster Aqualand"
          />
        </div>
        <div>
          <label className={labelClass}>Startpreis in €</label>
          <input
            className={fieldClass}
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="89"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Daraus wird ein Plan mit zwei Senkungen und einem letzten Schritt. Jede
            Stufe lässt sich danach in der Karte antippen und ändern.
          </p>
        </div>
        <button
          disabled={!valid}
          onClick={() => onCreate(title.trim(), Number(price))}
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          Anlegen
        </button>
      </div>
    </Sheet>
  );
}

function SoldSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (price: number | null) => void;
}) {
  const [price, setPrice] = useState('');

  return (
    <Sheet open={open} title="Verkauft" onClose={onClose}>
      <div>
        <div>
          <label className={labelClass}>Für wie viel ist es weggegangen?</label>
          <input
            className={fieldClass}
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="70"
            autoFocus
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Der echte Preis ist die einzige Rückmeldung, die es gibt — Kleinanzeigen
            meldet keine Abschlüsse. Nach ein paar Verkäufen zeigt sich, ob die
            Schätzungen zu hoch oder zu niedrig lagen.
          </p>
        </div>
        <button
          onClick={() => {
            onConfirm(price === '' ? null : Number(price));
            setPrice('');
          }}
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground"
        >
          Eintragen
        </button>
      </div>
    </Sheet>
  );
}
