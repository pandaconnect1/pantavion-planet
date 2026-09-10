import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  sovereignVerificationRecords,
  sovereignVerificationSnapshotAt,
  validateSovereignVerificationCatalog,
} from "../core/pantavion/sovereign-verification-catalog.ts";

let assertions = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };

eq(validateSovereignVerificationCatalog().length, 0, "catalog passes fail-closed validation");
eq(sovereignVerificationRecords.length, 15, "all current Sovereign and innovation PRs represented");
eq(new Set(sovereignVerificationRecords.map(record => record.id)).size, 15, "unique catalog IDs");
eq(new Set(sovereignVerificationRecords.map(record => record.pr)).size, 15, "unique PRs");
eq(sovereignVerificationRecords.every(record => record.stage === "TESTED"), true, "no unverified lifecycle promotion");
eq(sovereignVerificationRecords.every(record => record.truthLocation === "OPEN_PR"), true, "truth location remains open PR");
eq(sovereignVerificationRecords.every(record => !record.merged), true, "nothing claimed merged");
eq(sovereignVerificationRecords.every(record => !record.deployed), true, "nothing claimed deployed");
eq(sovereignVerificationRecords.every(record => !record.verifiedLive), true, "nothing claimed verified live");
eq(sovereignVerificationRecords.every(record => !record.executionAuthorized), true, "no execution authority");
eq(sovereignVerificationRecords.every(record => record.nextTransition === "MERGED"), true, "next transition is adjacent");
eq(sovereignVerificationRecords.every(record => /^[a-f0-9]{40}$/.test(record.exactHead)), true, "exact heads are canonical SHAs");
eq(sovereignVerificationRecords.every(record => record.workflowCount >= 7), true, "tested records carry workflow evidence");
ok(Number.isFinite(Date.parse(sovereignVerificationSnapshotAt)), "snapshot timestamp");

const byPr = new Map(sovereignVerificationRecords.map(record => [record.pr, record]));
for (const [childPr, parentPr] of [[483,480],[484,483],[485,484],[486,485],[488,486],[490,486],[491,490]]) {
  const child = byPr.get(childPr);
  const parent = byPr.get(parentPr);
  ok(child && parent, "stack records exist");
  eq(child.parentPr, parentPr, "stack parent PR binding");
  eq(child.parentExactHead, parent.exactHead, "stack parent SHA binding");
}

const tampered = structuredClone(sovereignVerificationRecords);
tampered[0].deployed = true;
ok(validateSovereignVerificationCatalog(tampered).some(blocker => blocker.startsWith("open_pr_overclaim:")), "reject open PR deployment overclaim");
const missingEvidence = structuredClone(sovereignVerificationRecords);
missingEvidence[0].verificationReceipt = "";
ok(validateSovereignVerificationCatalog(missingEvidence).some(blocker => blocker.startsWith("tested_evidence_missing:")), "reject TESTED without receipt");
const escalated = structuredClone(sovereignVerificationRecords);
escalated[0].executionAuthorized = true;
ok(validateSovereignVerificationCatalog(escalated).some(blocker => blocker.startsWith("execution_authority_forbidden:")), "reject execution authority");
const brokenParent = structuredClone(sovereignVerificationRecords);
brokenParent.find(record => record.pr === 486).parentExactHead = "0".repeat(40);
ok(validateSovereignVerificationCatalog(brokenParent).some(blocker => blocker.startsWith("parent_binding_mismatch:")), "reject stack parent drift");

const page = readFileSync("app/owner/control/implementation/page.tsx", "utf8");
ok(page.includes("requireFounderIdentity(auth.user.id)"), "Founder identity protected");
ok(page.includes('currentLevel !== "aal2"'), "AAL2 protected");
ok(page.includes("validateSovereignVerificationCatalog"), "page validates catalog");
ok(page.includes("Catalog hidden fail-closed"), "page hides invalid catalog");
ok(page.includes("OPEN_PR ≠ MERGED ≠ DEPLOYED"), "page exposes location boundary");
ok(page.includes("Merged: false · Deployed: false · Verified live: false · Execution: false"), "page exposes negative authorization truth");

console.log(`Sovereign verification catalog contract: PASS (${assertions} assertions)`);
