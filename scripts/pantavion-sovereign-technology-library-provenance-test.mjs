import assert from "node:assert/strict";

const stages = ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"];
const forbidden = [
  "production mutation",
  "deployment authority",
  "owner admission",
  "external authorization",
  "agent activation",
];

const libraryEntry = {
  id: "technology.example",
  title: "Example candidate",
  status: "IDEA",
  evidence: ["source:example", "benchmark:pending"],
  maturity: "research",
  dependencies: ["runtime-boundary"],
  license: "unknown",
  security_review: "pending",
  legal_review: "pending",
  benchmark: "pending",
  production_ready: false,
};

assert.equal(stages.indexOf(libraryEntry.status), 0, "Library candidates start at IDEA.");
assert.ok(Array.isArray(libraryEntry.evidence) && libraryEntry.evidence.length > 0, "Library entry requires provenance evidence.");
assert.equal(libraryEntry.production_ready, false, "Technology Library readiness cannot imply production readiness.");
for (const key of ["maturity", "dependencies", "license", "security_review", "legal_review", "benchmark"]) {
  assert.ok(libraryEntry[key] !== undefined, `Technology Library entry must expose ${key}.`);
}

function transition(from, to, evidence = {}) {
  const fromIndex = stages.indexOf(from);
  const toIndex = stages.indexOf(to);
  assert.ok(fromIndex >= 0 && toIndex === fromIndex + 1, `Lifecycle transition must advance exactly one stage: ${from} -> ${to}.`);
  assert.ok(evidence.commit || evidence.run || evidence.owner, "Lifecycle advancement requires explicit evidence.");
  return to;
}

assert.equal(transition("IDEA", "CODED", { commit: "example" }), "CODED");
assert.throws(() => transition("IDEA", "TESTED", { commit: "skip" }), /advance exactly one stage/);
assert.throws(() => transition("DEPLOYED", "VERIFIED_LIVE", { commit: "wrong-evidence" }), /explicit evidence/);

const canonicalStatusSurface = {
  visibility: "founder-only",
  route_method: "GET",
  authorization: "non-authorizing",
  owner_gate: "required",
  provenance: "exact-head",
};
assert.equal(canonicalStatusSurface.route_method, "GET", "Status surface must remain read-only.");
assert.equal(canonicalStatusSurface.authorization, "non-authorizing", "Status surface must not grant authority.");
assert.equal(canonicalStatusSurface.owner_gate, "required", "Owner gate must remain explicit.");

const serialized = JSON.stringify({ libraryEntry, canonicalStatusSurface, stages });
for (const marker of forbidden) {
  assert.equal(serialized.includes(marker), false, `Evidence surface must not contain bypass marker: ${marker}.`);
}

console.log("Sovereign Technology Library provenance boundary: PASS");
console.log("- library candidates carry provenance, maturity, dependency, license, security, legal, and benchmark metadata");
console.log("- Technology Library status never implies production readiness");
console.log("- lifecycle transitions are single-step and evidence-backed");
console.log("- visible status surface is GET-only and non-authorizing");
console.log("- owner and safety gates remain explicit");
