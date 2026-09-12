import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  parseSovereignExecutionRevalidation,
  revalidateSovereignExecution,
} from "../core/sovereign/sovereign-execution-revalidation.ts";

let assertions = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const throws = (fn, pattern, message) => { assert.throws(fn, pattern, message); assertions += 1; };

const base = {
  admissionId: "admission-001",
  intentId: "intent-001",
  admissionBundleReceipt: "a".repeat(64),
  currentBundleReceipt: "a".repeat(64),
  ownerAdmissionReceipt: "b".repeat(64),
  admissionRecorded: true,
  admittedAt: "2026-09-12T10:00:00.000Z",
  expiresAt: "2026-09-13T10:00:00.000Z",
  evaluationTime: "2026-09-12T11:00:00.000Z",
  revoked: false,
  admittedCapabilities: ["verify_evidence", "read_status"],
  requestedCapabilities: ["read_status"],
  budgetCeiling: 100,
  budgetConsumed: 25,
  requestedCost: 10,
  admittedChainFingerprint: "c".repeat(64),
  currentChainFingerprint: "c".repeat(64),
  disconnected: false,
  lastAcceptedSequence: 4,
  requestedSequence: 5,
  replayNonce: "d".repeat(64),
  previousReplayNonces: [],
};

const passed = revalidateSovereignExecution(base);
eq(passed.decision, "REVALIDATION_PASSED", "valid bounded request passes revalidation");
eq(passed.reasons.length, 0, "passing request has no blockers");
eq(passed.projectedBudget, 35, "projected budget is deterministic");
eq(passed.capabilityScopePreserved, true, "capability scope preserved");
eq(passed.bundleContinuityVerified, true, "bundle receipt continuous");
eq(passed.chainContinuityVerified, true, "component chain continuous");
eq(passed.replayBoundaryVerified, true, "replay boundary verified");
eq(passed.revalidationOnly, true, "result is revalidation only");
eq(passed.executionReviewRequired, true, "separate execution review required");
eq(passed.executionAllowed, false, "no execution authority");
eq(passed.executionStarted, false, "execution not started");
eq(passed.budgetConsumedNow, false, "budget not consumed");
eq(passed.agentActivated, false, "agent not activated");
eq(passed.edgeHandoffIssued, false, "edge handoff not issued");
eq(passed.productionWriteAllowed, false, "production write forbidden");
eq(passed.authorizationEffect, "none", "no authorization effect");
ok(/^[a-f0-9]{64}$/.test(passed.evidenceReceipt), "evidence receipt is SHA-256");

const repeat = revalidateSovereignExecution(structuredClone(base));
eq(repeat.evidenceReceipt, passed.evidenceReceipt, "receipt is deterministic");
const reordered = revalidateSovereignExecution({
  ...base,
  admittedCapabilities: ["read_status", "verify_evidence"],
});
eq(reordered.evidenceReceipt, passed.evidenceReceipt, "capability ordering canonicalized");

const notAdmitted = revalidateSovereignExecution({...base, admissionRecorded:false});
eq(notAdmitted.decision, "DENY", "missing owner admission denied");
ok(notAdmitted.reasons.includes("owner_admission_not_recorded"), "missing admission reason");

const revoked = revalidateSovereignExecution({...base, revoked:true});
eq(revoked.decision, "DENY", "revoked admission denied");
ok(revoked.reasons.includes("owner_admission_revoked"), "revocation reason");

const expired = revalidateSovereignExecution({...base, evaluationTime:"2026-09-13T10:00:00.000Z"});
eq(expired.decision, "DENY", "expired admission denied");
ok(expired.reasons.includes("owner_admission_expired"), "expiry reason");

const bundleDrift = revalidateSovereignExecution({...base, currentBundleReceipt:"e".repeat(64)});
eq(bundleDrift.decision, "DENY", "bundle drift denied");
eq(bundleDrift.bundleContinuityVerified, false, "bundle drift exposed");

const chainDrift = revalidateSovereignExecution({...base, currentChainFingerprint:"f".repeat(64)});
eq(chainDrift.decision, "DENY", "chain drift denied");
eq(chainDrift.chainContinuityVerified, false, "chain drift exposed");

const expansion = revalidateSovereignExecution({...base, requestedCapabilities:["read_status","activate_agent"]});
eq(expansion.decision, "DENY", "capability expansion denied");
eq(expansion.capabilityScopePreserved, false, "capability expansion exposed");
ok(expansion.reasons.includes("capability_scope_expansion"), "capability expansion reason");

const budget = revalidateSovereignExecution({...base, requestedCost:76});
eq(budget.decision, "DENY", "projected budget overrun denied");
ok(budget.reasons.includes("projected_budget_overrun"), "projected budget reason");

const existingOverrun = revalidateSovereignExecution({...base, budgetConsumed:101, requestedCost:0});
ok(existingOverrun.reasons.includes("existing_budget_overrun"), "existing budget overrun denied");

const replay = revalidateSovereignExecution({...base, previousReplayNonces:["d".repeat(64)]});
eq(replay.decision, "DENY", "reused nonce denied");
eq(replay.replayBoundaryVerified, false, "replay reuse exposed");

const offlineReplay = revalidateSovereignExecution({...base, disconnected:true, requestedSequence:4});
eq(offlineReplay.decision, "DENY", "non-monotonic offline sequence denied");
ok(offlineReplay.reasons.includes("offline_sequence_not_monotonic"), "offline sequence reason");

const multi = revalidateSovereignExecution({
  ...base,
  revoked:true,
  currentBundleReceipt:"e".repeat(64),
  requestedCapabilities:["activate_agent"],
  requestedCost:1000,
});
ok(multi.reasons.length >= 4, "all independent blockers retained");

throws(() => parseSovereignExecutionRevalidation({...base, unexpected:true}), /unknown_field/, "unknown fields rejected");
throws(() => parseSovereignExecutionRevalidation({...base, ownerAdmissionReceipt:"bad"}), /ownerAdmissionReceipt/, "invalid receipt rejected");
throws(() => parseSovereignExecutionRevalidation({...base, revoked:"false"}), /revoked/, "invalid boolean rejected");
throws(() => parseSovereignExecutionRevalidation({...base, budgetCeiling:-1}), /budgetCeiling/, "negative budget rejected");
throws(() => parseSovereignExecutionRevalidation({...base, requestedSequence:1.2}), /requestedSequence/, "fractional sequence rejected");
throws(() => parseSovereignExecutionRevalidation({...base, admittedCapabilities:["read_status","read_status"]}), /duplicate/, "duplicate capabilities rejected");
throws(() => parseSovereignExecutionRevalidation({...base, expiresAt:base.admittedAt}), /expiry_not_after_admission/, "invalid time window rejected");
throws(() => parseSovereignExecutionRevalidation({...base, previousReplayNonces:Array(129).fill("f".repeat(64))}), /previousReplayNonces/, "nonce history bounded");

const route = await readFile(join(process.cwd(), "app/api/owner/sovereign-execution-revalidation/route.ts"), "utf8");
ok(route.includes("requireFounderIdentity(auth.user.id)"), "API founder-only");
ok(route.includes('currentLevel !== "aal2"'), "API AAL2 protected");
ok(route.includes("MAX_REQUEST_BYTES"), "API body bounded");
ok(route.includes('"Cache-Control": "no-store, max-age=0"'), "API non-cacheable");

const page = await readFile(join(process.cwd(), "app/owner/control/sovereign-execution-revalidation/page.tsx"), "utf8");
ok(page.includes("requireFounderIdentity(auth.user.id)"), "page founder-only");
ok(page.includes('currentLevel !== "aal2"'), "page AAL2 protected");

const client = await readFile(join(process.cwd(), "app/owner/control/sovereign-execution-revalidation/revalidation-client.tsx"), "utf8");
ok(client.includes('fetch("/api/owner/sovereign-execution-revalidation"'), "client calls protected API");
ok(client.includes('aria-live="polite"'), "result surface accessible");
ok(client.includes("Execution allowed"), "execution truth visible");
ok(client.includes("Production write allowed"), "production boundary visible");
ok(client.includes("Edge handoff issued"), "edge boundary visible");

console.log(`Sovereign execution revalidation contract: PASS (${assertions} assertions)`);
