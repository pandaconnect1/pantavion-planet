-- Pantavion Personal Space: private-by-default media library.

create table if not exists public.personal_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  media_kind text not null check (media_kind in ('photo','video','audio','document','other')),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  visibility text not null default 'private' check (visibility in ('private','connections','public')),
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, storage_path)
);

create index if not exists personal_media_owner_created_idx
  on public.personal_media(owner_id, created_at desc);

alter table public.personal_media enable row level security;

create policy "personal media owner read"
on public.personal_media for select
using (auth.uid() = owner_id);

create policy "personal media owner insert"
on public.personal_media for insert
with check (auth.uid() = owner_id);

create policy "personal media owner update"
on public.personal_media for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "personal media owner delete"
on public.personal_media for delete
using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('personal-media', 'personal-media', false, 1073741824)
on conflict (id) do update set public = false;

create policy "personal media storage owner read"
on storage.objects for select
to authenticated
using (bucket_id = 'personal-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "personal media storage owner insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'personal-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "personal media storage owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'personal-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'personal-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "personal media storage owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'personal-media' and (storage.foldername(name))[1] = auth.uid()::text);
