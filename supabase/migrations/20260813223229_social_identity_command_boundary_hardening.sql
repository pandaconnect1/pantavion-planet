-- Pantavion command-boundary hardening for identity/social runtime.

-- 1) Messaging/relationship state changes must go through vetted RPC commands.
revoke all on table public.relationships from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.conversation_members from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.message_receipts from anon, authenticated;

grant select on table public.relationships to authenticated;
grant select on table public.conversations to authenticated;
grant select on table public.conversation_members to authenticated;
grant select on table public.messages to authenticated;
grant select on table public.message_receipts to authenticated;

revoke all on function public.pantavion_request_relationship(uuid) from public, anon;
revoke all on function public.pantavion_respond_relationship(uuid,text) from public, anon;
revoke all on function public.pantavion_create_direct_conversation(uuid) from public, anon;
revoke all on function public.pantavion_send_message(uuid,text,text,text) from public, anon;
revoke all on function public.pantavion_mark_message_receipt(uuid,text) from public, anon;

grant execute on function public.pantavion_request_relationship(uuid) to authenticated;
grant execute on function public.pantavion_respond_relationship(uuid,text) to authenticated;
grant execute on function public.pantavion_create_direct_conversation(uuid) to authenticated;
grant execute on function public.pantavion_send_message(uuid,text,text,text) to authenticated;
grant execute on function public.pantavion_mark_message_receipt(uuid,text) to authenticated;

-- 2) Blocking is a command, not arbitrary table mutation.
create or replace function public.pantavion_block_user(p_blocked_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  clean_reason text := nullif(left(btrim(coalesce(p_reason,'')), 500), '');
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_blocked_id is null or p_blocked_id = actor then
    raise exception 'invalid blocked user' using errcode = '22023';
  end if;

  insert into public.user_blocks(blocker_id, blocked_id, reason)
  values(actor, p_blocked_id, clean_reason)
  on conflict (blocker_id, blocked_id)
  do update set reason = excluded.reason;
end;
$$;

create or replace function public.pantavion_unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  delete from public.user_blocks
  where blocker_id = actor and blocked_id = p_blocked_id;
end;
$$;

revoke all on table public.user_blocks from anon, authenticated;
grant select on table public.user_blocks to authenticated;
revoke all on function public.pantavion_block_user(uuid,text) from public, anon;
revoke all on function public.pantavion_unblock_user(uuid) from public, anon;
grant execute on function public.pantavion_block_user(uuid,text) to authenticated;
grant execute on function public.pantavion_unblock_user(uuid) to authenticated;

-- 3) Clients may manage their own contact methods, but cannot self-verify them.
create or replace function public.pantavion_guard_contact_verification()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.verification_state := 'unverified';
      new.verified_at := null;
    else
      if new.value is distinct from old.value
         or new.normalized_value is distinct from old.normalized_value
         or new.kind is distinct from old.kind then
        new.verification_state := 'unverified';
        new.verified_at := null;
      else
        new.verification_state := old.verification_state;
        new.verified_at := old.verified_at;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pantavion_guard_contact_verification on public.profile_contact_methods;
create trigger pantavion_guard_contact_verification
before insert or update on public.profile_contact_methods
for each row execute function public.pantavion_guard_contact_verification();

-- 4) Age classification is derived from DOB; assurance/guardian state is not client-authoritative.
create or replace function public.pantavion_guard_age_classification()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare years_old int;
begin
  if new.date_of_birth is not null then
    years_old := extract(year from age(current_date, new.date_of_birth));
    if years_old < 0 then
      raise exception 'invalid date of birth' using errcode = '22023';
    elsif years_old < 13 then
      new.age_band := 'child';
      new.declared_age_group := 'minor';
    elsif years_old < 18 then
      new.age_band := 'teen';
      new.declared_age_group := 'minor';
    else
      if coalesce(new.age_assurance_state,'unverified') <> 'verified' then
        new.age_band := 'adult';
      end if;
      new.declared_age_group := 'adult';
    end if;
  else
    new.age_band := 'unknown';
    new.declared_age_group := 'unconfirmed';
  end if;

  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.age_assurance_state := 'unverified';
      new.guardian_consent_state := case when new.declared_age_group = 'minor' then 'pending' else 'not_applicable' end;
    else
      -- A normal user cannot promote their own assurance or guardian-consent state.
      new.age_assurance_state := old.age_assurance_state;
      new.guardian_consent_state := old.guardian_consent_state;
      if new.date_of_birth is distinct from old.date_of_birth then
        new.age_assurance_state := 'unverified';
        new.guardian_consent_state := case when new.declared_age_group = 'minor' then 'pending' else 'not_applicable' end;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pantavion_guard_age_classification on public.profile_private_details;
create trigger pantavion_guard_age_classification
before insert or update on public.profile_private_details
for each row execute function public.pantavion_guard_age_classification();
