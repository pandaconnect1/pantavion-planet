const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const dir = path.join(root, "data", "recovery", "coherent-invention-disclosures");
const manifestPath = path.join(dir, "manifest.json");
const disclosuresPath = path.join(dir, "disclosures.json");
const csvPath = path.join(dir, "disclosures.csv");

function fail(message) {
  console.error("PANTAVION COHERENT INVENTION DISCLOSURES GATE: FAIL - " + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
for (const file of [manifestPath, disclosuresPath, csvPath]) if (!fs.existsSync(file)) fail("missing artifact " + path.relative(root, file));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const projection = JSON.parse(fs.readFileSync(disclosuresPath, "utf8"));
const csv = fs.readFileSync(csvPath, "utf8");

if (manifest.id !== "pantavion_coherent_invention_disclosures_v1") fail("manifest identity drift");
if (manifest.parentQualityVerdict !== "REJECT_FOR_INNOVATION_RESEARCH") fail("quality correction not bound");
if (manifest.parentSourceShortlistFingerprint !== "784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6") fail("parent fingerprint drift");
if (JSON.stringify(manifest) !== JSON.stringify(projection.manifest)) fail("embedded manifest mismatch");
if (!Array.isArray(projection.disclosures) || projection.disclosures.length !== 2) fail("expected exactly two coherent disclosures");

const expectedIds = ["verified-cross-cultural-understanding-loop", "sovereign-ai-admission-evidence-chain"];
const seen = new Set();
for (const [index, item] of projection.disclosures.entries()) {
  if (item.id !== expectedIds[index] || seen.has(item.id)) fail("identity/order drift");
  seen.add(item.id);
  if (!["IDEA","TESTED"].includes(item.implementationStage)) fail("invalid implementation stage");
  if (item.researchFitness !== "COHERENT_TECHNICAL_MECHANISM") fail("research fitness missing");
  if (item.priorArtStatus !== "UNVERIFIED_PRIOR_ART_REQUIRED" || item.noveltyStatus !== "NO_CLAIM" || item.patentabilityStatus !== "NO_CLAIM") fail("unsupported research claim");
  if (item.claimDraftingStatus !== "READY_FOR_PROFESSIONAL_REVIEW") fail("claim drafting boundary drift");
  if (item.publicDisclosureAuthorized || item.applicationEvidenceAuthorized || item.ownerApproved || item.executionAllowed || item.authorizationEffect !== "none") fail("unauthorized effect");
  if (item.problem.length < 80 || item.technicalEffect.length < 80) fail("incomplete technical statement");
  for (const field of ["actors","inputs","orderedSteps","stateTransitions","constraints","measurableOutcomes","implementationEvidence","priorArtRisks","researchQuestions"]) {
    if (!Array.isArray(item[field]) || item[field].length < 3) fail(item.id + " incomplete " + field);
  }
  const clone = {...item};
  delete clone.disclosureFingerprint;
  if (item.disclosureFingerprint !== hash(JSON.stringify(clone))) fail("disclosure fingerprint mismatch");
}
if (projection.disclosures[0].implementationStage !== "IDEA") fail("cross-cultural loop implementation overclaim");
if (projection.disclosures[1].implementationStage !== "TESTED") fail("sovereign chain evidence under/overclaim");
const sovereignRefs = projection.disclosures[1].implementationEvidence.map(item => item.ref);
for (const required of ["PR#476@4fa03685a7277d4696873996ddd0b5b94b6514e0","PR#478@94791f0ab08fc8746d37977bb73e597fe8c4bf2a","PR#479@67baa0fab093a7406af703619dec89bd48304d0e","PR#481@0d19340415546a63d7148a82d8b3746ff5e49bce","PR#482@0d90c1906e0f22120eb00ee3a2c194065763f49b","PR#489@34ef8f01c0ae53412a4b07ae93f8a13c711c2a16"]) if (!sovereignRefs.includes(required)) fail("missing exact implementation evidence " + required);
const expectedFingerprint = hash(projection.disclosures.map(item => item.disclosureFingerprint).join("\n"));
if (manifest.disclosureFingerprint !== expectedFingerprint) fail("manifest disclosure fingerprint mismatch");
const totals = manifest.totals || {};
if (totals.rejectedFragmentaryInputsPreserved !== 150 || totals.coherentDisclosures !== 2 || totals.ideaStage !== 1 || totals.testedStage !== 1) fail("manifest totals drift");
for (const field of ["priorArtVerified","noveltyClaims","patentabilityClaims","applicationEvidenceAuthorized","publicDisclosureAuthorized","executionAuthorized"]) if (totals[field] !== 0) fail("forbidden non-zero total " + field);
if (csv.split("\n").filter(Boolean).length !== 3) fail("CSV row count mismatch");

console.log(JSON.stringify({
  gate:"PANTAVION COHERENT INVENTION DISCLOSURES",
  result:"PASS",
  rejectedFragmentaryInputsPreserved:150,
  coherentDisclosures:2,
  ideaStage:1,
  testedStage:1,
  priorArtVerified:0,
  noveltyClaims:0,
  patentabilityClaims:0,
  applicationEvidenceAuthorized:0,
  publicDisclosureAuthorized:0,
  executionAuthorized:0,
  disclosureFingerprint:manifest.disclosureFingerprint
}, null, 2));
