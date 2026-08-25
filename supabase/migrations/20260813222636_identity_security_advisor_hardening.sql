-- Harden the new Identity/Trust surface without breaking authenticated owner flows.

-- Sensitive internal tables must not be directly visible before sign-in.
revoke all on table public.profile_age_assurance from anon;
revoke all on table public.profile_security_posture from anon;
revoke all on table public.public_registration_gate from anon;

-- Registration gate is read only through the deliberately narrow status RPCs.
revoke all on table public.public_registration_gate from authenticated;

drop policy if exists public_registration_gate_no_direct_access on public.public_registration_gate;
create policy public_registration_gate_no_direct_access
on public.public_registration_gate
for select
to anon, authenticated
using (false);

-- Founder aggregate must never be callable anonymously. The function itself
-- also performs a founder-role check for authenticated callers.
revoke execute on function public.pantavion_registration_stats(text,text,text) from public;
revoke execute on function public.pantavion_registration_stats(text,text,text) from anon;
grant execute on function public.pantavion_registration_stats(text,text,text) to authenticated;

-- Optimize our new owner RLS policies so auth.uid() is initialized once.
drop policy if exists profile_security_posture_owner_read on public.profile_security_posture;
create policy profile_security_posture_owner_read
on public.profile_security_posture
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists profile_age_assurance_owner_read on public.profile_age_assurance;
create policy profile_age_assurance_owner_read
on public.profile_age_assurance
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Remove the redundant explicit duplicate index; the UNIQUE constraint index remains.
drop index if exists public.profile_contact_methods_unique_normalized;

-- High-value FK indexes for People/Contacts/Chat runtime at scale.
create index if not exists contact_sources_owner_id_idx on public.contact_sources(owner_id);
create index if not exists contact_sources_consent_record_id_idx on public.contact_sources(consent_record_id) where consent_record_id is not null;
create index if not exists contacts_source_id_idx on public.contacts(source_id) where source_id is not null;
create index if not exists contacts_linked_user_id_idx on public.contacts(linked_user_id) where linked_user_id is not null;
create index if not exists conversations_created_by_idx on public.conversations(created_by);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_reply_to_message_id_idx on public.messages(reply_to_message_id) where reply_to_message_id is not null;
create index if not exists message_receipts_user_id_idx on public.message_receipts(user_id);
create index if not exists user_blocks_blocked_id_idx on public.user_blocks(blocked_id);
create index if not exists public_registration_gate_updated_by_idx on public.public_registration_gate(updated_by) where updated_by is not null;
