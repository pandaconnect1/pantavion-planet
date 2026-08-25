create or replace function public.pantavion_create_social_post(p_body text,p_visibility text default 'public',p_context text default 'social',p_location_label text default null)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); pid uuid; clean text:=nullif(btrim(coalesce(p_body,'')),'');
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_visibility not in ('public','connections','private') then raise exception 'invalid visibility'; end if;
 if p_context not in ('social','people','community') then raise exception 'invalid context'; end if;
 if clean is null or char_length(clean)>10000 then raise exception 'invalid post body'; end if;
 if not public.pantavion_internal.safety_allows_public_activity(actor) then raise exception 'public activity restricted'; end if;
 if exists(select 1 from public.profile_safety_controls s where s.user_id=actor and (s.control_state<>'active' or s.identity_review_required)) then raise exception 'safety review required'; end if;
 insert into public.social_posts(author_id,body,visibility,context,location_label) values(actor,clean,p_visibility,p_context,nullif(btrim(coalesce(p_location_label,'')),'')) returning id into pid;
 return pid;
end $$;

create or replace function public.pantavion_update_social_post(p_post_id uuid,p_body text,p_visibility text default null)
returns void language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); clean text:=nullif(btrim(coalesce(p_body,'')),'');
begin
 if actor is null then raise exception 'authentication required'; end if;
 if clean is null or char_length(clean)>10000 then raise exception 'invalid post body'; end if;
 if p_visibility is not null and p_visibility not in ('public','connections','private') then raise exception 'invalid visibility'; end if;
 if not exists(select 1 from public.social_posts where id=p_post_id and author_id=actor and deleted_at is null) then raise exception 'post not editable'; end if;
 if not public.pantavion_internal.safety_allows_public_activity(actor) then raise exception 'public activity restricted'; end if;
 update public.social_posts set body=clean,visibility=coalesce(p_visibility,visibility),updated_at=now() where id=p_post_id and author_id=actor;
end $$;

create or replace function public.pantavion_delete_social_post(p_post_id uuid)
returns void language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); begin
 if actor is null then raise exception 'authentication required'; end if;
 update public.social_posts set deleted_at=coalesce(deleted_at,now()),updated_at=now() where id=p_post_id and author_id=actor and deleted_at is null;
 if not found then raise exception 'post not deletable'; end if;
end $$;

create or replace function public.pantavion_add_social_comment(p_post_id uuid,p_body text,p_parent_comment_id uuid default null)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); cid uuid; clean text:=nullif(btrim(coalesce(p_body,'')),''); begin
 if actor is null then raise exception 'authentication required'; end if;
 if clean is null or char_length(clean)>5000 then raise exception 'invalid comment body'; end if;
 if not public.pantavion_internal.safety_allows_public_activity(actor) then raise exception 'public activity restricted'; end if;
 if not exists(select 1 from public.social_posts p where p.id=p_post_id and p.deleted_at is null and (p.author_id=actor or p.visibility='public' or (p.visibility='connections' and public.pantavion_are_connections(p.author_id,actor)))) then raise exception 'post not accessible'; end if;
 if p_parent_comment_id is not null and not exists(select 1 from public.social_comments c where c.id=p_parent_comment_id and c.post_id=p_post_id and c.deleted_at is null) then raise exception 'invalid parent comment'; end if;
 insert into public.social_comments(post_id,author_id,body,parent_comment_id) values(p_post_id,actor,clean,p_parent_comment_id) returning id into cid; return cid;
end $$;

create or replace function public.pantavion_delete_social_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path='public','pg_temp' as $$ declare actor uuid:=auth.uid(); begin if actor is null then raise exception 'authentication required'; end if; update public.social_comments set deleted_at=coalesce(deleted_at,now()) where id=p_comment_id and author_id=actor and deleted_at is null; if not found then raise exception 'comment not deletable'; end if; end $$;

create or replace function public.pantavion_set_social_reaction(p_post_id uuid,p_reaction text default 'like')
returns void language plpgsql security definer set search_path='public','pg_temp' as $$ declare actor uuid:=auth.uid(); begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_reaction not in ('like','love','support','insightful') then raise exception 'invalid reaction'; end if;
 if not exists(select 1 from public.social_posts p where p.id=p_post_id and p.deleted_at is null and (p.author_id=actor or p.visibility='public' or (p.visibility='connections' and public.pantavion_are_connections(p.author_id,actor)))) then raise exception 'post not accessible'; end if;
 insert into public.social_reactions(post_id,user_id,reaction) values(p_post_id,actor,p_reaction) on conflict (post_id,user_id) do update set reaction=excluded.reaction,created_at=now();
end $$;

create or replace function public.pantavion_remove_social_reaction(p_post_id uuid)
returns void language plpgsql security definer set search_path='public','pg_temp' as $$ declare actor uuid:=auth.uid(); begin if actor is null then raise exception 'authentication required'; end if; delete from public.social_reactions where post_id=p_post_id and user_id=actor; end $$;

revoke all on function public.pantavion_create_social_post(text,text,text,text) from public,anon;
revoke all on function public.pantavion_update_social_post(uuid,text,text) from public,anon;
revoke all on function public.pantavion_delete_social_post(uuid) from public,anon;
revoke all on function public.pantavion_add_social_comment(uuid,text,uuid) from public,anon;
revoke all on function public.pantavion_delete_social_comment(uuid) from public,anon;
revoke all on function public.pantavion_set_social_reaction(uuid,text) from public,anon;
revoke all on function public.pantavion_remove_social_reaction(uuid) from public,anon;
grant execute on function public.pantavion_create_social_post(text,text,text,text), public.pantavion_update_social_post(uuid,text,text), public.pantavion_delete_social_post(uuid), public.pantavion_add_social_comment(uuid,text,uuid), public.pantavion_delete_social_comment(uuid), public.pantavion_set_social_reaction(uuid,text), public.pantavion_remove_social_reaction(uuid) to authenticated;

revoke insert,update,delete,truncate on public.social_posts from authenticated;
revoke insert,update,delete,truncate on public.social_comments from authenticated;
revoke insert,update,delete,truncate on public.social_reactions from authenticated;
