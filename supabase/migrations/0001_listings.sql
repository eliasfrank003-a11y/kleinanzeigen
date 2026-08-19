-- Kleinanzeigen: one row per item being sold, carrying its whole price ladder.
--
-- The phases stay in a JSONB column rather than a child table. They are always
-- read and written as a unit, never queried across listings, and keeping them
-- together means a listing is one round trip and one atomic write — which is
-- what makes it safe for an assistant and a phone to both write here.
--
-- The primary key is the id the client already generates, so re-sending the
-- same listing updates it instead of duplicating it.

CREATE TABLE IF NOT EXISTS public.listings (
  id         TEXT PRIMARY KEY,
  title      TEXT        NOT NULL,
  -- Data URL of a small thumbnail, compressed client-side. Null until set.
  photo      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  phases     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  sold_at    TIMESTAMPTZ,
  sold_price NUMERIC,

  CONSTRAINT listings_phases_is_array CHECK (jsonb_typeof(phases) = 'array'),
  -- A sold listing needs the date; the price may legitimately be unknown.
  CONSTRAINT listings_sold_needs_date CHECK (sold_price IS NULL OR sold_at IS NOT NULL)
);

-- The one screen sorts by age, and the newest listing goes on top of the list
-- before that sort runs.
CREATE INDEX IF NOT EXISTS listings_created_idx ON public.listings (created_at DESC);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Single-user app with no auth, matching sleep_sessions, activities and habits
-- in this project. If this ever gains a second user, these must be replaced
-- with auth.uid() checks.
DROP POLICY IF EXISTS "public read listings"   ON public.listings;
DROP POLICY IF EXISTS "public insert listings" ON public.listings;
DROP POLICY IF EXISTS "public update listings" ON public.listings;
DROP POLICY IF EXISTS "public delete listings" ON public.listings;

CREATE POLICY "public read listings"   ON public.listings FOR SELECT USING (true);
CREATE POLICY "public insert listings" ON public.listings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update listings" ON public.listings FOR UPDATE USING (true);
CREATE POLICY "public delete listings" ON public.listings FOR DELETE USING (true);
