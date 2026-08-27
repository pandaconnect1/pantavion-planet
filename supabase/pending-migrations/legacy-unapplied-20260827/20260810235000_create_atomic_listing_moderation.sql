-- Atomic listing moderation transition.
-- Callable only by service_role; the API authenticates and authorizes the human actor first.

create or replace function public.pantavion_moderate_listing(
  p_listing_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_reason text default null,
  p_authority_role text default null,
  p_authority_source text default null
)
returns table (
  listing_id uuid,
  previous_state text,
  next_state text,
  published_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.public_listings%rowtype;
  v_next text;
  v_audit_action text;
begin
  select * into v_listing
  from public.public_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  v_next := case p_action
    when 'review' then case when v_listing.lifecycle_state = 'submitted' then 'under_review' end
    when 'approve' then case when v_listing.lifecycle_state in ('submitted','under_review') then 'approved' end
    when 'reject' then case when v_listing.lifecycle_state in ('submitted','under_review','approved') then 'rejected' end
    when 'publish' then case when v_listing.lifecycle_state = 'approved' then 'published' end
    when 'remove' then case when v_listing.lifecycle_state in ('published','approved','under_review') then 'removed' end
    when 'expire' then case when v_listing.lifecycle_state in ('published','approved') then 'expired' end
    when 'archive' then case when v_listing.lifecycle_state in ('removed','expired','rejected','fulfilled','sold','rented') then 'archived' end
    else null
  end;

  if v_next is null then
    raise exception 'invalid_state_transition:%:%', v_listing.lifecycle_state, p_action;
  end if;

  if p_action in ('reject','remove') and coalesce(trim(p_reason), '') = '' then
    raise exception 'reason_required';
  end if;

  update public.public_listings
  set lifecycle_state = v_next,
      moderation_note = p_reason,
      published_at = case
        when v_next = 'published' and published_at is null then now()
        else published_at
      end
  where id = p_listing_id;

  v_audit_action := case when p_action = 'review' then 'submit_review' else p_action end;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    previous_state,
    next_state,
    reason,
    metadata
  ) values (
    p_actor_user_id,
    'listing',
    p_listing_id,
    v_audit_action,
    v_listing.lifecycle_state,
    v_next,
    p_reason,
    jsonb_build_object(
      'authorityRole', p_authority_role,
      'authoritySource', p_authority_source
    )
  );

  return query
  select l.id, v_listing.lifecycle_state, l.lifecycle_state, l.published_at, l.updated_at
  from public.public_listings l
  where l.id = p_listing_id;
end;
$$;

revoke all on function public.pantavion_moderate_listing(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.pantavion_moderate_listing(uuid, uuid, text, text, text, text) to service_role;
