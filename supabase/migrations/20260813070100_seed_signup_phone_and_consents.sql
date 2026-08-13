-- Follow-up signup seeding kept separate so phone ownership is never treated as verified
-- until a real verification flow succeeds.

create or replace function public.handle_new_user_signup_extras()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signup_phone text := nullif(new.raw_user_meta_data ->> 'signup_phone', '');
  v_terms_at timestamptz;
  v_privacy_at timestamptz;
begin
  if v_signup_phone is not null and v_signup_phone ~ '^\+[1-9][0-9]{7,14}$' then
    insert into public.user_phones (
      user_id,
      phone_e164,
      label,
      is_primary,
      login_enabled,
      recovery_enabled,
      discoverability_enabled,
      verified_at
    ) values (
      new.id,
      v_signup_phone,
      'personal',
      true,
      false,
      false,
      false,
      null
    ) on conflict do nothing;
  end if;

  begin
    v_terms_at := nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz;
  exception when others then
    v_terms_at := null;
  end;

  begin
    v_privacy_at := nullif(new.raw_user_meta_data ->> 'privacy_accepted_at', '')::timestamptz;
  exception when others then
    v_privacy_at := null;
  end;

  if v_terms_at is not null then
    insert into public.consent_records (user_id, purpose, status, source, granted_at, metadata)
    values (new.id, 'terms_of_use', 'granted', 'registration', v_terms_at, jsonb_build_object('captured_at_signup', true));
  end if;

  if v_privacy_at is not null then
    insert into public.consent_records (user_id, purpose, status, source, granted_at, metadata)
    values (new.id, 'privacy_policy_acknowledgement', 'granted', 'registration', v_privacy_at, jsonb_build_object('captured_at_signup', true));
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_signup_extras on auth.users;
create trigger on_auth_user_created_signup_extras
after insert on auth.users
for each row execute procedure public.handle_new_user_signup_extras();
