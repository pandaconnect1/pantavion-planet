import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261022014500_social_posts_verified_visibility_rls.sql", "utf8"
);
assert.match(migration, /ALTER TABLE public\.social_posts ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /DROP POLICY IF EXISTS social_posts_safety_read/);
assert.match(migration, /DROP POLICY IF EXISTS social_posts_read/);
assert.match(migration, /DROP POLICY IF EXISTS social_posts_safety_update/);
assert.match(migration, /DROP POLICY IF EXISTS social_posts_select_visible/);
assert.match(migration, /CREATE POLICY social_posts_verified_view/);
assert.match(migration, /FOR SELECT TO authenticated/);
assert.match(migration, /pantavion_internal\.can_view_social_post\(id, auth\.uid\(\)\)/);
assert.match(migration, /pantavion_internal\.safety_allows_public_activity\(author_id\)/);
const integration = readFileSync("supabase/tests/social-post-rpc-rollback-smoke.sql", "utf8");
assert.match(integration, /ROLLBACK;/);
assert.match(integration, /pantavion_create_social_post/);
assert.match(integration, /pantavion_add_social_comment/);
assert.match(integration, /pantavion_set_social_reaction/);
assert.match(integration, /pantavion_remove_social_reaction/);
assert.match(integration, /pantavion_delete_social_post/);
assert.match(integration, /PRIVATE_POST_RLS_LEAK/);
const ui = readFileSync("app/social/social-home-client.tsx", "utf8");
assert.doesNotMatch(ui, /<strong>Social Live<\/strong>/);
assert.match(ui, /ΣΥΝΔΕΔΕΜΕΝΟ/);
console.log("Social private-view RLS migration and rollback-integration contract: PASS");
