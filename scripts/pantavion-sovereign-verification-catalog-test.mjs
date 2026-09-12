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
eq(sovereignVerificationRecords.length, 21, "all current Sovereign and innovation PRs represented");
eq(new Set(sovereignVerificationRecords.map(record => record.id)).size, 22, "unique catalog IDs");
eq(new Set(sovereignVerificationRecords.map(record => record.pr)).size, 22, "unique PRs");
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
for (const [childPr, parentPr] of [[483,480],[484,483],[485,484],[486,485],[488,486],[490,486],[491,490],[492,491],[493,492],[494,492],[495,494],[498,489],[499,498]]) {
  const child = byPr.get(childPr);
  const parent = byPr.get(parentPr);
  ok(child && parent, "stack records exist");
  eq(child.parentPr, parentPr, "stack parent PR binding");
  eq(child.parentExactHead, parent.exactHead, "stack parent SHA binding");
}

eq(byPr.get(492).researchQuality, "BLOCKED", "shortlist research quality blocked");
eq(byPr.get(493).researchQuality, "BLOCKED", "dossiers inherit parent quality blocker");
eq(byPr.get(494).researchQuality, "VALIDATED", "quality audit evidence validated");
eq(byPr.get(495).researchQuality, "RESEARCH_READY", "coherent disclosures are research ready");
eq(byPr.get(495).researchEligible, true, "coherent disclosures eligible for prior-art research");
eq(byPr.get(497).domain, "Translation and intercultural repair", "understanding core is visible in its real domain");
eq(byPr.get(497).workflowCount, 11, "understanding core exact workflow evidence");
eq(byPr.get(497).executionAuthorized, false, "understanding core grants no execution authority");
eq(byPr.get(497).exactHead, "d85a81bf01dacd968a65835b3a4c81b87ddb5271", "understanding workbench exact head");
eq(byPr.get(497).verificationReceipt, "5645456108", "understanding workbench exact verification receipt");
eq(byPr.get(498).exactHead, "f0d36a346fd18f6717d787e9920793d86e552e35", "execution revalidation exact head");
eq(byPr.get(498).verificationReceipt, "5645677398", "execution revalidation receipt");
eq(byPr.get(498).executionAuthorized, false, "revalidation grants no execution authority");
eq(byPr.get(499).exactHead, "49924524c41cb2dd70d7c7fd159ae5dc61918ba4", "execution manifest exact head");
eq(byPr.get(499).verificationReceipt, "5646460194", "execution manifest receipt");
eq(byPr.get(499).executionAuthorized, false, "execution manifest grants no execution authority");
eq([492,493,494].every(pr => byPr.get(pr).researchEligible === false), true, "blocked research never becomes eligible");

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

const brokenResearchQuality = structuredClone(sovereignVerificationRecords);
brokenResearchQuality.find(record => record.pr === 492).qualityBlocker = "";
ok(validateSovereignVerificationCatalog(brokenResearchQuality).some(blocker => blocker.startsWith("research_quality_block_incomplete:")), "reject incomplete research quality block");

const brokenResearchReady = structuredClone(sovereignVerificationRecords);
brokenResearchReady.find(record => record.pr === 495).researchEligible = false;
ok(validateSovereignVerificationCatalog(brokenResearchReady).some(blocker => blocker.startsWith("research_ready_evidence_incomplete:")), "reject incomplete research-ready evidence");

const page = readFileSync("app/owner/control/implementation/page.tsx", "utf8");
ok(page.includes("requireFounderIdentity(auth.user.id)"), "Founder identity protected");
ok(page.includes('currentLevel !== "aal2"'), "AAL2 protected");
ok(page.includes("validateSovereignVerificationCatalog"), "page validates catalog");
ok(page.includes("Catalog hidden fail-closed"), "page hides invalid catalog");
ok(page.includes("OPEN_PR ≠ MERGED ≠ DEPLOYED"), "page exposes location boundary");
ok(page.includes("RESEARCH {record.researchQuality}"), "page exposes research quality status");
ok(page.includes("record.qualityBlocker"), "page exposes research quality blocker");
ok(page.includes("Merged: false · Deployed: false · Verified live: false · Execution: false"), "page exposes negative authorization truth");

console.log(`Sovereign verification catalog contract: PASS (${assertions} assertions)`);
