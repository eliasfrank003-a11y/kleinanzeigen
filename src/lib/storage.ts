import type { Listing } from './types';

const KEY = 'kleinanzeigen:listings';

/**
 * The cache in front of the table, not the record itself. It is what the app
 * paints on open — instantly, and with no network — and the fetch that follows
 * replaces it. Empty is a valid answer here: it means the table has not been
 * read yet on this device.
 */
export function load(): Listing[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Listing[];
    return Array.isArray(parsed) ? parsed.map(migrate) : [];
  } catch {
    // A corrupt cache should cost a round trip, not the app.
    return [];
  }
}

/** Older stores carry the wordier labels this app started with. */
function migrate(listing: Listing): Listing {
  return {
    ...listing,
    phases: listing.phases.map((p) =>
      p.action === 'Verschenken oder spenden' ? { ...p, action: 'Verschenken' } : p,
    ),
  };
}

export function save(listings: Listing[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(listings));
  } catch {
    // Quota is the only realistic failure and it means a photo was too big.
    // Losing the cache write is cheap now that the table holds the record.
  }
}

/**
 * Photos come straight from the camera roll at several megabytes, and
 * localStorage gives us about five in total. A long edge of 640 is more than a
 * thumbnail on a card ever needs.
 */
export function compressImage(file: File, maxEdge = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas nicht verfügbar'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
