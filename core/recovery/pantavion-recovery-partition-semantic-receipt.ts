import { createHash } from "node:crypto";

import type { PantavionRecoveryPartitionInventory } from "./pantavion-recovery-partition-inventory.ts";
import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  type PantavionRecoveryRuntimeCounts,
  type PantavionRecoveryWorkUnit,
} from "./pantavion-recovery-runtime-fabric.ts";

export interface PantavionRecoveryPartitionSemanticReceipt {
  marker: "pantavion_recovery_partition_semantic_receipt_v1";
  partitionOrdinal: number;
  startOrdinal: number;
  endOrdinal: number;
  recordCount: number;
  input: {
    partitionEvidenceSha256: string;
    sourceFingerprint: string;
    orderedIdFingerprint: string;
    previousWorkUnitDigest: string | null;
  };
  semanticTruth: {
    laneCounts: PantavionRecoveryRuntimeCounts;
    implementationStateCounts: { idea: number; blocked: number };
    orderedWorkUnitIdFingerprint: string;
    orderedSemanticBindingFingerprint: string;
    firstWorkUnitDigest: string;
    terminalWorkUnitDigest: string;
    rawPayloadDuplicatedIntoReceipt: false;
  };
  previousReceiptDigest: string | null;
  receiptDigest: string;
  nextStage: "scoped_internal_draft_planning";
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("partition_semantic_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("partition_semantic_unsupported_digest_value");
}

function assertSha256(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label}_must_be_sha256`);
  }
}

function assertNonEmpty(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}_required`);
}

function updateOrderedHash(hash: ReturnType<typeof createHash>, value: string, index: number): void {
  if (index > 0) hash.update("\n");
  hash.update(value);
}

function assertInventory(inventory: PantavionRecoveryPartitionInventory): void {
  if (inventory.marker !== "pantavion_recovery_partition_inventory_v1") {
    throw new Error("partition_semantic_inventory_marker_invalid");
  }
  if (
    !Number.isInteger(inventory.partitionOrdinal) || inventory.partitionOrdinal < 1 ||
    !Number.isInteger(inventory.startOrdinal) || inventory.startOrdinal < 1 ||
    !Number.isInteger(inventory.endOrdinal) || inventory.endOrdinal < inventory.startOrdinal ||
    !Number.isInteger(inventory.recordCount) || inventory.recordCount < 1 ||
    inventory.recordCount !== inventory.endOrdinal - inventory.startOrdinal + 1 ||
    inventory.uniqueRecordCount !== inventory.recordCount ||
    inventory.recordEvidence.length !== inventory.recordCount
  ) {
    throw new Error("partition_semantic_inventory_range_invalid");
  }
  assertSha256("partition_semantic_inventory_evidence", inventory.partitionEvidenceSha256);
  if (inventory.nextStage !== "semantic_classification_v3") {
    throw new Error("partition_semantic_inventory_next_stage_invalid");
  }
  if (
    inventory.authority.analysis !== true || inventory.authority.planning !== true ||
    inventory.authority.codeMutation !== false || inventory.authority.productionWrite !== false ||
    inventory.authority.merge !== false || inventory.authority.deployment !== false ||
    inventory.authority.publicExposure !== false || inventory.authority.release !== false
  ) {
    throw new Error("partition_semantic_inventory_authority_invalid");
  }
}

function assertCorpusBinding(unit: PantavionRecoveryWorkUnit): void {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  if (
    unit.corpus.sourceFingerprint !== contract.sourceFingerprint ||
    unit.corpus.orderedIdFingerprint !== contract.orderedIdFingerprint ||
    unit.corpus.sourceRecordCount !== contract.sourceRecordCount
  ) {
    throw new Error("partition_semantic_corpus_binding_mismatch");
  }
}

function assertLaneSemantics(unit: PantavionRecoveryWorkUnit): void {
  if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") {
    if (unit.implementationState !== "idea" || unit.nextAction !== "PLAN_SCOPED_INTERNAL_DRAFT") {
      throw new Error("partition_semantic_classified_state_invalid");
    }
    assertNonEmpty("partition_semantic_classified_module", unit.route.module);
    assertNonEmpty("partition_semantic_classified_subsystem", unit.route.subsystem);
    assertNonEmpty("partition_semantic_classified_capability", unit.route.capability);
    assertNonEmpty("partition_semantic_classified_target", unit.route.canonicalTarget);
    return;
  }
  if (unit.runtimeLane === "GOVERNED_HOLD") {
    if (unit.implementationState !== "blocked" || unit.nextAction !== "PRESERVE_GOVERNED_HOLD") {
      throw new Error("partition_semantic_hold_state_invalid");
    }
    assertNonEmpty("partition_semantic_hold_disposition", unit.governance.disposition);
    assertNonEmpty("partition_semantic_hold_owner", unit.governance.canonicalOwner);
    assertNonEmpty("partition_semantic_hold_reason", unit.governance.reason);
    return;
  }
  if (unit.runtimeLane === "QUARANTINED_RECURSIVE") {
    if (unit.implementationState !== "blocked" || unit.nextAction !== "PRESERVE_RECURSIVE_PROVENANCE") {
      throw new Error("partition_semantic_recursive_state_invalid");
    }
    return;
  }
  throw new Error("partition_semantic_runtime_lane_invalid");
}

export function digestPantavionRecoveryWorkUnit(unit: PantavionRecoveryWorkUnit): string {
  const { workUnitDigest: _workUnitDigest, ...unsigned } = unit;
  return sha256(canonicalJson(unsigned));
}

function assertWorkUnit(input: {
  unit: PantavionRecoveryWorkUnit;
  expectedRecordId: string;
  expectedSourceRecordSha256: string;
  expectedGlobalOrdinal: number;
  expectedPreviousWorkUnitDigest: string | null;
}): void {
  const { unit } = input;
  if (unit.version !== "pantavion_recovery_work_unit_v1") {
    throw new Error("partition_semantic_work_unit_version_invalid");
  }
  if (!/^recovery_work_unit_[0-9a-f]{64}$/.test(unit.workUnitId)) {
    throw new Error("partition_semantic_work_unit_id_invalid");
  }
  assertSha256("partition_semantic_idempotency_key", unit.idempotencyKey);
  assertSha256("partition_semantic_source_record", unit.source.sourceRecordSha256);
  assertSha256("partition_semantic_semantic_record", unit.source.semanticRecordSha256);
  assertSha256("partition_semantic_work_unit", unit.workUnitDigest);
  if (unit.recordId !== input.expectedRecordId) throw new Error("partition_semantic_record_id_mismatch");
  if (unit.source.sourceRecordSha256 !== input.expectedSourceRecordSha256) {
    throw new Error("partition_semantic_source_digest_mismatch");
  }
  if (unit.source.globalOrdinal !== input.expectedGlobalOrdinal) {
    throw new Error("partition_semantic_global_ordinal_mismatch");
  }
  if (!Number.isInteger(unit.source.batchRecordIndex) || unit.source.batchRecordIndex < 0) {
    throw new Error("partition_semantic_batch_record_index_invalid");
  }
  assertNonEmpty("partition_semantic_batch_file", unit.source.batchFile);
  if (unit.previousWorkUnitDigest !== input.expectedPreviousWorkUnitDigest) {
    throw new Error("partition_semantic_work_unit_chain_mismatch");
  }
  if (unit.governance.executionAuthority !== false) {
    throw new Error("partition_semantic_execution_authority_forbidden");
  }
  if (unit.governance.releaseAuthority !== false) {
    throw new Error("partition_semantic_release_authority_forbidden");
  }
  if (unit.governance.productionWriteAuthority !== false) {
    throw new Error("partition_semantic_production_authority_forbidden");
  }
  assertCorpusBinding(unit);
  assertLaneSemantics(unit);
  if (digestPantavionRecoveryWorkUnit(unit) !== unit.workUnitDigest) {
    throw new Error("partition_semantic_work_unit_digest_mismatch");
  }
}

export function materializePantavionRecoveryPartitionSemanticReceipt(input: {
  inventory: PantavionRecoveryPartitionInventory;
  workUnits: readonly PantavionRecoveryWorkUnit[];
  expectedPreviousWorkUnitDigest: string | null;
  previousReceiptDigest: string | null;
}): PantavionRecoveryPartitionSemanticReceipt {
  assertInventory(input.inventory);
  if (input.workUnits.length !== input.inventory.recordCount) {
    throw new Error("partition_semantic_work_unit_count_mismatch");
  }
  if (input.inventory.partitionOrdinal === 1) {
    if (input.expectedPreviousWorkUnitDigest !== null || input.previousReceiptDigest !== null) {
      throw new Error("partition_semantic_first_partition_chain_must_be_empty");
    }
  } else {
    assertSha256("partition_semantic_previous_work_unit", input.expectedPreviousWorkUnitDigest);
    assertSha256("partition_semantic_previous_receipt", input.previousReceiptDigest);
  }

  const laneCounts: PantavionRecoveryRuntimeCounts = {
    CLASSIFIED_CANDIDATE: 0,
    GOVERNED_HOLD: 0,
    QUARANTINED_RECURSIVE: 0,
  };
  const implementationStateCounts = { idea: 0, blocked: 0 };
  const orderedWorkUnitIdHash = createHash("sha256");
  const orderedSemanticBindingHash = createHash("sha256");
  const seenRecordIds = new Set<string>();
  const seenWorkUnitIds = new Set<string>();
  let previousWorkUnitDigest = input.expectedPreviousWorkUnitDigest;

  input.workUnits.forEach((unit, index) => {
    const evidence = input.inventory.recordEvidence[index];
    assertWorkUnit({
      unit,
      expectedRecordId: evidence.recordId,
      expectedSourceRecordSha256: evidence.sourceRecordSha256,
      expectedGlobalOrdinal: input.inventory.startOrdinal + index,
      expectedPreviousWorkUnitDigest: previousWorkUnitDigest,
    });
    if (seenRecordIds.has(unit.recordId)) throw new Error("partition_semantic_duplicate_record_id");
    if (seenWorkUnitIds.has(unit.workUnitId)) throw new Error("partition_semantic_duplicate_work_unit_id");
    seenRecordIds.add(unit.recordId);
    seenWorkUnitIds.add(unit.workUnitId);
    laneCounts[unit.runtimeLane] += 1;
    implementationStateCounts[unit.implementationState] += 1;
    updateOrderedHash(orderedWorkUnitIdHash, unit.workUnitId, index);
    updateOrderedHash(orderedSemanticBindingHash, canonicalJson([
      unit.recordId,
      unit.source.sourceRecordSha256,
      unit.source.semanticRecordSha256,
      unit.workUnitId,
      unit.workUnitDigest,
      unit.runtimeLane,
      unit.route.module,
      unit.route.subsystem,
      unit.route.capability,
      unit.route.canonicalTarget,
    ]), index);
    previousWorkUnitDigest = unit.workUnitDigest;
  });

  const firstWorkUnitDigest = input.workUnits[0]?.workUnitDigest;
  const terminalWorkUnitDigest = input.workUnits.at(-1)?.workUnitDigest;
  assertSha256("partition_semantic_first_work_unit", firstWorkUnitDigest);
  assertSha256("partition_semantic_terminal_work_unit", terminalWorkUnitDigest);

  const unsigned = {
    marker: "pantavion_recovery_partition_semantic_receipt_v1" as const,
    partitionOrdinal: input.inventory.partitionOrdinal,
    startOrdinal: input.inventory.startOrdinal,
    endOrdinal: input.inventory.endOrdinal,
    recordCount: input.inventory.recordCount,
    input: {
      partitionEvidenceSha256: input.inventory.partitionEvidenceSha256,
      sourceFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
      orderedIdFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
      previousWorkUnitDigest: input.expectedPreviousWorkUnitDigest,
    },
    semanticTruth: {
      laneCounts,
      implementationStateCounts,
      orderedWorkUnitIdFingerprint: orderedWorkUnitIdHash.digest("hex"),
      orderedSemanticBindingFingerprint: orderedSemanticBindingHash.digest("hex"),
      firstWorkUnitDigest,
      terminalWorkUnitDigest,
      rawPayloadDuplicatedIntoReceipt: false as const,
    },
    previousReceiptDigest: input.previousReceiptDigest,
    nextStage: "scoped_internal_draft_planning" as const,
    authority: {
      analysis: true as const,
      planning: true as const,
      codeMutation: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };
  return { ...unsigned, receiptDigest: sha256(canonicalJson(unsigned)) };
}

export function verifyPantavionRecoveryPartitionSemanticReceipt(
  receipt: PantavionRecoveryPartitionSemanticReceipt,
): void {
  if (receipt.marker !== "pantavion_recovery_partition_semantic_receipt_v1") {
    throw new Error("partition_semantic_receipt_marker_invalid");
  }
  if (
    !Number.isInteger(receipt.partitionOrdinal) || receipt.partitionOrdinal < 1 ||
    !Number.isInteger(receipt.startOrdinal) || receipt.startOrdinal < 1 ||
    !Number.isInteger(receipt.endOrdinal) || receipt.endOrdinal < receipt.startOrdinal ||
    !Number.isInteger(receipt.recordCount) || receipt.recordCount < 1 ||
    receipt.recordCount !== receipt.endOrdinal - receipt.startOrdinal + 1
  ) {
    throw new Error("partition_semantic_receipt_range_invalid");
  }
  assertSha256("partition_semantic_receipt_inventory", receipt.input.partitionEvidenceSha256);
  assertSha256("partition_semantic_receipt_work_unit_ids", receipt.semanticTruth.orderedWorkUnitIdFingerprint);
  assertSha256("partition_semantic_receipt_bindings", receipt.semanticTruth.orderedSemanticBindingFingerprint);
  assertSha256("partition_semantic_receipt_first_work_unit", receipt.semanticTruth.firstWorkUnitDigest);
  assertSha256("partition_semantic_receipt_terminal_work_unit", receipt.semanticTruth.terminalWorkUnitDigest);
  if (
    receipt.input.sourceFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint ||
    receipt.input.orderedIdFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint ||
    receipt.nextStage !== "scoped_internal_draft_planning"
  ) {
    throw new Error("partition_semantic_receipt_corpus_binding_invalid");
  }
  const laneTotal = Object.values(receipt.semanticTruth.laneCounts).reduce((sum, count) => sum + count, 0);
  const stateTotal = Object.values(receipt.semanticTruth.implementationStateCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (laneTotal !== receipt.recordCount || stateTotal !== receipt.recordCount) {
    throw new Error("partition_semantic_receipt_count_mismatch");
  }
  assertSha256("partition_semantic_receipt", receipt.receiptDigest);
  const { receiptDigest, ...unsigned } = receipt;
  if (sha256(canonicalJson(unsigned)) !== receiptDigest) {
    throw new Error("partition_semantic_receipt_digest_mismatch");
  }
  if (receipt.semanticTruth.rawPayloadDuplicatedIntoReceipt !== false || receipt.completion !== false) {
    throw new Error("partition_semantic_truth_boundary_invalid");
  }
  if (
    receipt.authority.analysis !== true || receipt.authority.planning !== true ||
    Object.entries(receipt.authority).some(
      ([key, value]) => key !== "analysis" && key !== "planning" && value !== false,
    )
  ) {
    throw new Error("partition_semantic_receipt_authority_invalid");
  }
}
