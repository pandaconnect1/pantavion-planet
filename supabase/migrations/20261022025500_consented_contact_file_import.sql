-- Repair an actually broken user journey: the legacy import RPC wrote a
-- consent purpose ("contact_import") which did NOT exist in consent_purpose.
-- The new RPC requires affirmative approval of a previewed local file.
-- No external service, Vercel, scraping or access to provider passwords.
BEGIN;

INSERT INTO public.consent_purpose
(purpose,title_el,explain_el,lawful_basis,requires_opt_in,minors_allowed,retention_note_el)
VALUES (
  'contact_import','Εισαγωγή προσωπικού βιβλίου επαφών',
  'Εισαγωγή μόνο επαφών από αρχείο που ο χρήστης επέλεξε. Αποθήκευση ιδιωτικά, με καταγραφή προέλευσης, δυνατότητα ανάκλησης και διαγραφής.',
  'consent',true,true,
  'Οι εισαγμένες επαφές είναι ιδιωτικές. Η ανάκληση σταματά νέες εισαγωγές· η διαγραφή αποθηκευμένων επαφών είναι χωριστή ενέργεια.'
) ON CONFLICT (purpose) DO NOTHING;

-- Old command had no affirmative consent parameter and auto-created consent
-- records. Retire it so callers cannot bypass the explicit confirmation.
REVOKE ALL ON FUNCTION public.pantavion_import_contacts_batch(text,text,jsonb)
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pantavion_import_contacts_consented(
  p_source_type text,
  p_filename text,
  p_contacts jsonb,
  p_confirmed boolean
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $func$
DECLARE
  actor uuid := auth.uid();
  consent_id uuid;
  source_id uuid;
  item jsonb;
  imported integer := 0;
  name_clean text;
  email_clean text;
  phone_clean text;
  kind text := lower(btrim(coalesce(p_source_type,'')));
  count_items integer;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'explicit confirmation required';
  END IF;
  IF kind NOT IN ('csv','vcard') THEN RAISE EXCEPTION 'unsupported file type'; END IF;
  IF jsonb_typeof(p_contacts) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid contact array';
  END IF;
  count_items := jsonb_array_length(p_contacts);
  IF count_items < 1 OR count_items > 500 THEN
    RAISE EXCEPTION 'contact batch must contain 1 to 500 entries';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups
    WHERE ups.user_id=actor AND ups.contact_import_enabled=true
  ) THEN
    RAISE EXCEPTION 'enable private contact import in your privacy settings first';
  END IF;

  INSERT INTO public.consent_records
    (user_id,purpose,status,source,granted_at,lawful_basis,metadata)
  VALUES (actor,'contact_import','granted','explicit_user_file_import',now(),
          'consent',jsonb_build_object('format',kind,'count',count_items))
  RETURNING id INTO consent_id;

  INSERT INTO public.contact_sources
    (owner_id,source_type,consent_record_id,status,last_synced_at,external_account_hint)
  VALUES (actor,kind,consent_id,'active',now(),
          nullif(left(btrim(coalesce(p_filename,'')),120),''))
  RETURNING id INTO source_id;

  FOR item IN SELECT value FROM jsonb_array_elements(p_contacts) LOOP
    IF jsonb_typeof(item)<>'object' THEN
      RAISE EXCEPTION 'invalid contact item';
    END IF;
    IF length(coalesce(item->>'display_name',''))>1000
       OR length(coalesce(item->>'email',''))>1000
       OR length(coalesce(item->>'phone',''))>1000 THEN
      RAISE EXCEPTION 'contact item too long';
    END IF;
    name_clean := nullif(left(btrim(coalesce(item->>'display_name','')),200),'');
    email_clean := nullif(left(lower(btrim(coalesce(item->>'email',''))),320),'');
    phone_clean := nullif(left(
      regexp_replace(coalesce(item->>'phone',''),'[^0-9+]','','g'),64),'');
    IF name_clean IS NULL AND email_clean IS NULL AND phone_clean IS NULL THEN
      CONTINUE;
    END IF;
    IF email_clean IS NOT NULL AND (
      position('@' IN email_clean)=0 OR position(' ' IN email_clean)>0
    ) THEN RAISE EXCEPTION 'invalid contact email'; END IF;

    -- Don't multiply an already-owned address book after repeated uploads.
    IF EXISTS (
      SELECT 1 FROM public.contacts c WHERE c.owner_id=actor AND
      (
        (email_clean IS NOT NULL AND lower(c.email)=email_clean)
        OR (phone_clean IS NOT NULL AND c.phone=phone_clean)
      )
    ) THEN CONTINUE; END IF;

    INSERT INTO public.contacts(
      owner_id,source_id,display_name,email,phone,metadata
    ) VALUES (
      actor,source_id,name_clean,email_clean,phone_clean,
      jsonb_build_object('imported_via','consented_file','format',kind)
    );
    imported := imported+1;
  END LOOP;
  RETURN imported;
END;
$func$;

REVOKE ALL ON FUNCTION public.pantavion_import_contacts_consented(text,text,jsonb,boolean)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pantavion_import_contacts_consented(text,text,jsonb,boolean)
TO authenticated;
COMMIT;
