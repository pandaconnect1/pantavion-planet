import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";

import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  assertPantavionRecoveryRuntimeCounts,
  digestPantavionRecoverySourceRecord,
  materializePantavionRecoveryWorkUnit,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const root = process.cwd();
const corpusRoot = path.join(root, PANTAVION_RECOVERY_CORPUS_CONTRACT.corpusRoot);
const batchesRoot = path.join(corpusRoot, "batches");
const receiptPath = path.join(corpusRoot, "MATERIALIZATION_RECEIPT.json");
const semanticLedgerPath = path.join(root, PANTAVION_RECOVERY_CORPUS_CONTRACT.semanticLedgerPath);
const semanticManifestPath = path.join(path.dirname(semanticLedgerPath), "manifest.json");
const governedHoldPath = path.join(root, PANTAVION_RECOVERY_CORPUS_CONTRACT.governedHoldPath);
const contractPath = path.join(root, "data/recovery/recovery-runtime-fabric-v1.json");
const outRoot = path.join(root, "data/recovery/runtime-fabric-v1");
const workUnitsPath = path.join(outRoot, "recovery-work-units.ndjson");
const manifestPath = path.join(outRoot, "manifest.json");
const blockerQueuePath = path.join(outRoot, "blocker-queue.ndjson");
const BLOCKER_FIRST_SEEN_AT = "2026-09-12T21:36:02.760Z";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
  }
}

function updateOrderedHash(hash, value, ordinal) {
  if (ordinal > 1) hash.update("\n");
  hash.update(value);
}

function safeRecordId(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("recovery_source_record_id_required");
  return value.trim();
}

function verifyPinnedContract(contract) {
  const canonical = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("contract_intent_id", contract.intent?.intentId, canonical.intentId);
  requireEqual("contract_intake_reference", contract.intent?.intakeReference, canonical.intakeReference);
  requireEqual("contract_record_count", contract.corpus?.records, canonical.sourceRecordCount);
  requireEqual("contract_batch_count", contract.corpus?.batches, canonical.sourceBatchCount);
  requireEqual("contract_source_fingerprint", contract.corpus?.sourceFingerprint, canonical.sourceFingerprint);
  requireEqual("contract_ordered_id_fingerprint", contract.corpus?.orderedIdFingerprint, canonical.orderedIdFingerprint);
  requireEqual("contract_classified_count", contract.semanticTruth?.classifiedCandidates, canonical.classifiedCount);
  requireEqual("contract_recursive_count", contract.semanticTruth?.recursiveQuarantine, canonical.recursiveQuarantineCount);
  requireEqual("contract_hold_count", contract.semanticTruth?.governedHold, canonical.governedHoldCount);
  requireEqual("contract_batch_size", contract.workload?.batchSize, canonical.batchSize);
  requireEqual("contract_partition_count", contract.workload?.partitionCount, canonical.partitionCount);
  for (const [key, value] of Object.entries(contract.authority ?? {})) {
    if (value !== false) throw new Error(`contract_authority_must_remain_false:${key}`);
  }
}

function loadSourceLocators() {
  const receipt = readJson(receiptPath);
  const batchFiles = fs.readdirSync(batchesRoot).filter((name) => name.endsWith(".json")).sort();
  requireEqual("receipt_record_count", receipt.totalRecords, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  requireEqual("receipt_batch_count", receipt.totalBatches, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceBatchCount);
  requireEqual("receipt_source_fingerprint", receipt.corpusFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint);
  requireEqual("committed_batch_count", batchFiles.length, receipt.totalBatches);

  const locators = [];
  const orderedIdHash = createHash("sha256");
  const seen = new Set();
  let globalOrdinal = 0;

  for (const batchFile of batchFiles) {
    const batch = readJson(path.join(batchesRoot, batchFile));
    if (!Array.isArray(batch.records)) throw new Error(`recovery_batch_records_missing:${batchFile}`);
    for (let batchRecordIndex = 0; batchRecordIndex < batch.records.length; batchRecordIndex += 1) {
      const sourceRecord = batch.records[batchRecordIndex];
      const recordId = safeRecordId(sourceRecord?.id);
      if (seen.has(recordId)) throw new Error(`recovery_source_duplicate_record_id:${recordId}`);
      seen.add(recordId);
      globalOrdinal += 1;
      updateOrderedHash(orderedIdHash, recordId, globalOrdinal);
      locators.push({
        recordId,
        batchFile,
        batchRecordIndex,
        globalOrdinal,
        sourceRecordSha256: digestPantavionRecoverySourceRecord(sourceRecord),
      });
    }
  }

  requireEqual("source_locator_count", locators.length, receipt.totalRecords);
  requireEqual("source_ordered_id_fingerprint", orderedIdHash.digest("hex"), PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint);
  return { locators, batchFiles };
}

function loadGovernance() {
  const governed = readJson(governedHoldPath);
  requireEqual("governed_record_count", governed.corpus?.records, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  requireEqual("governed_source_fingerprint", governed.corpus?.sourceFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint);
  requireEqual("governed_ordered_id_fingerprint", governed.corpus?.orderedIdFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint);
  requireEqual("governed_hold_count", governed.expectedReviewRequired, PANTAVION_RECOVERY_CORPUS_CONTRACT.governedHoldCount);
  if (!Array.isArray(governed.dispositions) || governed.dispositions.length === 0) {
    throw new Error("governed_hold_dispositions_missing");
  }

  const bySourceFile = new Map();
  for (const disposition of governed.dispositions) {
    if (typeof disposition.sourceFile !== "string" || !disposition.sourceFile.trim()) {
      throw new Error("governed_hold_source_file_missing");
    }
    if (disposition.executionAuthority !== false) {
      throw new Error(`governed_hold_execution_authority_forbidden:${disposition.sourceFile}`);
    }
    if (bySourceFile.has(disposition.sourceFile)) {
      throw new Error(`governed_hold_duplicate_source:${disposition.sourceFile}`);
    }
    bySourceFile.set(disposition.sourceFile, disposition);
  }
  return { governed, bySourceFile };
}

async function materialize() {
  const pinnedContract = readJson(contractPath);
  verifyPinnedContract(pinnedContract);

  const semanticManifest = readJson(semanticManifestPath);
  requireEqual("semantic_record_count", semanticManifest.recordCount, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  requireEqual("semantic_preserved_record_count", semanticManifest.preservedRecordCount, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  requireEqual("semantic_source_fingerprint", semanticManifest.sourceFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint);
  requireEqual("semantic_ordered_id_fingerprint", semanticManifest.idFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint);

  const { locators, batchFiles } = loadSourceLocators();
  const { governed, bySourceFile } = loadGovernance();
  const governedCounts = new Map();
  const counts = {
    CLASSIFIED_CANDIDATE: 0,
    GOVERNED_HOLD: 0,
    QUARANTINED_RECURSIVE: 0,
  };
  const moduleSummary = {};
  const accountingSummary = {
    sourceProjectObserved: 0,
    sourceProjectMissing: 0,
    sourceRepositoryObserved: 0,
    sourceRepositoryMissing: 0,
    sourceRefObserved: 0,
    sourceRefMissing: 0,
    destinationBound: 0,
    destinationUnbound: 0,
  };
  const workUnitIdHash = createHash("sha256");
  let previousWorkUnitDigest = null;
  let ordinal = 0;

  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  const output = fs.createWriteStream(workUnitsPath, { encoding: "utf8", flags: "wx" });
  const blockerOutput = fs.createWriteStream(blockerQueuePath, { encoding: "utf8", flags: "wx" });
  const blockerIdHash = createHash("sha256");
  let blockerCount = 0;
  const input = readline.createInterface({
    input: fs.createReadStream(semanticLedgerPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  try {
    for await (const line of input) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      const locator = locators[ordinal];
      if (!locator) throw new Error("semantic_ledger_has_more_records_than_source");
      const recordId = safeRecordId(record.id);
      requireEqual(`semantic_source_order_${ordinal + 1}`, recordId, locator.recordId);
      const sourceFile = typeof record.provenance?.sourceFile === "string" ? record.provenance.sourceFile : "";
      const governedDisposition = record.reviewStatus === "REVIEW_REQUIRED"
        ? bySourceFile.get(sourceFile)
        : undefined;
      const unit = materializePantavionRecoveryWorkUnit({
        record,
        locator,
        governedDisposition,
        previousWorkUnitDigest,
      });

      ordinal += 1;
      previousWorkUnitDigest = unit.workUnitDigest;
      counts[unit.runtimeLane] += 1;
      updateOrderedHash(workUnitIdHash, unit.workUnitId, ordinal);
      if (unit.runtimeLane === "GOVERNED_HOLD") {
        governedCounts.set(sourceFile, (governedCounts.get(sourceFile) ?? 0) + 1);
      }
      accountingSummary[unit.accounting.sourceProject ? "sourceProjectObserved" : "sourceProjectMissing"] += 1;
      accountingSummary[unit.accounting.sourceRepository ? "sourceRepositoryObserved" : "sourceRepositoryMissing"] += 1;
      accountingSummary[unit.accounting.sourceRef ? "sourceRefObserved" : "sourceRefMissing"] += 1;
      accountingSummary[unit.accounting.destinationBinding.bound ? "destinationBound" : "destinationUnbound"] += 1;

      const missingProvenance = [
        !unit.accounting.sourceProject ? "SOURCE_PROJECT_MISSING" : null,
        !unit.accounting.sourceRepository ? "SOURCE_REPOSITORY_MISSING" : null,
        !unit.accounting.sourceRef ? "SOURCE_REF_MISSING" : null,
      ].filter(Boolean);
      if (missingProvenance.length > 0 || !unit.accounting.destinationBinding.bound) {
        const errorCodes = [
          ...missingProvenance,
          ...(!unit.accounting.destinationBinding.bound ? ["DESTINATION_BINDING_MISSING"] : []),
        ];
        const blockerId = `recovery_blocker_${createHash("sha256")
          .update(`${unit.workUnitId}:${errorCodes.join(",")}`)
          .digest("hex")}`;
        const blocker = {
          version: "pantavion_recovery_blocker_v1",
          blockerId,
          workUnitId: unit.workUnitId,
          recordId: unit.recordId,
          source: {
            batchFile: unit.source.batchFile,
            batchRecordIndex: unit.source.batchRecordIndex,
            globalOrdinal: unit.source.globalOrdinal,
            sourceRef: unit.accounting.sourceRef,
            sourceProject: unit.accounting.sourceProject,
            sourceRepository: unit.accounting.sourceRepository,
          },
          errorCodes,
          errorText: `Required accounting provenance unavailable: ${errorCodes.join(",")}`,
          firstSeenAt: BLOCKER_FIRST_SEEN_AT,
          lastAttemptAt: BLOCKER_FIRST_SEEN_AT,
          retryCount: 1,
          dependency: "upstream recovery inventory or verified GitHub/Vercel source mapping",
          impact: "item is preserved and destination-bound but cannot satisfy complete source project/repository provenance",
          proposedResolutionPath: [
            "match immutable sourceRef against committed recovery inventory",
            "rebind from verified GitHub repository/ref evidence when exact",
            "retry Vercel project inventory without blocking independent records",
            "retain blocker when no authoritative mapping exists",
          ],
          parked: true,
          returnedToActiveFlow: false,
          completion: false,
        };
        blockerCount += 1;
        updateOrderedHash(blockerIdHash, blockerId, blockerCount);
        if (!blockerOutput.write(`${JSON.stringify(blocker)}\n`)) {
          await new Promise((resolve) => blockerOutput.once("drain", resolve));
        }
      }

      const module = unit.route.module ?? "RECOVERY / PROVENANCE";
      const summary = moduleSummary[module] ??= {
        total: 0,
        classifiedCandidates: 0,
        governedHold: 0,
        recursiveQuarantine: 0,
      };
      summary.total += 1;
      if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") summary.classifiedCandidates += 1;
      else if (unit.runtimeLane === "GOVERNED_HOLD") summary.governedHold += 1;
      else summary.recursiveQuarantine += 1;

      if (!output.write(`${JSON.stringify(unit)}\n`)) {
        await new Promise((resolve) => output.once("drain", resolve));
      }
    }
  } finally {
    input.close();
    await Promise.all([
      new Promise((resolve, reject) => {
        output.end(resolve);
        output.on("error", reject);
      }),
      new Promise((resolve, reject) => {
        blockerOutput.end(resolve);
        blockerOutput.on("error", reject);
      }),
    ]);
  }

  requireEqual("materialized_work_unit_count", ordinal, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  assertPantavionRecoveryRuntimeCounts(counts);
  for (const [field, observed, missing] of [
    ["source_project", accountingSummary.sourceProjectObserved, accountingSummary.sourceProjectMissing],
    ["source_repository", accountingSummary.sourceRepositoryObserved, accountingSummary.sourceRepositoryMissing],
    ["source_ref", accountingSummary.sourceRefObserved, accountingSummary.sourceRefMissing],
    ["destination_binding", accountingSummary.destinationBound, accountingSummary.destinationUnbound],
  ]) {
    requireEqual(`accounting_${field}_coverage`, observed + missing, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  }
  for (const disposition of governed.dispositions) {
    requireEqual(
      `governed_hold_source_count:${disposition.sourceFile}`,
      governedCounts.get(disposition.sourceFile) ?? 0,
      disposition.expectedRecords,
    );
  }
  requireEqual("governed_hold_total", [...governedCounts.values()].reduce((sum, value) => sum + value, 0), governed.expectedReviewRequired);

  requireEqual("blocker_queue_count", blockerCount, accountingSummary.sourceProjectMissing);
  const blockerQueueFingerprint = blockerIdHash.digest("hex");
  const workUnitIdFingerprint = workUnitIdHash.digest("hex");
  requireEqual(
    "pinned_work_unit_id_fingerprint",
    workUnitIdFingerprint,
    pinnedContract.materializationTruth?.workUnitIdFingerprint,
  );
  requireEqual(
    "pinned_terminal_work_unit_digest",
    previousWorkUnitDigest,
    pinnedContract.materializationTruth?.terminalWorkUnitDigest,
  );

  const manifest = {
    id: "pantavion_recovery_runtime_fabric_materialization_v1",
    generatedAt: new Date().toISOString(),
    intentId: PANTAVION_RECOVERY_CORPUS_CONTRACT.intentId,
    intakeReference: PANTAVION_RECOVERY_CORPUS_CONTRACT.intakeReference,
    corpus: {
      sourceRecordCount: ordinal,
      sourceBatchCount: batchFiles.length,
      sourceFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
      orderedIdFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
    },
    materialization: {
      workUnitCount: ordinal,
      counts,
      accountingSummary,
      blockerQueue: {
        parkedCount: blockerCount,
        resolvedCount: 0,
        returnedToActiveFlowCount: 0,
        fingerprint: blockerQueueFingerprint,
        path: "data/recovery/runtime-fabric-v1/blocker-queue.ndjson",
        completion: false,
      },
      moduleSummary,
      workUnitIdFingerprint,
      terminalWorkUnitDigest: previousWorkUnitDigest,
      rawPayloadDuplicatedIntoControlPlane: false,
      sourcePayloadMode: "immutable_corpus_reference_plus_sha256",
    },
    partitionPlan: {
      batchSize: PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize,
      partitionCount: PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount,
      sourceOrdinalBinding: "ordered_canonical_corpus_record_id",
    },
    authority: {
      executionAuthority: false,
      mergeAuthority: false,
      deploymentAuthority: false,
      productionWriteAuthority: false,
      publicExposureAuthority: false,
      releaseAuthority: false,
    },
    implementationState: "coded",
    completion: false,
    truthRule: pinnedContract.truthRule,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(manifest, null, 2));
}

await materialize();
