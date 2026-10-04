import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../core/security/water-admin-authorization.ts", import.meta.url),
  "utf8",
);

assert.match(
  source,
  /hasPantavionFounderSession\(request\) \|\| hasWaterAdminSession\(request\)/,
  "existing signed founder/admin session fast path must remain",
);
assert.match(
  source,
  /const supabase = await createClient\(\)/,
  "founder access must be recoverable from the authenticated Pantavion session",
);
assert.match(
  source,
  /supabase\.auth\.getUser\(\)/,
  "recovery path must verify the authenticated user server-side",
);
assert.match(
  source,
  /pantavion_is_active_founder/,
  "recovery path must require canonical active-founder truth",
);
assert.match(
  source,
  /return !founderError && founderStatus === true/,
  "non-founder/error states must remain fail-closed",
);
assert.match(
  source,
  /catch \{\s*return false;\s*\}/s,
  "authorization failures must remain fail-closed",
);

console.log("water founder access regression: PASS");
