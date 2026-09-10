import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createSovereignAdmissionBundle,
  parseSovereignAdmissionBundle,
  sovereignAdmissionComponents,
  SOVEREIGN_ADMISSION_BUNDLE_POLICY,
  SOVEREIGN_ADMISSION_BUNDLE_SCHEMA,
} from "../core/sovereign/sovereign-admission-bundle.ts";

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
  assert.throws(() => parseSovereignAdmissionBundle(input), new RegExp(fragment));
  assertions += 1;
}

const sources = sovereignAdmissionComponents();
const component = (entry, index, disposition = "pass") => ({
  componentId: entry.id,
  sourcePr: entry.sourcePr,
  sourceHead: entry.sourceHead,
  receiptSha256: String(index + 1).repeat(64),
  disposition,
  authorizationEffect: "none",
  executionAllowed: false,
});
const request = {
  bundleId: "bundle-001",
  intentId: "intent-001",
  components: sources.map((entry, index) => component(entry, index)),
};

const ready = createSovereignAdmissionBundle(request);
equal(ready.schema, SOVEREIGN_ADMISSION_BUNDLE_SCHEMA, "schema");
equal(ready.policyVersion, SOVEREIGN_ADMISSION_BUNDLE_POLICY, "policy");
equal(ready.readiness, "READY_FOR_OWNER_ADMISSION", "all pass readiness");
equal(ready.completeReceiptChain, true, "complete chain");
equal(ready.deniedComponents.length, 0, "no denies");
equal(ready.ownerApprovalComponents.length, 0, "no approval blockers");
equal(ready.preflightOnly, true, "preflight only");
equal(ready.ownerAdmissionRequired, true, "owner admission required");
equal(ready.admissionRecorded, false, "admission withheld");
equal(ready.executionPlanIssued, false, "plan withheld");
equal(ready.agentsCreated, false, "agents withheld");
equal(ready.edgeHandoffIssued, false, "edge withheld");
equal(ready.budgetConsumed, false, "budget withheld");
equal(ready.executionAllowed, false, "execution withheld");
equal(ready.authorizationEffect, "none", "no authority effect");
check(/^[a-f0-9]{64}$/.test(ready.receiptSha256), "receipt format");

const approval = createSovereignAdmissionBundle({
  ...request,
  components: sources.map((entry, index) =>
    component(entry, index, index === 1 ? "owner_approval" : "pass"),
  ),
});
equal(approval.readiness, "OWNER_APPROVAL_REQUIRED", "approval readiness");
equal(approval.ownerApprovalComponents[0], "intent_outcome", "approval source");

const denied = createSovereignAdmissionBundle({
  ...request,
  components: sources.map((entry, index) =>
    component(entry, index, index === 0 ? "deny" : index === 2 ? "owner_approval" : "pass"),
  ),
});
equal(denied.readiness, "DENY", "deny dominates");
equal(denied.deniedComponents[0], "intent_firewall", "deny source");
equal(denied.ownerApprovalComponents[0], "capability_budget", "approval still visible");
equal(denied.executionAllowed, false, "deny cannot execute");

const repeated = createSovereignAdmissionBundle(structuredClone(request));
equal(repeated.receiptSha256, ready.receiptSha256, "deterministic receipt");
const changed = createSovereignAdmissionBundle({
  ...request,
  intentId: "intent-002",
});
check(changed.receiptSha256 !== ready.receiptSha256, "receipt binds intent");

equal(sources.length, 5, "five components");
equal(sources[0].id, "intent_firewall", "firewall first");
equal(sources[1].id, "intent_outcome", "outcome second");
equal(sources[2].id, "capability_budget", "budget third");
equal(sources[3].id, "swarm_admission", "swarm fourth");
equal(sources[4].id, "edge_preflight", "edge fifth");

rejects(null, "object_required");
rejects({ ...request, extra: true }, "unknown_request_field");
rejects({ ...request, components: [] }, "component_count");
rejects({ ...request, components: request.components.slice(0, 4) }, "component_count");
rejects({ ...request, components: [...request.components, request.components[0]] }, "component_count");
rejects({ ...request, components: [{ ...request.components[0], extra: true }, ...request.components.slice(1)] }, "unknown_component_field");
rejects({ ...request, components: [request.components[1], request.components[0], ...request.components.slice(2)] }, "component_0_order");
rejects({ ...request, components: [{ ...request.components[0], sourcePr: 999 }, ...request.components.slice(1)] }, "source_pr");
rejects({ ...request, components: [{ ...request.components[0], sourceHead: "a".repeat(40) }, ...request.components.slice(1)] }, "source_head");
rejects({ ...request, components: [{ ...request.components[0], receiptSha256: "bad" }, ...request.components.slice(1)] }, "receiptSha256_format");
rejects({ ...request, components: [{ ...request.components[0], disposition: "approve" }, ...request.components.slice(1)] }, "disposition");
rejects({ ...request, components: [{ ...request.components[0], authorizationEffect: "grant" }, ...request.components.slice(1)] }, "authorization_effect");
rejects({ ...request, components: [{ ...request.components[0], executionAllowed: true }, ...request.components.slice(1)] }, "execution_must_be_false");
rejects({ ...request, components: request.components.map((item, index) => ({
  ...item,
  receiptSha256: index < 2 ? "f".repeat(64) : item.receiptSha256,
})) }, "duplicate_receipt");
rejects({ ...request, bundleId: "" }, "bundleId_format");
rejects({ ...request, intentId: "space is forbidden" }, "intentId_format");

const route = readFileSync("app/api/owner/sovereign-admission/route.ts", "utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"), "API founder gate");
check(route.includes('currentLevel !== "aal2"'), "API AAL2 gate");
check(route.includes("MAX_REQUEST_BYTES = 32_768"), "API request bound");
check(route.includes('"Cache-Control": "no-store, max-age=0"'), "API no-store");
check(!route.includes(".from(") && !route.includes("fetch("), "API no persistence or external action");

const page = readFileSync("app/owner/control/sovereign-admission/page.tsx", "utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"), "page founder gate");
check(page.includes('currentLevel !== "aal2"'), "page AAL2 gate");
check(page.includes("δεν καταγράφει"), "page negative truth");

const client = readFileSync(
  "app/owner/control/sovereign-admission/sovereign-admission-client.tsx",
  "utf8",
);
check(client.includes('aria-live="polite"'), "live result region");
check(client.includes("Admission recorded"), "admission boundary visible");
check(client.includes("Execution plan issued"), "execution-plan boundary visible");
check(client.includes("Agents created"), "agent boundary visible");
check(client.includes("Edge handoff issued"), "edge boundary visible");
check(client.includes("Budget consumed"), "budget boundary visible");
check(client.includes("Execution allowed"), "execution boundary visible");

console.log(`Sovereign admission bundle contract: PASS (${assertions} assertions)`);
