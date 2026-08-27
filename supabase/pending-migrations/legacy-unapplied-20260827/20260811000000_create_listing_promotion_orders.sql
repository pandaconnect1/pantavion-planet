-- Pantavion listing promotion orders
-- A redirect/success page never activates promotion. Only a verified provider webhook may apply it.

create table if not exists public.listing_promotion_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.public_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_session_id text unique,
  provider_payment_id text,
  status text not null default 'pending' check (status in ('pending','completed','failed','cancelled','refunded')),
  duration_days integer not null default 7 check (duration_days between 1 and 90),
  amount_minor bigint,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists listing_promotion_orders_listing_idx on public.listing_promotion_orders(listing_id, created_at desc);
create index if not exists listing_promotion_orders_user_idx on public.listing_promotion_orders(user_id, created_at desc);

create trigger listing_promotion_orders_touch_updated_at
before update on public.listing_promotion_orders
for each row execute function public.pantavion_billing_touch_updated_at();

alter table public.listing_promotion_orders enable row level security;
create policy "promotion order owner read" on public.listing_promotion_orders for select using (auth.uid() = user_id);
revoke insert, update, delete on public.listing_promotion_orders from anon, authenticated;
grant select on public.listing_promotion_orders to authenticated;

create or replace function public.pantavion_apply_listing_promotion(
  p_listing_id uuid,
  p_user_id uuid,
  p_provider_session_id text,
  p_provider_payment_id text,
  p_duration_days integer,
  p_amount_minor bigint,
  p_currency text
)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  listing_row public.public_listings%rowtype;
  promotion_until timestamptz;
begin
  if p_duration_days is null or p_duration_days < 1 or p_duration_days > 90 then
    raise exception 'invalid promotion duration';
  end if;

  select * into listing_row from public.public_listings where id = p_listing_id for update;
  if not found then raise exception 'listing not found'; end if;
  if listing_row.owner_id <> p_user_id then raise exception 'listing owner mismatch'; end if;
  if listing_row.lifecycle_state <> 'published' then raise exception 'listing must be published'; end if;

  promotion_until := greatest(coalesce(listing_row.promotion_expires_at, now()), now()) + make_interval(days => p_duration_days);

  update public.public_listings
  set paid_promotion = true,
      promotion_expires_at = promotion_until
  where id = p_listing_id;

  update public.listing_promotion_orders
  set status = 'completed',
      provider_payment_id = p_provider_payment_id,
      amount_minor = p_amount_minor,
      currency = p_currency,
      completed_at = now()
  where provider = 'stripe'
    and provider_session_id = p_provider_session_id
    and listing_id = p_listing_id
    and user_id = p_user_id;

  return promotion_until;
end;
$$;

revoke all on function public.pantavion_apply_listing_promotion(uuid, uuid, text, text, integer, bigint, text) from public;
-- service_role invokes this through the server-only Supabase admin client.
