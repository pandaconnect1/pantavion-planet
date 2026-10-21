-- Pantavion user-controlled communications archive, export files only.
-- This is NOT a live connector, not a cloned WhatsApp inbox and not E2EE.
-- User owns visibility; imported messages are never copied to Pantavion-native chat.
BEGIN;
INSERT INTO public.consent_purpose
 (purpose,title_el,explain_el,lawful_basis,requires_opt_in,minors_allowed,retention_note_el)
VALUES
 ('communications_archive_import',
  'Ιδιωτική εισαγωγή ιστορικού επικοινωνιών',
  'Εισάγονται αποκλειστικά μηνύματα και email από επιλεγμένο αρχείο, μετά από προεπισκόπηση και ρητή συγκατάθεση. Τα δεδομένα δεν δημοσιεύονται και δεν συγχρονίζονται με τρίτες υπηρεσίες.',
  'consent',true,true,
  'Ο χρήστης μπορεί να σταματήσει νέες εισαγωγές και χωριστά να διαγράψει οριστικά το ιδιωτικό αρχείο του.')
ON CONFLICT (purpose) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.imported_communication_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source_provider text NOT NULL CHECK (source_provider IN
   ('email_eml','email_mbox','whatsapp_export','chat_text_export')),
 record_kind text NOT NULL CHECK (record_kind IN ('email','chat')),
 source_filename text NOT NULL CHECK (length(source_filename) BETWEEN 1 AND 120),
 original_sender text,
 original_recipient text,
 original_subject text,
 original_text text NOT NULL CHECK (length(original_text) BETWEEN 1 AND 8000),
 sent_at timestamptz,
 fingerprint text NOT NULL CHECK (length(fingerprint)=32),
 consent_record_id uuid NOT NULL REFERENCES public.consent_records(id),
 imported_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,fingerprint)
);
CREATE INDEX IF NOT EXISTS imported_communication_records_owner_idx
 ON public.imported_communication_records(owner_id,imported_at DESC);

ALTER TABLE public.imported_communication_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.imported_communication_records FROM PUBLIC,anon,authenticated;
-- No direct REST/GraphQL access; use narrow owner-bound RPCs below.
-- RLS remains enabled as defense in depth.
DROP POLICY IF EXISTS imported_comm_owner_read ON public.imported_communication_records;
DROP POLICY IF EXISTS imported_comm_owner_delete ON public.imported_communication_records;
CREATE POLICY imported_comm_owner_read ON public.imported_communication_records
 FOR SELECT TO authenticated USING (owner_id=(SELECT auth.uid()));
CREATE POLICY imported_comm_owner_delete ON public.imported_communication_records
 FOR DELETE TO authenticated USING (owner_id=(SELECT auth.uid()));

-- Focused API: single authenticated actor, opt-in, bounded export files, no SQL access to other users.
CREATE OR REPLACE FUNCTION public.pantavion_import_communication_archive(
 p_provider text,
 p_filename text,
 p_records jsonb,
 p_confirmed boolean
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 actor uuid:=auth.uid();
 consent_id uuid;
 item jsonb;
 imported integer:=0;
 provider text:=lower(btrim(coalesce(p_provider,'')));
 kind text;
 sender text;
 recipient text;
 subject_line text;
 bodytext text;
 when_sent timestamptz;
 digest text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
 IF p_confirmed IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'explicit_consent_required'; END IF;
 IF provider NOT IN ('email_eml','email_mbox','whatsapp_export','chat_text_export') THEN
   RAISE EXCEPTION 'unsupported_source';
 END IF;
 IF length(coalesce(p_filename,'')) NOT BETWEEN 1 AND 120 THEN
   RAISE EXCEPTION 'invalid_filename';
 END IF;
 IF jsonb_typeof(p_records) IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'records_must_be_array';
 END IF;
 IF jsonb_array_length(p_records) NOT BETWEEN 1 AND 50 THEN
   RAISE EXCEPTION 'records_per_batch_must_be_1_to_50';
 END IF;

 INSERT INTO public.consent_records
 (user_id,purpose,status,source,granted_at,revoked_at,lawful_basis,metadata)
 VALUES (actor,'communications_archive_import','granted','explicit_user_file_import',now(),
         NULL,'consent',jsonb_build_object('provider',provider))
 ON CONFLICT (user_id,purpose) DO UPDATE SET
   status='granted',source='explicit_user_file_import',
   granted_at=now(),revoked_at=NULL,lawful_basis='consent',
   metadata=EXCLUDED.metadata,updated_at=now()
 RETURNING id INTO consent_id;

 FOR item IN SELECT value FROM jsonb_array_elements(p_records) LOOP
   IF jsonb_typeof(item)<>'object' THEN RAISE EXCEPTION 'invalid_record'; END IF;
   kind:=nullif(item->>'kind','');
   IF (provider IN ('email_eml','email_mbox') AND kind IS DISTINCT FROM 'email')
     OR (provider IN ('whatsapp_export','chat_text_export') AND kind IS DISTINCT FROM 'chat')
   THEN RAISE EXCEPTION 'source_kind_mismatch'; END IF;
   sender:=nullif(btrim(coalesce(item->>'sender','')),'');
   recipient:=nullif(btrim(coalesce(item->>'recipient','')),'');
   subject_line:=nullif(btrim(coalesce(item->>'subject','')),'');
   bodytext:=nullif(btrim(coalesce(item->>'text','')),'');
   IF bodytext IS NULL OR length(bodytext)>8000
     OR length(coalesce(sender,''))>250
     OR length(coalesce(recipient,''))>250
     OR length(coalesce(subject_line,''))>250
   THEN RAISE EXCEPTION 'invalid_record_fields'; END IF;

   when_sent:=NULL;
   IF nullif(item->>'sentAt','') IS NOT NULL THEN
     BEGIN
       when_sent:=(item->>'sentAt')::timestamptz;
     EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
       RAISE EXCEPTION 'invalid_record_date';
     END;
   END IF;

   -- md5 is for per-user deduplication ONLY, not authentication/integrity.
   digest:=md5(provider||chr(30)||coalesce(sender,'')||chr(30)||
     coalesce(recipient,'')||chr(30)||coalesce(subject_line,'')||chr(30)||
     bodytext||chr(30)||coalesce(when_sent::text,''));
   INSERT INTO public.imported_communication_records
      (owner_id,source_provider,record_kind,source_filename,original_sender,
       original_recipient,original_subject,original_text,sent_at,fingerprint,consent_record_id)
   VALUES
      (actor,provider,kind,left(p_filename,120),sender,recipient,subject_line,
       bodytext,when_sent,digest,consent_id)
   ON CONFLICT (owner_id,fingerprint) DO NOTHING;
   IF FOUND THEN imported:=imported+1; END IF;
 END LOOP;
 RETURN imported;
END
$function$;
REVOKE ALL ON FUNCTION public.pantavion_import_communication_archive(text,text,jsonb,boolean)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pantavion_import_communication_archive(text,text,jsonb,boolean)
 TO authenticated;

CREATE OR REPLACE FUNCTION public.pantavion_revoke_communications_archive_import()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
 UPDATE public.consent_records SET status='revoked',revoked_at=now(),updated_at=now()
  WHERE user_id=actor AND purpose='communications_archive_import'
    AND status='granted';
END
$function$;
REVOKE ALL ON FUNCTION public.pantavion_revoke_communications_archive_import()
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pantavion_revoke_communications_archive_import()
 TO authenticated;

CREATE OR REPLACE FUNCTION public.pantavion_list_imported_communication_archive(
 p_limit integer DEFAULT 100
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE actor uuid:=auth.uid(); output jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
 IF p_limit < 1 OR p_limit > 300 THEN RAISE EXCEPTION 'invalid_list_limit'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.imported_at DESC),'[]'::jsonb)
 INTO output FROM (
   SELECT id,source_provider,record_kind,original_sender,original_subject,
     left(original_text,600) AS original_text,sent_at,imported_at
   FROM public.imported_communication_records
   WHERE owner_id=actor ORDER BY imported_at DESC LIMIT p_limit
 ) AS t;
 RETURN output;
END
$function$;
REVOKE ALL ON FUNCTION public.pantavion_list_imported_communication_archive(integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pantavion_list_imported_communication_archive(integer)
 TO authenticated;

CREATE OR REPLACE FUNCTION public.pantavion_delete_imported_communication_archive()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE actor uuid:=auth.uid(); removed integer;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
 DELETE FROM public.imported_communication_records WHERE owner_id=actor;
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed;
END
$function$;
REVOKE ALL ON FUNCTION public.pantavion_delete_imported_communication_archive()
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pantavion_delete_imported_communication_archive()
 TO authenticated;

REVOKE SELECT,DELETE,INSERT,UPDATE ON public.imported_communication_records
 FROM PUBLIC,anon,authenticated;
COMMIT;
