-- Pantavion Universal Artifact Storage v2
-- Raise the private personal-media per-object ceiling from 1 GiB to 1.5 GiB.
-- MIME types remain unrestricted at the bucket layer; format/risk policy is enforced by Universal Artifact Intake.

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'personal-media'
  ) then
    raise exception 'personal_media_bucket_missing';
  end if;

  update storage.buckets
  set file_size_limit = 1610612736
  where id = 'personal-media';
end;
$$;

-- Truth guard: fail migration if the intended production value was not persisted.
do $$
declare
  v_limit bigint;
begin
  select file_size_limit
    into v_limit
  from storage.buckets
  where id = 'personal-media';

  if v_limit is distinct from 1610612736::bigint then
    raise exception 'personal_media_artifact_limit_not_applied:%', v_limit;
  end if;
end;
$$;
