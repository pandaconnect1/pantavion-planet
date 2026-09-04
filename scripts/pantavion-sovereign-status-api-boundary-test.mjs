import { readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const routePath = join(process.cwd(), "app/api/pantavion/implementation-plan/route.ts");
const route = await readFile(routePath, "utf8");

assert(route.includes("/api/pantavion/implementation-plan"), "Implementation-status route identity must remain explicit.");
assert(route.includes("runtime"), "Implementation-status route must expose runtime truth.");
assert(route.includes("status"), "Implementation-status route must expose status truth.");
assert(route.includes("blocker"), "Implementation-status route must preserve blocker visibility.");
assert(route.includes("provenance"), "Implementation-status route must preserve provenance visibility.");
assert(route.includes("owner"), "Implementation-status route must preserve owner-control visibility.");
assert(route.includes("verification"), "Implementation-status route must preserve verification visibility.");

const forbiddenMutationTokens = [
  "supabase.from(",
  ".insert(",
  ".update(",
  ".delete(",
  "fetch(\"https://",
];
for (const token of forbiddenMutationTokens) {
  assert(!route.includes(token), `Status surface must not perform direct production mutation: ${token}`);
}

assert(
  !route.includes("VERIFIED_LIVE") || route.includes("evidence"),
  "Any VERIFIED_LIVE representation must remain evidence-bound.",
);
assert(
  !route.includes("DEPLOYED") || route.includes("owner"),
  "Any DEPLOYED representation must remain owner-gated.",
);

console.log("Sovereign status API boundary contract passed.");
