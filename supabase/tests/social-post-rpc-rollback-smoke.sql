-- Manual privileged test only, NEVER scheduled on production.
-- Uses the already present founder account's ID as a database test identity,
-- not the person's password or a forged web session.
-- Guarantees ROLLBACK; does not persist posts, likes, comments or new users.
BEGIN;
SELECT set_config('request.jwt.claim.sub',
                  (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1),
                  true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  actor uuid := auth.uid();
  test_post uuid;
  test_comment uuid;
  outsider uuid := gen_random_uuid();
  n integer;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Missing test actor'; END IF;
  test_post := public.pantavion_create_social_post('[TRANSACTIONAL SOCIAL TEST]', 'private', 'social', null);
  IF test_post IS NULL THEN RAISE EXCEPTION 'POST_CREATE_FAILED'; END IF;
  SELECT count(*) INTO n FROM public.social_posts WHERE id=test_post;
  IF n <> 1 THEN RAISE EXCEPTION 'POST_OWNER_READ_FAILED'; END IF;
  PERFORM set_config('request.jwt.claim.sub', outsider::text, true);
  SELECT count(*) INTO n FROM public.social_posts WHERE id=test_post;
  IF n <> 0 THEN RAISE EXCEPTION 'PRIVATE_POST_RLS_LEAK'; END IF;
  PERFORM set_config('request.jwt.claim.sub', actor::text, true);
  PERFORM public.pantavion_set_social_reaction(test_post, 'like');
  SELECT count(*) INTO n FROM public.social_reactions WHERE post_id=test_post AND user_id=actor;
  IF n <> 1 THEN RAISE EXCEPTION 'LIKE_FAILED'; END IF;
  test_comment := public.pantavion_add_social_comment(test_post, '[TEST COMMENT]', null);
  SELECT count(*) INTO n FROM public.social_comments WHERE id=test_comment;
  IF n <> 1 THEN RAISE EXCEPTION 'COMMENT_FAILED'; END IF;
  PERFORM public.pantavion_remove_social_reaction(test_post);
  SELECT count(*) INTO n FROM public.social_reactions WHERE post_id=test_post AND user_id=actor;
  IF n <> 0 THEN RAISE EXCEPTION 'UNLIKE_FAILED'; END IF;
  PERFORM public.pantavion_delete_social_post(test_post);
  SELECT count(*) INTO n FROM public.social_posts WHERE id=test_post AND deleted_at IS NOT NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'DELETE_FAILED'; END IF;
  RAISE NOTICE 'Social DB create / owner read / private deny / like / comment / unlike / delete: PASS';
END $$;
ROLLBACK;
