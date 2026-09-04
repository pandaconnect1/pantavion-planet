import { readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const statusPath = join(process.cwd(), "docs/verification/PANTAVION_FACTORY_STATUS_2026-09-04.md");
const status = await readFile(statusPath, "utf8");

assert(status.includes("Exact evidence"), "Visible status must distinguish exact evidence from intent or readiness.");
assert(status.includes("Preview readiness is not production deployment"), "Preview readiness must not be treated as production deployment.");
assert(status.includes("not VERIFIED_LIVE"), "Visible status must explicitly deny unverified live claims.");
assert(status.includes("owner approval"), "Owner approval boundary must remain visible.");
assert(status.includes("external technology authorization"), "External technology authorization boundary must remain visible.");
assert(status.includes("production/Supabase mutation"), "Production and Supabase mutation boundary must remain visible.");

const forbiddenProgressions = [
  "CODED -> MERGED",
  "TESTED -> MERGED",
  "MERGED -> DEPLOYED",
  "DEPLOYED -> VERIFIED_LIVE",
];
for (const edge of forbiddenProgressions) {
  assert(!status.includes(`${edge}: yes`), `Status must not claim unqualified progression: ${edge}`);
}

const evidenceTokens = ["commit", "workflow", "run", "preview", "blocker"];
for (const token of evidenceTokens) {
  assert(status.toLowerCase().includes(token), `Visible status must retain evidence/provenance token: ${token}`);
}

console.log("Status evidence-discipline contract passed.");
