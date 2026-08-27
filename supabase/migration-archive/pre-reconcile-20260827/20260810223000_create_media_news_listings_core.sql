-- Pantavion Media / News / Radio / Listings Core
-- Canonical foundation for source-backed public content and moderated listings.
-- This migration creates data contracts only; it does not claim licensed feeds or live payments.

create extension if not exists pgcrypto;

create table if not exists public.media_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('news','sports','radio','podcast','creator','institution','authority','community','other')),
  homepage_url text,
  feed_url text,
  country_code text,
  language_code text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','reviewed','verified','suspended','retired')),
  rights_status text not null default 'unknown'
    check (rights_status in ('unknown','link_only','licensed','owned','consented','restricted','expired')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_sources_type_enabled_idx on public.media_sources(source_type, enabled);
create index if not exists media_sources_country_language_idx on public.media_sources(country_code, language_code);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.media_sources(id) on delete set null,
  author_user_id uuid references auth.users(id) on delete set null,
  item_type text not null check (item_type in ('article','sports_update','radio_station','audio_episode','video','announcement','alert','event','other')),
  title text not null,
  summary text,
  body text,
  canonical_url text,
  media_url text,
  image_url text,
  country_code text,
  region text,
  city text,
  language_code text,
  category text,
  published_at timestamptz,
  freshness_expires_at timestamptz,
  editorial_state text not null default 'draft'
    check (editorial_state in ('draft','submitted','under_review','approved','published','corrected','withdrawn','archived','rejected')),
  provenance jsonb not null default '{}'::jsonb,
  correction_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (editorial_state <> 'published' or published_at is not null)
);
create index if not exists media_items_public_feed_idx
  on public.media_items(editorial_state, published_at desc);
create index if not exists media_items_geo_idx
  on public.media_items(country_code, region, city);
create index if not exists media_items_language_category_idx
  on public.media_items(language_code, category);

create table if not exists public.public_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  listing_type text not null check (listing_type in ('classified','service','job','business','event','request','property','marketplace','promotion','community_announcement','other')),
  title text not null,
  description text,
  category text,
  country_code text,
  region text,
  city text,
  language_code text,
  price_amount numeric(14,2),
  price_currency text,
  contact_mode text not null default 'pantavion'
    check (contact_mode in ('pantavion','public_email','public_phone','external_link','none')),
  public_contact jsonb not null default '{}'::jsonb,
  lifecycle_state text not null default 'draft'
    check (lifecycle_state in ('draft','submitted','payment_pending','under_review','approved','published','sold','rented','fulfilled','expired','removed','rejected','archived')),
  paid_promotion boolean not null default false,
  promotion_expires_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  moderation_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_amount is null or price_amount >= 0),
  check (lifecycle_state <> 'published' or published_at is not null)
);
create index if not exists public_listings_owner_idx on public.public_listings(owner_id, created_at desc);
create index if not exists public_listings_browse_idx on public.public_listings(lifecycle_state, published_at desc);
create index if not exists public_listings_geo_category_idx on public.public_listings(country_code, region, city, category);

create or replace function public.pantavion_media_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger media_sources_touch_updated_at
before update on public.media_sources
for each row execute function public.pantavion_media_touch_updated_at();

create trigger media_items_touch_updated_at
before update on public.media_items
for each row execute function public.pantavion_media_touch_updated_at();

create trigger public_listings_touch_updated_at
before update on public.public_listings
for each row execute function public.pantavion_media_touch_updated_at();

alter table public.media_sources enable row level security;
alter table public.media_items enable row level security;
alter table public.public_listings enable row level security;

-- Public readers only see explicitly enabled, rights-safe source metadata.
create policy "public read enabled media sources"
on public.media_sources for select
to anon, authenticated
using (
  enabled = true
  and verification_status in ('reviewed','verified')
  and rights_status in ('link_only','licensed','owned','consented')
);

-- Public readers only see published items from allowed source situations.
create policy "public read published media items"
on public.media_items for select
to anon, authenticated
using (
  editorial_state = 'published'
  and published_at is not null
  and (freshness_expires_at is null or freshness_expires_at > now())
  and (
    source_id is null
    or exists (
      select 1 from public.media_sources s
      where s.id = media_items.source_id
        and s.enabled = true
        and s.verification_status in ('reviewed','verified')
        and s.rights_status in ('link_only','licensed','owned','consented')
    )
  )
);

-- Authenticated creators can see and manage only their own non-authority media submissions.
create policy "creator read own media items"
on public.media_items for select
to authenticated
using (auth.uid() = author_user_id);

create policy "creator submit media items"
on public.media_items for insert
to authenticated
with check (
  auth.uid() = author_user_id
  and editorial_state in ('draft','submitted')
  and item_type not in ('alert')
);

create policy "creator update own unpublished media items"
on public.media_items for update
to authenticated
using (auth.uid() = author_user_id and editorial_state in ('draft','submitted','rejected'))
with check (auth.uid() = author_user_id and editorial_state in ('draft','submitted','rejected'));

-- Listings are owner-managed until moderation/publishing changes state.
create policy "owner read own listings"
on public.public_listings for select
to authenticated
using (auth.uid() = owner_id);

create policy "public read published listings"
on public.public_listings for select
to anon, authenticated
using (
  lifecycle_state = 'published'
  and published_at is not null
  and (expires_at is null or expires_at > now())
  and (promotion_expires_at is null or promotion_expires_at > now() or paid_promotion = false)
);

create policy "owner create listings"
on public.public_listings for insert
to authenticated
with check (
  auth.uid() = owner_id
  and lifecycle_state in ('draft','submitted')
  and paid_promotion = false
);

create policy "owner update unpublished listings"
on public.public_listings for update
to authenticated
using (auth.uid() = owner_id and lifecycle_state in ('draft','submitted','rejected'))
with check (auth.uid() = owner_id and lifecycle_state in ('draft','submitted','rejected'));

revoke all on public.media_sources from anon, authenticated;
revoke all on public.media_items from anon, authenticated;
revoke all on public.public_listings from anon, authenticated;

grant select on public.media_sources to anon, authenticated;
grant select on public.media_items to anon, authenticated;
grant insert, update on public.media_items to authenticated;
grant select, insert, update on public.public_listings to authenticated;

-- Moderation, source activation, authority alerts and paid-promotion state transitions
-- are intentionally NOT granted to ordinary clients. They belong to governed server/admin paths.
