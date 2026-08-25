const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const socialClient = fs.readFileSync(path.join(root, "app/social/social-home-client.tsx"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260825190000_harden_social_block_visibility_and_media_posts.sql"),
  "utf8",
);

const requiredClientCommands = [
  "pantavion_create_social_post",
  "pantavion_delete_social_post",
  "pantavion_add_social_comment",
  "pantavion_set_social_reaction",
  "pantavion_remove_social_reaction",
];

for (const command of requiredClientCommands) {
  if (!socialClient.includes(`rpc(\"${command}\"`)) {
    throw new Error(`Social client is missing the protected command ${command}`);
  }
}

const forbiddenDirectMutations = [
  /from\("social_posts"\)\.insert/,
  /from\("social_posts"\)\.delete/,
  /from\("social_comments"\)\.insert/,
  /from\("social_reactions"\)\.(?:upsert|insert|delete)/,
];

for (const pattern of forbiddenDirectMutations) {
  if (pattern.test(socialClient)) {
    throw new Error(`Social client bypasses the protected command boundary: ${pattern}`);
  }
}

for (const marker of [
  "pantavion_has_block_between(p.author_id, p_viewer)",
  "pantavion_can_view_social_post(p_post_id, actor)",
  "grant execute on function public.pantavion_can_view_social_post(uuid, uuid) to authenticated",
]) {
  if (!migration.includes(marker)) throw new Error(`Social security migration is missing: ${marker}`);
}

console.log("Pantavion Social → Chat contract gate passed.");
