import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createRecoveryBuildOwnerDecisionReceipt,
  verifyRecoveryBuildOwnerDecisionReceipt,
} from "../core/recovery/pantavion-recovery-owner-decision.ts";
import { requireAal2Assurance } from "../lib/owner-control/assurance.ts";
import { requireSameOriginRequest } from "../lib/owner-control/request-security.ts";

const index = JSON.parse(
  await readFile("data/recovery/sovereign-build-readiness-index-v1.json", "utf8"),
);
assert.equal(index.packets.length, 279);
assert.equal(index.corpus.sourceRecordCount, 82413);

const ownerUserId = "00000000-0000-4000-8000-000000000001";
const ordinary = index.packets.find(
  (packet) => packet.risk.level !== "critical" && !packet.data.classes.includes("regulated"),
);
const critical = index.packets.find(
  (packet) => packet.risk.level === "critical" || packet.data.classes.includes("regulated"),
);
assert.ok(ordinary);
assert.ok(critical);

const approved = createRecoveryBuildOwnerDecisionReceipt({
  source: ordinary,
  readinessIndexDigest: index.indexDigest,
  ownerUserId,
  assuranceLevel: "aal2",
  decision: "approve_scoped_implementation",
  decidedAt: "2026-08-31T04:05:00.000Z",
});
assert.equal(approved.scopeApprovalRecorded, true);
assert.equal(approved.nextPermittedLifecycleState, "CODED");
assert.equal(approved.decisionScope, "isolated_code_preparation_only");
assert.equal(approved.separateCapabilityGrantRequired, true);
assert.equal(approved.separateBudgetGrantRequired, true);
assert.equal(approved.completion, false);
assert.match(approved.receiptDigest, /^[0-9a-f]{64}$/);
assert.equal(verifyRecoveryBuildOwnerDecisionReceipt(approved), true);
assert.ok(Object.values(approved.authority).every((value) => value === false));

const rejected = createRecoveryBuildOwnerDecisionReceipt({
  source: ordinary,
  readinessIndexDigest: index.indexDigest,
  ownerUserId,
  assuranceLevel: "aal2",
  decision: "reject",
  note: "Founder rejected this exact readiness packet.",
  decidedAt: "2026-08-31T04:06:00.000Z",
});
assert.equal(rejected.scopeApprovalRecorded, false);
assert.equal(rejected.nextPermittedLifecycleState, "IDEA");
assert.equal(rejected.decisionScope, "remain_blocked");
assert.equal(verifyRecoveryBuildOwnerDecisionReceipt(rejected), true);

assert.throws(
  () => createRecoveryBuildOwnerDecisionReceipt({
    source: ordinary,
    readinessIndexDigest: index.indexDigest,
    ownerUserId,
    assuranceLevel: "aal1",
    decision: "approve_scoped_implementation",
    decidedAt: "2026-08-31T04:07:00.000Z",
  }),
  /aal2_required/,
);
assert.throws(
  () => createRecoveryBuildOwnerDecisionReceipt({
    source: critical,
    readinessIndexDigest: index.indexDigest,
    ownerUserId,
    assuranceLevel: "aal2",
    decision: "approve_scoped_implementation",
    note: "too short",
    decidedAt: "2026-08-31T04:08:00.000Z",
  }),
  /high_consequence_note_required/,
);
assert.throws(
  () => createRecoveryBuildOwnerDecisionReceipt({
    source: { ...ordinary, authority: { ...ordinary.authority, execution: true } },
    readinessIndexDigest: index.indexDigest,
    ownerUserId,
    assuranceLevel: "aal2",
    decision: "reject",
    decidedAt: "2026-08-31T04:09:00.000Z",
  }),
  /authority_escalation/,
);
assert.equal(
  verifyRecoveryBuildOwnerDecisionReceipt({ ...approved, decisionScope: "remain_blocked" }),
  false,
);

assert.doesNotThrow(() => requireAal2Assurance("aal2"));
assert.throws(() => requireAal2Assurance("aal1"), /aal2_required/);
assert.throws(() => requireAal2Assurance(null), /aal2_required/);

const sameOriginHeaders = new Headers({
  host: "pantavion.com",
  origin: "https://pantavion.com",
  "sec-fetch-site": "same-origin",
});
assert.doesNotThrow(() => requireSameOriginRequest(sameOriginHeaders));
assert.doesNotThrow(() => requireSameOriginRequest(new Headers({
  host: "PANTAVION.COM",
  origin: "https://pantavion.com",
  "sec-fetch-site": "same-origin",
})));
assert.throws(
  () => requireSameOriginRequest(new Headers({
    host: "pantavion.com",
    origin: "https://attacker.example",
    "sec-fetch-site": "cross-site",
  })),
  /cross_origin_forbidden/,
);

const genericRoute = await readFile("app/api/owner/control/decisions/route.ts", "utf8");
assert.ok(genericRoute.includes("getAuthenticatorAssuranceLevel"));
assert.ok(genericRoute.includes("requireAal2Assurance"));

const buildRoute = await readFile(
  "app/api/owner/control/recovery-build-orders/decisions/route.ts",
  "utf8",
);
assert.ok(buildRoute.includes("requireSameOriginRequest"));
assert.ok(buildRoute.includes("getAuthenticatorAssuranceLevel"));
assert.ok(buildRoute.includes("sovereign-build-readiness-index-v1.json"));
assert.ok(buildRoute.includes("recordRecoveryBuildOwnerDecision"));
assert.ok(genericRoute.includes("requireSameOriginRequest"));

const decisionPage = await readFile(
  "app/owner/control/implementation/recovery-build-orders/page.tsx",
  "utf8",
);
const decisionPanel = await readFile(
  "app/owner/control/implementation/recovery-build-orders/recovery-build-order-decision-panel.tsx",
  "utf8",
);
assert.ok(decisionPage.includes("RecoveryBuildOrderDecisionPanel"));
assert.ok(decisionPage.includes("buildReadinessIndex.packets.map"));
assert.ok(decisionPanel.includes("Founder AAL2"));
assert.ok(decisionPanel.includes("approve_scoped_implementation"));
assert.ok(decisionPanel.includes("Δεν εκδίδει agent ή budget grant"));
assert.ok(decisionPanel.includes("/api/owner/control/recovery-build-orders/decisions"));

const migration = await readFile(
  "supabase/migrations/20260831040500_owner_recovery_build_decision_receipts.sql",
  "utf8",
);
assert.ok(migration.includes("enable row level security"));
assert.ok(migration.includes("revoke all on table public.owner_recovery_build_decisions from public, anon, authenticated"));
assert.ok(migration.includes("grant select, insert on table public.owner_recovery_build_decisions to service_role"));
assert.ok(migration.includes("before update or delete"));
assert.ok(migration.includes("authority_fail_closed"));
assert.ok(migration.includes("payload_matches"));
assert.ok(migration.includes("receipt_payload #>> '{receiptDigest}' = receipt_digest"));
assert.ok(!migration.includes("on delete cascade"));

console.log("PANTAVION RECOVERY OWNER DECISION PROTOCOL: PASSED");
console.log("- exact readiness, build-order and Founder AAL2 identity binding");
console.log("- immutable SHA-256 decision receipts with append-only server storage contract");
console.log("- critical or regulated approvals require an explicit high-consequence note");
console.log("- approval permits only the next CODED evidence stage; all runtime authorities remain false");
console.log("- generic Owner decisions API direct-call AAL2 gap is closed");
