import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createInnovationReviewPreflight,
  INNOVATION_REVIEW_PREFLIGHT_POLICY,
  INNOVATION_REVIEW_PREFLIGHT_SCHEMA,
  MATURITY_QUEUE_FINGERPRINT,
  parseInnovationReviewPreflightRequest,
} from "../core/sovereign/founder-innovation-review-preflight.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}
function rejects(input, fragment) {
  assert.throws(() => parseInnovationReviewPreflightRequest(inputInput(input), new RegExp(fragment));
  assertions += 1;
}
function parseInnovationReviewPreflightRequestInput(input) {
  return input;
}

const holdItem = {
  queueItemId: "queue-001",
  atomId: "atom-001",
  sourceCandidateId: "candidate-001",
  atomFingerprint: "a".repeat(64),
  decision: "HOLD",
  rationale: "Evidence remains incomplete and requires further review.",
  evidenceRefs: [],
  sourcePreserved: true,
  semanticMergeAuthorized: false,
  noveltyClaimed: false,
  executionAuthorized: false,
};

const distinctItem = {
  ...holdItem,
  queueItemId: "queue-002",
  atomId: "atom-002",
  atomFingerprint: "b".repeat(64),
  decision: "CONFIRM_DISTINCT",
  rationale: "Mechanism boundaries differ materially under the cited comparison evidence.",
  evidenceRefs: ["evidence:comparison:001"],
};

const overlapItem = {
  ...holdItem,
  queueItemId: "queue-003",
  atomId: "atom-003",
  atomFingerprint: "c".repeat(64),
  decision: "CONFIRM_OVERLAP",
  targetAtomId: "atom-004",
  targetAtomFingerprint: "d".repeat(64),
  rationale: "The mechanisms share the same bounded transformation and evidence lineage.",
  evidenceRefs: ["evidence:overlap:001", "evidence:source:001"],
};

const request = {
  batchId: "founder-batch-001",
  sourceQueueFingerprint: MATURITY_QUEUE_FINGERPRINT,
  items: [holdItem, distinctItem, overlapItem],
};

const result = createInnovationReviewPreflight(request);
equal(result.schema, INNOVATION_REVIEW_PREFLIGHT_SCHEMA, "schema");
equal(result.policyVersion, INNOVATION_REVIEW_PREFLIGHT_POLICY, "policy");
equal(result.preflightOnly, true, "preflight-only boundary");
equal(result.ownerRecordingRequired, true, "owner recording boundary");
equal(result.summary.itemCount, 3, "item count");
equal(result.summary.holdCount, 1, "hold count");
equal(result.summary.readyForOwnerRecordingCount, 2, "ready count");
equal(result.summary.decisionsRecorded, 0, "no recorded decisions");
equal(result.summary.semanticMergesPerformed, 0, "no semantic merges");
equal(result.summary.noveltyClaimsAllowed, 0, "no novelty claims");
equal(result.summary.executionAuthorizations, 0, "no execution authorizations");
equal(result.results[0].readiness, "HOLD", "hold stays held");
equal(result.results[1].readiness, "READY_FOR_OWNER_RECORDING", "distinct readiness");
equal(result.results[2].readiness, "READY_FOR_OWNER_RECORDING", "overlap readiness");
check(result.results.every((item) => item.sourcePreserved), "source preserved");
check(result.results.every((item) => !item.decisionRecorded), "decisions withheld");
check(result.results.every((item) => !item.semanticMergePerformed), "merges withheld");
check(result.results.every((item) => !item.maturityClaimAllowed), "maturity claims withheld");
check(result.results.every((item) => !item.noveltyClaimAllowed), "novelty claims withheld");
check(result.results.every((item) => !item.executionAllowed), "execution withheld");
check(result.results.every((item) => item.authorizationEffect === "none"), "no authorization effect");
check(/^[a-f0-9]{64}$/.test(result.receiptSha256), "receipt format");

const repeated = createInnovationReviewPreflight(structuredClone(request));
equal(repeated.receiptSha256, result.receiptSha256, "deterministic receipt");
const changed = createInnovationReviewPreflight({
  ...request,
  items: [{ ...holdItem, rationale: "Different evidence state remains held for a later review." }],
});
check(changed.receiptSha256 !== result.receiptSha256, "receipt binds payload");

rejects(null, "object_required");
rejects({ ...request, extra: true }, "unknown_request_field");
rejects({ ...request, sourceQueueFingerprint: "e".repeat(64) }, "source_queue_fingerprint_mismatch");
rejects({ ...request, items: [] }, "items_count");
rejects({ ...request, items: Array.from({ length: 101 }, (_, index) => ({
  ...holdItem,
  queueItemId: `queue-${index}`,
  atomId: `atom-${index}`,
})) }, "items_count");
rejects({ ...request, items: [holdItem, { ...holdItem }] }, "duplicate_queue_item");
rejects({ ...request, items: [holdItem, { ...holdItem, queueItemId: "queue-other" }] }, "duplicate_atom");
rejects({ ...request, items: [{ ...holdItem, unexpected: true }] }, "unknown_item_field");
rejects({ ...request, items: [{ ...holdItem, decision: "APPROVE" }] }, "decision");
rejects({ ...request, items: [{ ...holdItem, atomFingerprint: "bad" }] }, "atomFingerprint_format");
rejects({ ...request, items: [{ ...holdItem, sourcePreserved: false }] }, "sourcePreserved_must_be_true");
rejects({ ...request, items: [{ ...holdItem, semanticMergeAuthorized: true }] }, "semanticMergeAuthorized_must_be_false");
rejects({ ...request, items: [{ ...holdItem, noveltyClaimed: true }] }, "noveltyClaimed_must_be_false");
rejects({ ...request, items: [{ ...holdItem, executionAuthorized: true }] }, "executionAuthorized_must_be_false");
rejects({ ...request, items: [{ ...holdItem, targetAtomId: "atom-x" }] }, "unexpected_target");
rejects({ ...request, items: [{ ...overlapItem, targetAtomId: overlapItem.atomId }] }, "self_overlap");
rejects({ ...request, items: [{ ...overlapItem, evidenceRefs: [] }] }, "overlap_evidence_required");
rejects({ ...request, items: [{ ...distinctItem, evidenceRefs: [] }] }, "distinct_evidence_required");
rejects({ ...request, items: [{ ...distinctItem, evidenceRefs: ["same", "same"] }] }, "duplicate_evidence");

const route = readFileSync("app/api/owner/innovation-review/preflight/route.ts", "utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"), "API founder gate");
check(route.includes('currentLevel !== "aal2"'), "API AAL2 gate");
check(route.includes("MAX_REQUEST_BYTES = 131_072"), "API body bound");
check(route.includes('"Cache-Control": "no-store, max-age=0"'), "API no-store");
check(!route.includes(".from(") && !route.includes("fetch("), "API has no persistence or external action");

const page = readFileSync("app/owner/control/innovation-review/page.tsx", "utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"), "page founder gate");
check(page.includes('currentLevel !== "aal2"'), "page AAL2 gate");
check(page.includes("δεν καταγράφει απόφαση"), "page negative truth");

const client = readFileSync(
  "app/owner/control/innovation-review/innovation-review-client.tsx",
  "utf8",
);
check(client.includes('aria-live="polite"'), "accessible live result");
check(client.includes("Decisions recorded"), "recording boundary visible");
check(client.includes("Semantic merges"), "merge boundary visible");
check(client.includes("Execution authorizations"), "execution boundary visible");

console.log(`Founder innovation review preflight: PASS (${assertions} assertions)`);
