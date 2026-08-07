-- Pantavion Ads Center sales workflow
-- Human collaboration: request -> quote -> agreement -> payment -> moderation -> serving.

create table if not exists public.pantavion_ad_rate_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  surface text not null check (surface in ('marketplace','business','search','events','communities','feed','multi_surface')),
  billing_model text not null check (billing_model in ('fixed','daily','weekly','monthly','cpm','cpc','custom_quote')),
  base_price_cents bigint check (base_price_cents is null or base_price_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  minimum_days integer check (minimum_days is null or minimum_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantavion_ad_requests (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.pantavion_advertisers(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  objective text not null check (char_length(objective) between 2 and 2000),
  requested_surfaces text[] not null default '{}',
  target_countries text[] not null default '{}',
  requested_start date,
  requested_end date,
  budget_cents bigint check (budget_cents is null or budget_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  status text not null default 'submitted' check (status in ('draft','submitted','in_discussion','quoted','accepted','declined','payment_pending','paid','in_moderation','approved','live','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requested_end is null or requested_start is null or requested_end >= requested_start)
);

create table if not exists public.pantavion_ad_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pantavion_ad_requests(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  description text not null,
  valid_until date,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','expired','superseded')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(request_id, version)
);

create table if not exists public.pantavion_ad_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pantavion_ad_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.pantavion_ad_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pantavion_ad_requests(id) on delete cascade,
  stage text not null check (stage in ('commercial','content','brand_safety','legal','payment','final')),
  decision text not null check (decision in ('pending','approved','rejected','changes_requested')),
  note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(request_id, stage)
);

create index if not exists pantavion_ad_requests_advertiser_idx on public.pantavion_ad_requests(advertiser_id, created_at desc);
create index if not exists pantavion_ad_requests_status_idx on public.pantavion_ad_requests(status, created_at desc);
create index if not exists pantavion_ad_quotes_request_idx on public.pantavion_ad_quotes(request_id, version desc);
create index if not exists pantavion_ad_messages_request_idx on public.pantavion_ad_request_messages(request_id, created_at asc);

alter table public.pantavion_ad_rate_cards enable row level security;
alter table public.pantavion_ad_requests enable row level security;
alter table public.pantavion_ad_quotes enable row level security;
alter table public.pantavion_ad_request_messages enable row level security;
alter table public.pantavion_ad_approvals enable row level security;

-- Rate cards are public-to-authenticated for transparency. Only staff/admin may modify them through privileged server tooling.
drop policy if exists "pantavion_ad_rate_cards_read" on public.pantavion_ad_rate_cards;
create policy "pantavion_ad_rate_cards_read" on public.pantavion_ad_rate_cards for select to authenticated using (is_active = true);

-- Request owner or Pantavion staff can see each request.
drop policy if exists "pantavion_ad_requests_read" on public.pantavion_ad_requests;
create policy "pantavion_ad_requests_read" on public.pantavion_ad_requests for select using (
  created_by = auth.uid()
  or exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff')
);

drop policy if exists "pantavion_ad_requests_create" on public.pantavion_ad_requests;
create policy "pantavion_ad_requests_create" on public.pantavion_ad_requests for insert with check (
  created_by = auth.uid()
  and exists (select 1 from public.pantavion_advertisers a where a.id = advertiser_id and a.owner_id = auth.uid())
);

drop policy if exists "pantavion_ad_requests_update" on public.pantavion_ad_requests;
create policy "pantavion_ad_requests_update" on public.pantavion_ad_requests for update using (
  created_by = auth.uid()
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff')
) with check (
  created_by = auth.uid()
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff')
);

-- Quotes are visible to the request owner and staff. Quote creation is staff/admin only.
drop policy if exists "pantavion_ad_quotes_read" on public.pantavion_ad_quotes;
create policy "pantavion_ad_quotes_read" on public.pantavion_ad_quotes for select using (
  exists (
    select 1 from public.pantavion_ad_requests r
    join public.pantavion_advertisers a on a.id = r.advertiser_id
    where r.id = request_id and (a.owner_id = auth.uid() or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff'))
  )
);

drop policy if exists "pantavion_ad_quotes_staff_create" on public.pantavion_ad_quotes;
create policy "pantavion_ad_quotes_staff_create" on public.pantavion_ad_quotes for insert with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff')
);

-- Both sides can collaborate in the request conversation.
drop policy if exists "pantavion_ad_messages_read" on public.pantavion_ad_request_messages;
create policy "pantavion_ad_messages_read" on public.pantavion_ad_request_messages for select using (
  exists (
    select 1 from public.pantavion_ad_requests r
    join public.pantavion_advertisers a on a.id = r.advertiser_id
    where r.id = request_id and (a.owner_id = auth.uid() or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff'))
  )
);

drop policy if exists "pantavion_ad_messages_create" on public.pantavion_ad_request_messages;
create policy "pantavion_ad_messages_create" on public.pantavion_ad_request_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.pantavion_ad_requests r
    join public.pantavion_advertisers a on a.id = r.advertiser_id
    where r.id = request_id and (a.owner_id = auth.uid() or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff'))
  )
);

-- Approval trail is readable by both sides; decisions are staff/admin only.
drop policy if exists "pantavion_ad_approvals_read" on public.pantavion_ad_approvals;
create policy "pantavion_ad_approvals_read" on public.pantavion_ad_approvals for select using (
  exists (
    select 1 from public.pantavion_ad_requests r
    join public.pantavion_advertisers a on a.id = r.advertiser_id
    where r.id = request_id and (a.owner_id = auth.uid() or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','staff'))
  )
);

-- Final serving rule remains strict: no campaign becomes eligible until advertiser verification,
-- agreed payment, content moderation and final approval are all complete.
