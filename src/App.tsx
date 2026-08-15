import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Moon, Plus, Settings, Sun, Upload } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { useTheme } from '@/hooks/useTheme';
import { sortListings } from '@/lib/plan';
import type { Listing } from '@/lib/types';
import { defaultPhases, uid } from '@/lib/seed';
import { ListingCard } from '@/components/ListingCard';
import { Sheet, fieldClass, labelClass } from '@/components/Sheet';

export default function App() {
  const store = useListings();
  const { dark, toggle } = useTheme();
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState(false);
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
          {/* The app's name is on the home screen icon already; the count is
              the only thing worth the top line. */}
          <h1 className="text-[28px] font-semibold tracking-tight">
            {open === 0
              ? 'Nichts offen'
              : `${open} ${open === 1 ? 'Anzeige' : 'Anzeigen'} offen`}
          </h1>
          <button
            onClick={() => setSettings(true)}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-muted-foreground"
            aria-label="Einstellungen"
          >
            <Settings size={22} />
          </button>
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

      <SettingsSheet
        open={settings}
        onClose={() => setSettings(false)}
        dark={dark}
        onToggleTheme={toggle}
        onAdd={() => {
          setSettings(false);
          setAdding(true);
        }}
        listings={store.listings}
        onImport={store.replaceAll}
      />

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

function SettingsSheet({
  open,
  onClose,
  dark,
  onToggleTheme,
  onAdd,
  listings,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  onAdd: () => void;
  listings: Listing[];
  onImport: (listings: Listing[]) => void;
}) {
  const file = useRef<HTMLInputElement>(null);

  /**
   * Everything lives in this browser's storage, so a backup is a file the user
   * keeps. It is not a sync — but it is the difference between a wiped phone
   * costing an afternoon and costing the whole record.
   */
  const exportData = () => {
    const blob = new Blob([JSON.stringify(listings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kleinanzeigen.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} title="Einstellungen" onClose={onClose}>
      <div className="space-y-2">
        <button
          onClick={onAdd}
          className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-3.5 text-[16px] font-medium text-primary-foreground active:opacity-80"
        >
          <Plus size={18} strokeWidth={2.5} /> Neue Anzeige
        </button>

        <button
          onClick={onToggleTheme}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3.5 text-[16px]"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Helles Design' : 'Dunkles Design'}
        </button>

        <button
          onClick={exportData}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3.5 text-[16px] text-muted-foreground"
        >
          <Download size={18} /> Daten sichern
        </button>

        <button
          onClick={() => file.current?.click()}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3.5 text-[16px] text-muted-foreground"
        >
          <Upload size={18} /> Sicherung einlesen
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const parsed = JSON.parse(await f.text());
              if (Array.isArray(parsed) && confirm('Sicherung einlesen? Der jetzige Stand wird ersetzt.')) {
                onImport(parsed);
                onClose();
              }
            } catch {
              alert('Die Datei ließ sich nicht lesen.');
            }
          }}
        />

        <p className="pt-2 text-[13px] leading-relaxed text-muted-foreground">
          Alles liegt auf diesem Gerät, ohne Konto und ohne Server. Ein Update der
          App rührt die Anzeigen nicht an — gelöscht wird nur, wenn du die
          Website-Daten im Browser löschst.
        </p>
      </div>
    </Sheet>
  );
}
