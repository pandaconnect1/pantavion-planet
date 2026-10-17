import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";

import { analyzePantavionRecoveryPartitionInventory } from "../core/recovery/pantavion-recovery-partition-inventory.ts";
import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  assertPantavionRecoveryRuntimeCounts,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";
import {
  materializePantavionRecoveryPartitionSemanticReceipt,
  verifyPantavionRecoveryPartitionSemanticReceipt,
} from "../core/recovery/pantavion-recovery-partition-semantic-receipt.ts";
import {
  materializeVerifiedPantavionRecoveryPartition,
  verifyPantavionRecoveryBatchPayload,
} from "../core/recovery/pantavion-recovery-source-reader.ts";

const root = process.cwd();
const outRoot = path.join(root, "data/recovery/runtime-fabric-v1");
const workUnitsPath = path.join(outRoot, "recovery-work-units.ndjson");
const receiptsPath = path.join(outRoot, "partition-semantic-receipts.ndjson");
const manifestPath = path.join(outRoot, "partition-semantic-receipts-manifest.json");
const contractPath = path.join(root, "data/recovery/recovery-runtime-fabric-v1.json");
const sourceIndexCandidates = [
  path.join(root, "data/recovery/source-batch-index-v1.json"),
  path.join(outRoot, "source-batch-index.json"),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
}

function updateOrderedHash(hash, value, index) {
  if (index > 0) hash.update("\n");
  hash.update(value);
}

function locateSourceIndex() {
  const sourceIndexPath = sourceIndexCandidates.find((candidate) => fs.existsSync(candidate));
  if (!sourceIndexPath) throw new Error("partition_semantic_source_index_missing");
  return { sourceIndexPath, index: readJson(sourceIndexPath) };
}

function verifySourceIndex(index) {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  requireEqual("partition_semantic_index_marker", index.id, "pantavion_recovery_source_batch_index_v1");
  requireEqual("partition_semantic_index_records", index.corpus?.recordCount, contract.sourceRecordCount);
  requireEqual("partition_semantic_index_batches", index.corpus?.batchCount, contract.sourceBatchCount);
  requireEqual("partition_semantic_index_source", index.corpus?.sourceFingerprint, contract.sourceFingerprint);
  requireEqual("partition_semantic_index_ids", index.corpus?.orderedIdFingerprint, contract.orderedIdFingerprint);
  requireEqual("partition_semantic_index_batch_size", index.partitionPlan?.batchSize, contract.batchSize);
  requireEqual("partition_semantic_index_partitions", index.partitionPlan?.partitionCount, contract.partitionCount);
  requireEqual("partition_semantic_index_partition_entries", index.partitions?.length, contract.partitionCount);
  if (Object.values(index.authority ?? {}).some(Boolean)) {
    throw new Error("partition_semantic_source_index_authority_must_remain_false");
  }
}

function loadVerifiedBatches(index) {
  const verifiedBatches = new Map();
  for (const entry of index.batches) {
    const payload = fs.readFileSync(path.join(root, entry.relativePath));
    verifiedBatches.set(entry.file, verifyPantavionRecoveryBatchPayload({ entry, payload }));
  }
  requireEqual("partition_semantic_verified_batches", verifiedBatches.size, index.corpus.batchCount);
  return verifiedBatches;
}

function expectError(label, expectedMessage, operation) {
  assert.throws(operation, (error) => {
    assert.equal(error instanceof Error ? error.message : String(error), expectedMessage, label);
    return true;
  });
}

function verifyFailClosedNegativeCases(inventory, workUnits, receipt) {
  const build = (units) => materializePantavionRecoveryPartitionSemanticReceipt({
    inventory,
    workUnits: units,
    expectedPreviousWorkUnitDigest: null,
    previousReceiptDigest: null,
  });

  expectError("missing work unit", "partition_semantic_work_unit_count_mismatch", () => build(workUnits.slice(1)));

  const wrongId = structuredClone(workUnits);
  wrongId[0].recordId = `${wrongId[0].recordId}-tampered`;
  expectError("record identity mismatch", "partition_semantic_record_id_mismatch", () => build(wrongId));

  const wrongSourceDigest = structuredClone(workUnits);
  wrongSourceDigest[0].source.sourceRecordSha256 = "0".repeat(64);
  expectError("source digest mismatch", "partition_semantic_source_digest_mismatch", () => build(wrongSourceDigest));

  const wrongOrdinal = structuredClone(workUnits);
  wrongOrdinal[0].source.globalOrdinal += 1;
  expectError("source ordinal mismatch", "partition_semantic_global_ordinal_mismatch", () => build(wrongOrdinal));

  const escalated = structuredClone(workUnits);
  escalated[0].governance.executionAuthority = true;
  expectError("execution authority escalation", "partition_semantic_execution_authority_forbidden", () => build(escalated));

  const wrongUnitDigest = structuredClone(workUnits);
  wrongUnitDigest[0].workUnitDigest = "f".repeat(64);
  expectError("work unit digest mismatch", "partition_semantic_work_unit_digest_mismatch", () => build(wrongUnitDigest));

  const wrongReceipt = structuredClone(receipt);
  wrongReceipt.semanticTruth.untrustedField = 1;
  expectError("receipt digest mismatch", "partition_semantic_receipt_digest_mismatch", () =>
    verifyPantavionRecoveryPartitionSemanticReceipt(wrongReceipt),
  );
}

async function materializePartitionSemanticReceipts() {
  const { sourceIndexPath, index } = locateSourceIndex();
  verifySourceIndex(index);
  const verifiedBatches = loadVerifiedBatches(index);
  const pinnedContract = readJson(contractPath);
  const workUnitInput = readline.createInterface({
    input: fs.createReadStream(workUnitsPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  const workUnitIterator = workUnitInput[Symbol.asyncIterator]();

  async function nextWorkUnit() {
    while (true) {
      const next = await workUnitIterator.next();
      if (next.done) return null;
      if (next.value.trim()) return JSON.parse(next.value);
    }
  }

  fs.rmSync(receiptsPath, { force: true });
  fs.rmSync(manifestPath, { force: true });
  const output = fs.createWriteStream(receiptsPath, { encoding: "utf8", flags: "wx" });
  const globalIds = new Set();
  const globalWorkUnitIds = new Set();
  const orderedIdHash = createHash("sha256");
  const orderedWorkUnitIdHash = createHash("sha256");
  const orderedReceiptHash = createHash("sha256");
  const totals = {
    CLASSIFIED_CANDIDATE: 0,
    GOVERNED_HOLD: 0,
    QUARANTINED_RECURSIVE: 0,
  };
  const implementationStateCounts = { idea: 0, blocked: 0 };
  let previousWorkUnitDigest = null;
  let previousReceiptDigest = null;
  let recordOrdinal = 0;
  let negativeCasesVerified = false;

  try {
    for (let partitionOrdinal = 1; partitionOrdinal <= index.partitionPlan.partitionCount; partitionOrdinal += 1) {
      const partition = materializeVerifiedPantavionRecoveryPartition({
        index,
        partitionOrdinal,
        verifiedBatches,
      });
      const inventory = analyzePantavionRecoveryPartitionInventory(partition);
      const partitionWorkUnits = [];
      for (let indexInPartition = 0; indexInPartition < partition.recordCount; indexInPartition += 1) {
        const unit = await nextWorkUnit();
        if (!unit) throw new Error("partition_semantic_work_units_ended_early");
        partitionWorkUnits.push(unit);
      }

      const receipt = materializePantavionRecoveryPartitionSemanticReceipt({
        inventory,
        workUnits: partitionWorkUnits,
        expectedPreviousWorkUnitDigest: previousWorkUnitDigest,
        previousReceiptDigest,
      });
      verifyPantavionRecoveryPartitionSemanticReceipt(receipt);

      if (!negativeCasesVerified) {
        verifyFailClosedNegativeCases(inventory, partitionWorkUnits, receipt);
        negativeCasesVerified = true;
      }

      for (const unit of partitionWorkUnits) {
        if (globalIds.has(unit.recordId)) throw new Error(`partition_semantic_global_duplicate_record:${unit.recordId}`);
        if (globalWorkUnitIds.has(unit.workUnitId)) {
          throw new Error(`partition_semantic_global_duplicate_work_unit:${unit.workUnitId}`);
        }
        globalIds.add(unit.recordId);
        globalWorkUnitIds.add(unit.workUnitId);
        updateOrderedHash(orderedIdHash, unit.recordId, recordOrdinal);
        updateOrderedHash(orderedWorkUnitIdHash, unit.workUnitId, recordOrdinal);
        recordOrdinal += 1;
      }
      for (const lane of Object.keys(totals)) totals[lane] += receipt.semanticTruth.laneCounts[lane];
      implementationStateCounts.idea += receipt.semanticTruth.implementationStateCounts.idea;
      implementationStateCounts.blocked += receipt.semanticTruth.implementationStateCounts.blocked;
      updateOrderedHash(orderedReceiptHash, receipt.receiptDigest, partitionOrdinal - 1);
      previousWorkUnitDigest = receipt.semanticTruth.terminalWorkUnitDigest;
      previousReceiptDigest = receipt.receiptDigest;

      if (!output.write(`${JSON.stringify(receipt)}\n`)) {
        await new Promise((resolve) => output.once("drain", resolve));
      }
    }

    if (await nextWorkUnit()) throw new Error("partition_semantic_work_units_have_extra_records");
  } finally {
    workUnitInput.close();
    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on("error", reject);
    });
  }

  requireEqual("partition_semantic_record_total", recordOrdinal, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
  requireEqual("partition_semantic_unique_records", globalIds.size, recordOrdinal);
  requireEqual("partition_semantic_unique_work_units", globalWorkUnitIds.size, recordOrdinal);
  requireEqual(
    "partition_semantic_ordered_ids",
    orderedIdHash.digest("hex"),
    PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
  );
  const workUnitIdFingerprint = orderedWorkUnitIdHash.digest("hex");
  requireEqual(
    "partition_semantic_work_unit_ids",
    workUnitIdFingerprint,
    pinnedContract.materializationTruth?.workUnitIdFingerprint,
  );
  requireEqual(
    "partition_semantic_terminal_work_unit",
    previousWorkUnitDigest,
    pinnedContract.materializationTruth?.terminalWorkUnitDigest,
  );
  assertPantavionRecoveryRuntimeCounts(totals);
  requireEqual("partition_semantic_idea_count", implementationStateCounts.idea, totals.CLASSIFIED_CANDIDATE);
  requireEqual(
    "partition_semantic_blocked_count",
    implementationStateCounts.blocked,
    totals.GOVERNED_HOLD + totals.QUARANTINED_RECURSIVE,
  );
  if (!negativeCasesVerified) throw new Error("partition_semantic_negative_cases_not_verified");

  const manifest = {
    marker: "pantavion_recovery_partition_semantic_receipts_manifest_v1",
    sourceIndexPath: path.relative(root, sourceIndexPath),
    corpus: {
      recordCount: recordOrdinal,
      sourceFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
      orderedIdFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
    },
    partitions: {
      partitionCount: index.partitionPlan.partitionCount,
      batchSize: index.partitionPlan.batchSize,
      fullyCovered: true,
      orderedReceiptFingerprint: orderedReceiptHash.digest("hex"),
      terminalReceiptDigest: previousReceiptDigest,
    },
    semanticTruth: {
      laneCounts: totals,
      implementationStateCounts,
      workUnitIdFingerprint,
      terminalWorkUnitDigest: previousWorkUnitDigest,
      rawPayloadDuplicatedIntoReceipts: false,
    },
    authority: {
      executionAuthority: false,
      codeMutationAuthority: false,
      mergeAuthority: false,
      deploymentAuthority: false,
      productionWriteAuthority: false,
      publicExposureAuthority: false,
      releaseAuthority: false,
    },
    receiptMaterializerLifecycleState: "CODED",
    completion: false,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(manifest, null, 2));
}

await materializePartitionSemanticReceipts();
