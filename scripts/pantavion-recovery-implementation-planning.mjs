import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";

import {
  digestPantavionRecoveryWorkUnitForPlanning,
  materializePantavionRecoveryImplementationPlanEnvelope,
} from "../core/recovery/pantavion-recovery-implementation-plan-envelope.ts";
import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  assertPantavionRecoveryRuntimeCounts,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const root = process.cwd();
const runtimeRoot = path.join(root, "data/recovery/runtime-fabric-v1");
const runtimeManifestPath = path.join(runtimeRoot, "manifest.json");
const workUnitsPath = path.join(runtimeRoot, "recovery-work-units.ndjson");
const outRoot = path.join(root, "data/recovery/implementation-planning-v1");
const envelopesPath = path.join(outRoot, "implementation-plan-envelopes.ndjson");
const manifestPath = path.join(outRoot, "manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
  }
}

function expectFailure(label, action) {
  let failed = false;
  try {
    action();
  } catch {
    failed = true;
  }
  if (!failed) throw new Error(`${label}_must_fail_closed`);
}

function updateOrderedHash(hash, value, ordinal) {
  if (ordinal > 1) hash.update("\n");
  hash.update(value);
}

function verifyRuntimeManifest(manifest) {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("plan_runtime_manifest_id", manifest.id, "pantavion_recovery_runtime_fabric_materialization_v1");
  requireEqual("plan_runtime_record_count", manifest.corpus?.sourceRecordCount, contract.sourceRecordCount);
  requireEqual("plan_runtime_batch_count", manifest.corpus?.sourceBatchCount, contract.sourceBatchCount);
  requireEqual("plan_runtime_source_fingerprint", manifest.corpus?.sourceFingerprint, contract.sourceFingerprint);
  requireEqual("plan_runtime_ordered_ids", manifest.corpus?.orderedIdFingerprint, contract.orderedIdFingerprint);
  requireEqual("plan_runtime_work_units", manifest.materialization?.workUnitCount, contract.sourceRecordCount);
  assertPantavionRecoveryRuntimeCounts(manifest.materialization?.counts);
  if (Object.values(manifest.authority ?? {}).some(Boolean)) {
    throw new Error("plan_runtime_manifest_authority_forbidden");
  }
  requireEqual("plan_runtime_completion", manifest.completion, false);
}

async function materializeImplementationPlanning() {
  const runtimeManifest = readJson(runtimeManifestPath);
  verifyRuntimeManifest(runtimeManifest);

  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });

  const output = fs.createWriteStream(envelopesPath, { encoding: "utf8", flags: "wx" });
  const input = readline.createInterface({
    input: fs.createReadStream(workUnitsPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const dispositionCounts = {
    SCOPED_INTERNAL_DRAFT_PLAN: 0,
    GOVERNED_HOLD_PRESERVATION: 0,
    RECURSIVE_PROVENANCE_PRESERVATION: 0,
  };
  const implementationStateCounts = { idea: 0, blocked: 0 };
  const partitionCounts = Array(PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount).fill(0);
  const seenRecordIds = new Set();
  const seenWorkUnitIds = new Set();
  const seenEnvelopeIds = new Set();
  const orderedWorkUnitIdHash = createHash("sha256");
  const orderedEnvelopeIdHash = createHash("sha256");
  let ordinal = 0;
  let expectedPreviousWorkUnitDigest = null;
  let previousPlanEnvelopeDigest = null;
  let firstCandidateContext = null;

  try {
    for await (const line of input) {
      if (!line.trim()) continue;
      const unit = JSON.parse(line);
      ordinal += 1;

      const context = {
        unit,
        expectedGlobalOrdinal: ordinal,
        expectedPreviousWorkUnitDigest,
        previousPlanEnvelopeDigest,
      };
      const envelope = materializePantavionRecoveryImplementationPlanEnvelope(context);

      if (seenRecordIds.has(envelope.recordId)) {
        throw new Error(`recovery_plan_duplicate_record:${envelope.recordId}`);
      }
      if (seenWorkUnitIds.has(envelope.workUnitId)) {
        throw new Error(`recovery_plan_duplicate_work_unit:${envelope.workUnitId}`);
      }
      if (seenEnvelopeIds.has(envelope.planEnvelopeId)) {
        throw new Error(`recovery_plan_duplicate_envelope:${envelope.planEnvelopeId}`);
      }
      seenRecordIds.add(envelope.recordId);
      seenWorkUnitIds.add(envelope.workUnitId);
      seenEnvelopeIds.add(envelope.planEnvelopeId);

      dispositionCounts[envelope.disposition] += 1;
      implementationStateCounts[envelope.planning.currentImplementationState] += 1;
      partitionCounts[envelope.partitionOrdinal - 1] += 1;
      updateOrderedHash(orderedWorkUnitIdHash, envelope.workUnitId, ordinal);
      updateOrderedHash(orderedEnvelopeIdHash, envelope.planEnvelopeId, ordinal);

      if (!firstCandidateContext && envelope.disposition === "SCOPED_INTERNAL_DRAFT_PLAN") {
        firstCandidateContext = structuredClone(context);
      }

      expectedPreviousWorkUnitDigest = unit.workUnitDigest;
      previousPlanEnvelopeDigest = envelope.planEnvelopeDigest;
      if (!output.write(`${JSON.stringify(envelope)}\n`)) {
        await new Promise((resolve) => output.once("drain", resolve));
      }
    }
  } finally {
    input.close();
    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on("error", reject);
    });
  }

  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("recovery_plan_envelope_count", ordinal, contract.sourceRecordCount);
  requireEqual("recovery_plan_unique_records", seenRecordIds.size, ordinal);
  requireEqual("recovery_plan_unique_work_units", seenWorkUnitIds.size, ordinal);
  requireEqual("recovery_plan_unique_envelopes", seenEnvelopeIds.size, ordinal);
  requireEqual(
    "recovery_plan_scoped_draft_count",
    dispositionCounts.SCOPED_INTERNAL_DRAFT_PLAN,
    contract.classifiedCount,
  );
  requireEqual(
    "recovery_plan_governed_hold_count",
    dispositionCounts.GOVERNED_HOLD_PRESERVATION,
    contract.governedHoldCount,
  );
  requireEqual(
    "recovery_plan_recursive_count",
    dispositionCounts.RECURSIVE_PROVENANCE_PRESERVATION,
    contract.recursiveQuarantineCount,
  );
  requireEqual("recovery_plan_idea_count", implementationStateCounts.idea, contract.classifiedCount);
  requireEqual(
    "recovery_plan_blocked_count",
    implementationStateCounts.blocked,
    contract.governedHoldCount + contract.recursiveQuarantineCount,
  );

  for (let index = 0; index < partitionCounts.length; index += 1) {
    const expected = index === partitionCounts.length - 1
      ? contract.sourceRecordCount - index * contract.batchSize
      : contract.batchSize;
    requireEqual(`recovery_plan_partition_${index + 1}`, partitionCounts[index], expected);
  }

  const orderedWorkUnitIdFingerprint = orderedWorkUnitIdHash.digest("hex");
  requireEqual(
    "recovery_plan_work_unit_fingerprint",
    orderedWorkUnitIdFingerprint,
    runtimeManifest.materialization?.workUnitIdFingerprint,
  );
  requireEqual(
    "recovery_plan_terminal_work_unit",
    expectedPreviousWorkUnitDigest,
    runtimeManifest.materialization?.terminalWorkUnitDigest,
  );
  if (!firstCandidateContext) throw new Error("recovery_plan_candidate_negative_fixture_missing");

  const digestTamper = structuredClone(firstCandidateContext);
  digestTamper.unit.workUnitDigest = "0".repeat(64);
  expectFailure("recovery_plan_digest_tamper", () => {
    materializePantavionRecoveryImplementationPlanEnvelope(digestTamper);
  });

  const routeTamper = structuredClone(firstCandidateContext);
  routeTamper.unit.route.capability = null;
  routeTamper.unit.workUnitDigest = digestPantavionRecoveryWorkUnitForPlanning(routeTamper.unit);
  expectFailure("recovery_plan_route_tamper", () => {
    materializePantavionRecoveryImplementationPlanEnvelope(routeTamper);
  });

  const authorityTamper = structuredClone(firstCandidateContext);
  authorityTamper.unit.governance.executionAuthority = true;
  authorityTamper.unit.workUnitDigest = digestPantavionRecoveryWorkUnitForPlanning(authorityTamper.unit);
  expectFailure("recovery_plan_authority_tamper", () => {
    materializePantavionRecoveryImplementationPlanEnvelope(authorityTamper);
  });

  const orderedPlanEnvelopeIdFingerprint = orderedEnvelopeIdHash.digest("hex");
  const manifest = {
    marker: "pantavion_recovery_implementation_planning_manifest_v1",
    sourceRuntimeManifestPath: path.relative(root, runtimeManifestPath),
    corpus: {
      sourceRecordCount: ordinal,
      sourceFingerprint: contract.sourceFingerprint,
      orderedIdFingerprint: contract.orderedIdFingerprint,
    },
    planning: {
      planEnvelopeCount: ordinal,
      dispositionCounts,
      implementationStateCounts,
      scopedInternalDraftReadyCount: dispositionCounts.SCOPED_INTERNAL_DRAFT_PLAN,
      blockedPreservationCount:
        dispositionCounts.GOVERNED_HOLD_PRESERVATION +
        dispositionCounts.RECURSIVE_PROVENANCE_PRESERVATION,
      partitionCount: partitionCounts.length,
      partitionsFullyCovered: true,
      orderedWorkUnitIdFingerprint,
      orderedPlanEnvelopeIdFingerprint,
      terminalWorkUnitDigest: expectedPreviousWorkUnitDigest,
      terminalPlanEnvelopeDigest: previousPlanEnvelopeDigest,
      rawPayloadDuplicatedIntoControlPlane: false,
    },
    authority: {
      analysisAuthority: true,
      planningAuthority: true,
      codeMutationAuthority: false,
      executionAuthority: false,
      productionWriteAuthority: false,
      mergeAuthority: false,
      deploymentAuthority: false,
      publicExposureAuthority: false,
      releaseAuthority: false,
    },
    implementationPlanningLifecycleState: "CODED",
    negativeCasesVerified: true,
    completion: false,
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(manifest, null, 2));
}

await materializeImplementationPlanning();
