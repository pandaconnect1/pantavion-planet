-- Pantavion Billing / Entitlements / Revenue Attribution Core
-- Provider-neutral storage; Stripe is the first planned provider adapter.

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_customer_id)
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capability text not null,
  source text not null default 'billing',
  status text not null default 'active' check (status in ('active','past_due','paused','revoked','expired')),
  provider text,
  provider_subscription_id text,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, capability, source)
);
create index if not exists entitlements_user_status_idx on public.entitlements(user_id, status);
create index if not exists entitlements_provider_subscription_idx on public.entitlements(provider, provider_subscription_id);

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  livemode boolean,
  payload jsonb not null,
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);
create index if not exists provider_webhook_events_status_idx on public.provider_webhook_events(provider, processing_status, received_at desc);

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text,
  provider_object_id text,
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  revenue_class text not null check (revenue_class in ('DIRECT_REVENUE','INDIRECT_REVENUE','INSTITUTIONAL_REVENUE','PUBLIC_GOOD_FREE','COST_CENTER','FUTURE_REGULATED')),
  event_kind text not null check (event_kind in ('checkout_completed','payment_succeeded','payment_failed','refund','subscription_started','subscription_changed','subscription_ended','adjustment')),
  amount_minor bigint,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id, event_kind)
);
create index if not exists revenue_events_module_time_idx on public.revenue_events(module, occurred_at desc);
create index if not exists revenue_events_user_time_idx on public.revenue_events(user_id, occurred_at desc);

create or replace function public.pantavion_billing_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger billing_customers_touch_updated_at before update on public.billing_customers
for each row execute function public.pantavion_billing_touch_updated_at();
create trigger entitlements_touch_updated_at before update on public.entitlements
for each row execute function public.pantavion_billing_touch_updated_at();

alter table public.billing_customers enable row level security;
alter table public.entitlements enable row level security;
alter table public.provider_webhook_events enable row level security;
alter table public.revenue_events enable row level security;

-- End users can see only their own customer mapping and entitlements.
create policy "billing customer owner read" on public.billing_customers for select using (auth.uid() = user_id);
create policy "entitlements owner read" on public.entitlements for select using (auth.uid() = user_id);
create policy "revenue owner read" on public.revenue_events for select using (auth.uid() = user_id);

-- No authenticated client write policies are granted. Provider webhook ingestion uses a server-only service-role client.
revoke all on public.provider_webhook_events from anon, authenticated;
revoke insert, update, delete on public.billing_customers from anon, authenticated;
revoke insert, update, delete on public.entitlements from anon, authenticated;
revoke insert, update, delete on public.revenue_events from anon, authenticated;
