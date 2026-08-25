create or replace function public.pantavion_add_manual_contact(p_display_name text default null,p_email text default null,p_phone text default null)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); cid uuid; clean_name text:=nullif(btrim(coalesce(p_display_name,'')),''); clean_email text:=nullif(lower(btrim(coalesce(p_email,''))),''); clean_phone text:=nullif(regexp_replace(coalesce(p_phone,''),'[^0-9+]','','g'),'');
begin
 if actor is null then raise exception 'authentication required'; end if;
 if clean_name is null and clean_email is null and clean_phone is null then raise exception 'empty contact'; end if;
 insert into public.contacts(owner_id,display_name,email,phone,metadata)
 values(actor,clean_name,clean_email,clean_phone,jsonb_build_object('imported_via','manual')) returning id into cid;
 return cid;
end $$;
revoke all on function public.pantavion_add_manual_contact(text,text,text) from public,anon;
grant execute on function public.pantavion_add_manual_contact(text,text,text) to authenticated;

create or replace function public.pantavion_import_contacts_batch(p_source_type text,p_filename text,p_contacts jsonb)
returns integer language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); consent_id uuid; source_id uuid; item jsonb; imported integer:=0; clean_name text; clean_email text; clean_phone text; source_kind text:=lower(btrim(coalesce(p_source_type,'')));
begin
 if actor is null then raise exception 'authentication required'; end if;
 if source_kind not in ('vcard','csv') then raise exception 'unsupported contact source'; end if;
 if jsonb_typeof(p_contacts)<>'array' then raise exception 'contacts must be an array'; end if;
 if jsonb_array_length(p_contacts)>10000 then raise exception 'contact batch too large'; end if;
 insert into public.consent_records(user_id,purpose,status,source,granted_at,metadata)
 values(actor,'contact_import','granted','user_file_import',now(),jsonb_build_object('filename',left(coalesce(p_filename,''),255),'count',jsonb_array_length(p_contacts))) returning id into consent_id;
 insert into public.contact_sources(owner_id,source_type,consent_record_id,status,last_synced_at,external_account_hint)
 values(actor,source_kind,consent_id,'active',now(),nullif(left(btrim(coalesce(p_filename,'')),255),'')) returning id into source_id;
 for item in select value from jsonb_array_elements(p_contacts)
 loop
   clean_name:=nullif(left(btrim(coalesce(item->>'display_name','')),200),'');
   clean_email:=nullif(left(lower(btrim(coalesce(item->>'email',''))),320),'');
   clean_phone:=nullif(left(regexp_replace(coalesce(item->>'phone',''),'[^0-9+]','','g'),64),'');
   if clean_name is not null or clean_email is not null or clean_phone is not null then
     insert into public.contacts(owner_id,source_id,source_external_id,display_name,email,phone,metadata)
     values(actor,source_id,concat(coalesce(left(p_filename,180),'import'),':',imported),clean_name,clean_email,clean_phone,jsonb_build_object('imported_via','file','filename',left(coalesce(p_filename,''),255)));
     imported:=imported+1;
   end if;
 end loop;
 return imported;
end $$;
revoke all on function public.pantavion_import_contacts_batch(text,text,jsonb) from public,anon;
grant execute on function public.pantavion_import_contacts_batch(text,text,jsonb) to authenticated;

revoke insert,update,delete,truncate on public.contacts from authenticated;
revoke insert,update,delete,truncate on public.contact_sources from authenticated;
revoke insert,update,delete,truncate on public.consent_records from authenticated;
