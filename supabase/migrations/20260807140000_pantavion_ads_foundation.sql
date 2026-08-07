-- Pantavion Ads Center foundation
-- First-party advertising only. External ad networks/SDKs are not part of this system.

create extension if not exists pgcrypto;

create table if not exists public.pantavion_advertisers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 160),
  legal_name text,
  country_code text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantavion_ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.pantavion_advertisers(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  destination_url text,
  budget_cents bigint not null default 0 check (budget_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','refunded','cancelled')),
  moderation_status text not null default 'draft' check (moderation_status in ('draft','pending','approved','rejected','suspended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.pantavion_ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.pantavion_ad_campaigns(id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 140),
  body text not null check (char_length(body) between 1 and 1000),
  media_url text,
  call_to_action text,
  sponsored_label text not null default 'Sponsored',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantavion_ad_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.pantavion_ad_campaigns(id) on delete cascade,
  surface text not null check (surface in ('marketplace','business','search','events','communities','feed')),
  country_code text,
  audience_age_band text check (audience_age_band in ('teen','adult')),
  created_at timestamptz not null default now()
);

create index if not exists pantavion_advertisers_owner_idx on public.pantavion_advertisers(owner_id);
create index if not exists pantavion_ad_campaigns_advertiser_idx on public.pantavion_ad_campaigns(advertiser_id, created_at desc);
create index if not exists pantavion_ad_campaigns_serving_idx on public.pantavion_ad_campaigns(payment_status, moderation_status, starts_at, ends_at);
create index if not exists pantavion_ad_placements_surface_idx on public.pantavion_ad_placements(surface, country_code, audience_age_band);

alter table public.pantavion_advertisers enable row level security;
alter table public.pantavion_ad_campaigns enable row level security;
alter table public.pantavion_ad_creatives enable row level security;
alter table public.pantavion_ad_placements enable row level security;

drop policy if exists "pantavion_advertisers_owner_select" on public.pantavion_advertisers;
create policy "pantavion_advertisers_owner_select" on public.pantavion_advertisers for select using (owner_id = auth.uid());

drop policy if exists "pantavion_advertisers_owner_insert" on public.pantavion_advertisers;
create policy "pantavion_advertisers_owner_insert" on public.pantavion_advertisers for insert with check (owner_id = auth.uid());

drop policy if exists "pantavion_advertisers_owner_update" on public.pantavion_advertisers;
create policy "pantavion_advertisers_owner_update" on public.pantavion_advertisers for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "pantavion_ad_campaigns_owner_select" on public.pantavion_ad_campaigns;
create policy "pantavion_ad_campaigns_owner_select" on public.pantavion_ad_campaigns for select using (
  exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
);

drop policy if exists "pantavion_ad_campaigns_owner_insert" on public.pantavion_ad_campaigns;
create policy "pantavion_ad_campaigns_owner_insert" on public.pantavion_ad_campaigns for insert with check (
  exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
);

drop policy if exists "pantavion_ad_campaigns_owner_update" on public.pantavion_ad_campaigns;
create policy "pantavion_ad_campaigns_owner_update" on public.pantavion_ad_campaigns for update using (
  exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
) with check (
  exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
);

drop policy if exists "pantavion_ad_creatives_owner" on public.pantavion_ad_creatives;
create policy "pantavion_ad_creatives_owner" on public.pantavion_ad_creatives for all using (
  exists (
    select 1 from public.pantavion_ad_campaigns c
    join public.pantavion_advertisers a on a.id = c.advertiser_id
    where c.id = campaign_id and a.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.pantavion_ad_campaigns c
    join public.pantavion_advertisers a on a.id = c.advertiser_id
    where c.id = campaign_id and a.owner_id = auth.uid()
  )
);

drop policy if exists "pantavion_ad_placements_owner" on public.pantavion_ad_placements;
create policy "pantavion_ad_placements_owner" on public.pantavion_ad_placements for all using (
  exists (
    select 1 from public.pantavion_ad_campaigns c
    join public.pantavion_advertisers a on a.id = c.advertiser_id
    where c.id = campaign_id and a.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.pantavion_ad_campaigns c
    join public.pantavion_advertisers a on a.id = c.advertiser_id
    where c.id = campaign_id and a.owner_id = auth.uid()
  )
);

-- The application should only serve advertisements from this view.
-- A campaign is eligible only when sold through Pantavion, advertiser verified,
-- payment completed, moderation approved and the campaign is inside its active window.
create or replace view public.active_pantavion_ads as
select
  c.id as campaign_id,
  c.advertiser_id,
  a.display_name as advertiser_name,
  cr.id as creative_id,
  cr.headline,
  cr.body,
  cr.media_url,
  cr.call_to_action,
  cr.sponsored_label,
  c.destination_url,
  p.surface,
  p.country_code,
  p.audience_age_band,
  c.starts_at,
  c.ends_at
from public.pantavion_ad_campaigns c
join public.pantavion_advertisers a on a.id = c.advertiser_id
join public.pantavion_ad_creatives cr on cr.campaign_id = c.id
join public.pantavion_ad_placements p on p.campaign_id = c.id
where a.verification_status = 'verified'
  and c.payment_status = 'paid'
  and c.moderation_status = 'approved'
  and (c.starts_at is null or c.starts_at <= now())
  and (c.ends_at is null or c.ends_at > now());

comment on view public.active_pantavion_ads is 'Only Pantavion-direct, verified, paid and approved campaigns eligible for serving. No external ad-network inventory.';
