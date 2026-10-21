-- Production security repair verified 2026-10-22 UTC; the same RLS change was
-- applied via Supabase SQL before this migration was checked in.
-- Re-runnable for new environments; no rows, maps, identities or assets modified.
-- Previous PERMISSIVE safety_read policy admitted any authenticated viewer of
-- a safe author's PRIVATE posts. Safety_update permitted unowned UPDATE if a
-- future table grant was added. Post privacy and blocks MUST compose with safety.
BEGIN;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_posts_read ON public.social_posts;
DROP POLICY IF EXISTS social_posts_safety_read ON public.social_posts;
DROP POLICY IF EXISTS social_posts_select_visible ON public.social_posts;
DROP POLICY IF EXISTS social_posts_safety_update ON public.social_posts;
DROP POLICY IF EXISTS social_posts_safety_write ON public.social_posts;
DROP POLICY IF EXISTS social_posts_verified_view ON public.social_posts;

CREATE POLICY social_posts_verified_view
ON public.social_posts FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND pantavion_internal.can_view_social_post(id, auth.uid())
  AND (
    author_id = auth.uid()
    OR pantavion_internal.safety_allows_public_activity(author_id)
  )
);

-- Keep author-only write policy. Creation, likes, comments, deletion are through
-- validated, authenticated RPC functions; direct table write grants are absent.
-- This file MUST NOT open registration or relax RLS on Social/People/Chat.
COMMIT;
