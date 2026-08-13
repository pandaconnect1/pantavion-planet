-- Align public listing browse permissions with the existing public RLS policy.
-- Public users may only read rows that satisfy "public read published listings".

grant select on public.public_listings to anon;
