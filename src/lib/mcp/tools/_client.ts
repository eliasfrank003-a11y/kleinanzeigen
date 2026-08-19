import { createClient } from "@supabase/supabase-js";

/**
 * The edge function runs with the same publishable key the app uses, so it is
 * bound by the same row level security. Nothing here can reach further into
 * the project than the phone can.
 */
export function sb() {
  return createClient(
    process.env.SUPABASE_URL!,
    (process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Same shape the app generates, so ids stay indistinguishable by origin. */
export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const ok = (data: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
});

export const fail = (message: string) => ({
  content: [{ type: "text" as const, text: `Error: ${message}` }],
  isError: true,
});

export interface PhaseRow {
  id: string;
  action: string;
  price: number | null;
  priceType: "VB" | "FP";
  days: number;
  startedAt: string | null;
}
