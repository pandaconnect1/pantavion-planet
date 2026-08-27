-- Activate listing promotion only after a verified Stripe webhook has been processed.
-- provider_webhook_events is server-only; frontend redirects never reach this trigger.

create or replace function public.pantavion_apply_processed_listing_promotion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stripe_object jsonb;
  stripe_metadata jsonb;
  listing_id uuid;
  user_id uuid;
  session_id text;
  payment_id text;
  order_row public.listing_promotion_orders%rowtype;
begin
  if new.provider <> 'stripe'
     or new.event_type <> 'checkout.session.completed'
     or new.processing_status <> 'processed'
     or old.processing_status = 'processed' then
    return new;
  end if;

  stripe_object := coalesce(new.payload #> '{data,object}', '{}'::jsonb);
  stripe_metadata := coalesce(stripe_object -> 'metadata', '{}'::jsonb);
  session_id := nullif(stripe_object ->> 'id', '');
  payment_id := nullif(stripe_object ->> 'payment_intent', '');

  if session_id is null or stripe_metadata ->> 'pantavion_module' <> 'listings' then
    return new;
  end if;

  begin
    listing_id := (stripe_metadata ->> 'pantavion_listing_id')::uuid;
    user_id := (stripe_metadata ->> 'pantavion_user_id')::uuid;
  exception when others then
    return new;
  end;

  select * into order_row
  from public.listing_promotion_orders
  where provider = 'stripe'
    and provider_session_id = session_id
    and listing_promotion_orders.listing_id = listing_id
    and listing_promotion_orders.user_id = user_id
  for update;

  if not found or order_row.status = 'completed' then
    return new;
  end if;

  perform public.pantavion_apply_listing_promotion(
    listing_id,
    user_id,
    session_id,
    payment_id,
    order_row.duration_days,
    coalesce((stripe_object ->> 'amount_total')::bigint, order_row.amount_minor),
    coalesce(stripe_object ->> 'currency', order_row.currency)
  );

  return new;
end;
$$;

revoke all on function public.pantavion_apply_processed_listing_promotion() from public;

drop trigger if exists provider_webhook_apply_listing_promotion on public.provider_webhook_events;
create trigger provider_webhook_apply_listing_promotion
after update of processing_status on public.provider_webhook_events
for each row execute function public.pantavion_apply_processed_listing_promotion();
