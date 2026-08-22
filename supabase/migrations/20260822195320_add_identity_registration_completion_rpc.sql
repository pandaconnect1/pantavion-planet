create or replace function public.pantavion_complete_registration_profile(
  p_username text,
  p_display_name text,
  p_country text,
  p_country_code text,
  p_language text,
  p_legal_first_name text,
  p_legal_last_name text,
  p_date_of_birth date
)
returns table(registration_state text, protected_by_default boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_country text := btrim(coalesce(p_country, ''));
  v_country_code text := upper(btrim(coalesce(p_country_code, '')));
  v_language text := lower(btrim(coalesce(p_language, '')));
  v_first_name text := btrim(coalesce(p_legal_first_name, ''));
  v_last_name text := btrim(coalesce(p_legal_last_name, ''));
  v_email_confirmed_at timestamptz;
  v_registration_state text;
begin
  if actor is null then
    raise exception 'pantavion_identity_not_authenticated' using errcode = '28000';
  end if;

  select u.email_confirmed_at
  into v_email_confirmed_at
  from auth.users u
  where u.id = actor;

  if v_email_confirmed_at is null then
    raise exception 'pantavion_identity_email_confirmation_required' using errcode = '42501';
  end if;

  select s.state
  into v_registration_state
  from public.profile_registration_states s
  where s.user_id = actor
  for update;

  if v_registration_state is null then
    raise exception 'pantavion_identity_registration_state_missing' using errcode = 'P0001';
  end if;

  if v_registration_state not in ('profile_completion_required', 'active', 'minor_protected') then
    raise exception 'pantavion_identity_registration_not_completable' using errcode = '42501';
  end if;

  if v_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'pantavion_identity_username_invalid' using errcode = '22023';
  end if;

  if char_length(v_display_name) < 1 or char_length(v_display_name) > 120 then
    raise exception 'pantavion_identity_display_name_invalid' using errcode = '22023';
  end if;

  if char_length(v_country) < 2 or char_length(v_country) > 120 then
    raise exception 'pantavion_identity_country_invalid' using errcode = '22023';
  end if;

  if v_country_code !~ '^[A-Z]{2}$' then
    raise exception 'pantavion_identity_country_code_invalid' using errcode = '22023';
  end if;

  if v_language !~ '^[a-z0-9-]{2,16}$' then
    raise exception 'pantavion_identity_language_invalid' using errcode = '22023';
  end if;

  if char_length(v_first_name) < 1 or char_length(v_first_name) > 80
     or char_length(v_last_name) < 1 or char_length(v_last_name) > 80 then
    raise exception 'pantavion_identity_legal_name_invalid' using errcode = '22023';
  end if;

  if p_date_of_birth is null
     or p_date_of_birth > current_date
     or p_date_of_birth < (current_date - interval '120 years')::date then
    raise exception 'pantavion_identity_date_of_birth_invalid' using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    country,
    country_code,
    language,
    updated_at
  )
  values (
    actor,
    v_username,
    v_display_name,
    v_country,
    v_country_code,
    v_language,
    now()
  )
  on conflict (id) do update
  set username = excluded.username,
      display_name = excluded.display_name,
      country = excluded.country,
      country_code = excluded.country_code,
      language = excluded.language,
      updated_at = now();

  insert into public.profile_private_details (
    user_id,
    legal_first_name,
    legal_last_name,
    country_code,
    date_of_birth,
    updated_at
  )
  values (
    actor,
    v_first_name,
    v_last_name,
    v_country_code,
    p_date_of_birth,
    now()
  )
  on conflict (user_id) do update
  set legal_first_name = excluded.legal_first_name,
      legal_last_name = excluded.legal_last_name,
      country_code = excluded.country_code,
      date_of_birth = excluded.date_of_birth,
      updated_at = now();

  return query
  select c.registration_state, c.protected_by_default
  from public.pantavion_complete_own_profile() c;
end;
$$;

revoke all on function public.pantavion_complete_registration_profile(text, text, text, text, text, text, text, date) from public, anon;
grant execute on function public.pantavion_complete_registration_profile(text, text, text, text, text, text, text, date) to authenticated;
