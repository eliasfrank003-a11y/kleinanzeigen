import { createClient } from '@supabase/supabase-js';
import type { Listing, Phase } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null when the app runs without credentials, e.g. a bare `npm run dev` on a
 * fresh clone. Everything below then degrades to the local cache, so the app
 * still opens instead of showing a wall of errors.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

/** The table's shape. Snake case there, camel case in the app. */
interface Row {
  id: string;
  title: string;
  photo: string | null;
  created_at: string;
  phases: Phase[];
  sold_at: string | null;
  sold_price: number | null;
}

const toListing = (r: Row): Listing => ({
  id: r.id,
  title: r.title,
  photo: r.photo,
  createdAt: r.created_at,
  phases: Array.isArray(r.phases) ? r.phases : [],
  soldAt: r.sold_at,
  soldPrice: r.sold_price === null ? null : Number(r.sold_price),
});

const toRow = (l: Listing): Row => ({
  id: l.id,
  title: l.title,
  photo: l.photo,
  created_at: l.createdAt,
  phases: l.phases,
  sold_at: l.soldAt,
  sold_price: l.soldPrice,
});

export async function fetchListings(): Promise<Listing[]> {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert.');

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toListing(row as Row));
}

/**
 * Upsert rather than insert: the id comes from the client, so re-sending a
 * listing is how an edit travels. Writing nothing when unconfigured keeps a
 * credential-less dev session usable instead of throwing on every tap.
 */
export async function upsertListings(listings: Listing[]): Promise<void> {
  if (!supabase || listings.length === 0) return;

  const { error } = await supabase.from('listings').upsert(listings.map(toRow));
  if (error) throw new Error(error.message);
}

export async function deleteListing(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
