import fs from "node:fs";
import readline from "node:readline";
import { createHash } from "node:crypto";

const BRIDGE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-github-recovery-stage-bridge";
const OIDC_AUDIENCE = "pantavion-supabase-recovery";
const EXPECTED_RECORDS = 82_413;
const EXPECTED_PARTITIONS = 165;
const BATCH_SIZE = 500;
const SOURCE_FINGERPRINT = "99ff942f154e3dac6298488923e15436c9ebf652b64bc14bcfb72efc82b22d2d";
const ORDERED_ID_FINGERPRINT = "d796a55c548655fda8b1014f4db810a7cf7b5f1aef8c7441b985faa8baa00b51";
const WORK_UNITS_PATH = "data/recovery/runtime-fabric-v1/recovery-work-units.ndjson";
const STAGES = ["classify", "canonicalize", "route", "audit", "work_unit_generation"];
const CONCURRENCY = Math.max(1, Math.min(24, Number(process.env.PANTAVION_RECOVERY_STAGE_CONCURRENCY ?? 16)));
const SHA256_RE = /^[0-9a-f]{64}$/;

let cachedOidcToken = null;
let cachedOidcExpiryMs = 0;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function decodeJwtExpiryMs(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Number(JSON.parse(Buffer.from(padded, "base64").toString("utf8")).exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function getOidcToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedOidcToken && cachedOidcExpiryMs - now > 60_000) return cachedOidcToken;
  const requestUrl = new URL(requireEnv("ACTIONS_ID_TOKEN_REQUEST_URL"));
  requestUrl.searchParams.set("audience", OIDC_AUDIENCE);
  const response = await fetch(requestUrl, {
    headers: { Authorization: `Bearer ${requireEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN")}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.value !== "string" || !body.value) {
    throw new Error(`github_oidc_token_request_failed:${response.status}`);
  }
  cachedOidcToken = body.value;
  cachedOidcExpiryMs = decodeJwtExpiryMs(body.value);
  return cachedOidcToken;
}

async function invokeBridge(payload, allowRefresh = true) {
  const token = await getOidcToken(false);
  const response = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 401 && allowRefresh) {
    await getOidcToken(true);
    return invokeBridge(payload, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    const code = typeof body.code === "string" ? body.code : `http_${response.status}`;
    throw new Error(`recovery_stage_bridge_call_failed:${payload.action}:${code}`);
  }
  return body;
}

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function increment(map, key) {
  const normalized = typeof key === "string" && key.trim() ? key.trim() : "UNASSIGNED";
  map[normalized] = (map[normalized] ?? 0) + 1;
}

async function loadWorkUnits() {
  const partitions = Array.from({ length: EXPECTED_PARTITIONS }, () => []);
  const input = readline.createInterface({
    input: fs.createReadStream(WORK_UNITS_PATH, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let total = 0;
  let expectedOrdinal = 1;
  for await (const line of input) {
    if (!line.trim()) continue;
    const unit = JSON.parse(line);
    if (unit?.version !== "pantavion_recovery_work_unit_v1") throw new Error("work_unit_version_invalid");
    if (unit?.corpus?.sourceFingerprint !== SOURCE_FINGERPRINT || unit?.corpus?.orderedIdFingerprint !== ORDERED_ID_FINGERPRINT || unit?.corpus?.sourceRecordCount !== EXPECTED_RECORDS) {
      throw new Error(`work_unit_corpus_contract_invalid:${expectedOrdinal}`);
    }
    if (unit?.source?.globalOrdinal !== expectedOrdinal) throw new Error(`work_unit_ordinal_gap:${expectedOrdinal}`);
    if (!SHA256_RE.test(String(unit?.source?.sourceRecordSha256 ?? "")) || !SHA256_RE.test(String(unit?.source?.semanticRecordSha256 ?? "")) || !SHA256_RE.test(String(unit?.workUnitDigest ?? ""))) {
      throw new Error(`work_unit_digest_invalid:${expectedOrdinal}`);
    }
    const partitionOrdinal = Math.floor((expectedOrdinal - 1) / BATCH_SIZE) + 1;
    partitions[partitionOrdinal - 1].push(unit);
    total += 1;
    expectedOrdinal += 1;
  }
  if (total !== EXPECTED_RECORDS) throw new Error(`work_unit_total_mismatch:${total}`);
  for (let i = 0; i < partitions.length; i += 1) {
    const expected = i === EXPECTED_PARTITIONS - 1 ? EXPECTED_RECORDS - BATCH_SIZE * (EXPECTED_PARTITIONS - 1) : BATCH_SIZE;
    if (partitions[i].length !== expected) throw new Error(`partition_size_mismatch:${i + 1}:${partitions[i].length}`);
  }
  return partitions;
}

function summarizePartition(units, partitionOrdinal, stage) {
  const runtimeLanes = {};
  const modules = {};
  const subsystems = {};
  const capabilities = {};
  const canonicalTargets = new Set();
  const recordIds = new Set();
  const workUnitIds = new Set();
  const idempotencyKeys = new Set();
  let classifiedCandidates = 0;
  let governedHold = 0;
  let recursiveQuarantine = 0;
  let missingCanonicalRoute = 0;
  let reviewRequired = 0;

  for (const unit of units) {
    increment(runtimeLanes, unit.runtimeLane);
    increment(modules, unit.route?.module);
    increment(subsystems, unit.route?.subsystem);
    increment(capabilities, unit.route?.capability);
    if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") classifiedCandidates += 1;
    if (unit.runtimeLane === "GOVERNED_HOLD") { governedHold += 1; reviewRequired += 1; }
    if (unit.runtimeLane === "QUARANTINED_RECURSIVE") recursiveQuarantine += 1;
    if (unit.runtimeLane === "CLASSIFIED_CANDIDATE" && (!unit.route?.module || !unit.route?.subsystem || !unit.route?.capability || !unit.route?.canonicalTarget)) missingCanonicalRoute += 1;
    if (unit.route?.canonicalTarget) canonicalTargets.add(unit.route.canonicalTarget);
    recordIds.add(unit.recordId);
    workUnitIds.add(unit.workUnitId);
    idempotencyKeys.add(unit.idempotencyKey);
  }

  const duplicateRecordIds = units.length - recordIds.size;
  const duplicateWorkUnitIds = units.length - workUnitIds.size;
  const duplicateIdempotencyKeys = units.length - idempotencyKeys.size;
  if (duplicateRecordIds || duplicateWorkUnitIds || duplicateIdempotencyKeys || missingCanonicalRoute) {
    throw new Error(`partition_invariant_failed:${partitionOrdinal}:${duplicateRecordIds}:${duplicateWorkUnitIds}:${duplicateIdempotencyKeys}:${missingCanonicalRoute}`);
  }

  const base = {
    marker: "pantavion_recovery_stage_execution_output_v1",
    stage,
    partitionOrdinal,
    sourceFingerprint: SOURCE_FINGERPRINT,
    orderedIdFingerprint: ORDERED_ID_FINGERPRINT,
    recordCount: units.length,
    uniqueRecordCount: recordIds.size,
    evidenceDigest: hashJson(units.map((u) => [u.recordId, u.workUnitDigest])),
    rawRecoveredPayloadStored: false,
  };

  if (stage === "classify") return { ...base, classifiedCandidates, governedHold, recursiveQuarantine, reviewRequired, runtimeLanes, moduleCount: Object.keys(modules).length };
  if (stage === "canonicalize") return { ...base, uniqueWorkUnitIds: workUnitIds.size, uniqueIdempotencyKeys: idempotencyKeys.size, canonicalTargetCount: canonicalTargets.size, canonicalizationMode: "verified_semantic_target_binding", duplicateRecordIds, duplicateWorkUnitIds, duplicateIdempotencyKeys };
  if (stage === "route") return { ...base, modules, subsystems, capabilities, missingCanonicalRoute };
  if (stage === "audit") return { ...base, auditPassed: true, checks: { duplicateRecordIds, duplicateWorkUnitIds, duplicateIdempotencyKeys, missingCanonicalRoute, countsBalanced: classifiedCandidates + governedHold + recursiveQuarantine === units.length } };
  if (stage === "work_unit_generation") return { ...base, workUnitCount: units.length, agentReadyCandidateCount: classifiedCandidates, governedHold, recursiveQuarantine };
  throw new Error(`unknown_stage:${stage}`);
}

function reviewStatusFor(unit) {
  if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") return "SEMANTICALLY_CLASSIFIED";
  if (unit.runtimeLane === "GOVERNED_HOLD") return "REVIEW_REQUIRED";
  return "PRESERVED_RECURSIVE_ARTIFACT";
}

function catalogRows(units, partitionOrdinal) {
  return units.map((unit) => ({
    record_id: unit.recordId,
    source_fingerprint: SOURCE_FINGERPRINT,
    ordered_id_fingerprint: ORDERED_ID_FINGERPRINT,
    partition_ordinal: partitionOrdinal,
    global_ordinal: unit.source.globalOrdinal,
    source_batch_file: unit.source.batchFile,
    source_batch_record_index: unit.source.batchRecordIndex,
    source_record_sha256: unit.source.sourceRecordSha256,
    semantic_record_sha256: unit.source.semanticRecordSha256,
    review_status: reviewStatusFor(unit),
    theme: unit.route?.module ?? null,
    section: unit.route?.subsystem ?? null,
    content_type: unit.route?.artifactType ?? null,
    module: unit.route?.module ?? null,
    subsystem: unit.route?.subsystem ?? null,
    capability: unit.route?.capability ?? null,
    feature: unit.route?.feature ?? null,
    canonical_target: unit.route?.canonicalTarget ?? null,
    classification_method: unit.route?.classificationMethod ?? null,
    runtime_lane: unit.runtimeLane,
    implementation_state: unit.implementationState,
    next_action: unit.nextAction,
    work_unit_id: unit.workUnitId,
    idempotency_key: unit.idempotencyKey,
    work_unit_digest: unit.workUnitDigest,
    review_reasons: unit.reviewReasons ?? [],
    governance: unit.governance ?? {},
  }));
}

async function runPool(items, worker, concurrency = CONCURRENCY) {
  let cursor = 0;
  const failures = [];
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try { await worker(items[index], index); }
      catch (error) { failures.push(error instanceof Error ? error : new Error(String(error))); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runner()));
  if (failures.length) throw new Error(`parallel_stage_failures:${failures.slice(0, 10).map((e) => e.message).join("|")}`);
}

const runId = requireEnv("GITHUB_RUN_ID");
const runAttempt = requireEnv("GITHUB_RUN_ATTEMPT");
const partitions = await loadWorkUnits();
console.log(JSON.stringify({ marker: "pantavion_recovery_stage_executor_loaded_v1", records: EXPECTED_RECORDS, partitions: EXPECTED_PARTITIONS, concurrency: CONCURRENCY }));

for (const stage of STAGES) {
  const listed = await invokeBridge({ action: "list_stage", stage });
  if (!Array.isArray(listed.records) || listed.records.length !== EXPECTED_PARTITIONS) throw new Error(`stage_job_count_mismatch:${stage}:${listed.records?.length ?? -1}`);
  const failedExisting = listed.records.filter((r) => r.status === "failed");
  if (failedExisting.length) throw new Error(`stage_has_failed_jobs:${stage}:${failedExisting.length}`);
  const pending = listed.records.filter((r) => ["planned", "queued"].includes(r.status));
  const paused = listed.records.filter((r) => r.status === "paused");
  console.log(JSON.stringify({ marker: "pantavion_recovery_stage_start_v1", stage, pending: pending.length, paused: paused.length, succeeded: listed.records.filter((r) => r.status === "succeeded").length }));

  if (pending.length === 0 && paused.length > 0) throw new Error(`stage_dependency_not_unlocked:${stage}:${paused.length}`);

  await runPool(pending, async (record, index) => {
    const partitionOrdinal = Number(record?.input?.partitionOrdinal);
    if (!Number.isInteger(partitionOrdinal) || partitionOrdinal < 1 || partitionOrdinal > EXPECTED_PARTITIONS) throw new Error(`stage_partition_invalid:${stage}`);
    const ownerId = `github-recovery-stage:${runId}:${runAttempt}:${stage}:${partitionOrdinal}:${index}`.slice(0, 180);
    const claimed = await invokeBridge({ action: "claim_stage", executionId: record.executionId, ownerId, leaseMs: 300000 });
    if (claimed.acquired !== true) return;
    try {
      const units = partitions[partitionOrdinal - 1];
      let output = summarizePartition(units, partitionOrdinal, stage);
      if (stage === "work_unit_generation") {
        const catalog = await invokeBridge({ action: "upsert_catalog", partitionOrdinal, rows: catalogRows(units, partitionOrdinal) });
        if (catalog.storedForPartition !== units.length) throw new Error(`catalog_partition_count_mismatch:${partitionOrdinal}:${catalog.storedForPartition}:${units.length}`);
        output = { ...output, catalogRecordsStored: catalog.storedForPartition };
      }
      await invokeBridge({ action: "finish_stage", executionId: record.executionId, ownerId, fencingToken: claimed.fence.fencingToken, succeeded: true, output });
    } catch (error) {
      await invokeBridge({ action: "finish_stage", executionId: record.executionId, ownerId, fencingToken: claimed.fence.fencingToken, succeeded: false, error: error instanceof Error ? error.message : String(error) }).catch(() => null);
      throw error;
    }
  });

  const verified = await invokeBridge({ action: "list_stage", stage });
  const succeeded = verified.records.filter((r) => r.status === "succeeded").length;
  const failed = verified.records.filter((r) => r.status === "failed").length;
  const remaining = verified.records.filter((r) => ["planned", "queued", "running", "paused"].includes(r.status)).length;
  console.log(JSON.stringify({ marker: "pantavion_recovery_stage_terminal_check_v1", stage, succeeded, failed, remaining }));
  if (succeeded !== EXPECTED_PARTITIONS || failed !== 0 || remaining !== 0) throw new Error(`stage_not_terminal:${stage}:${succeeded}:${failed}:${remaining}`);
}

const finalStatus = await invokeBridge({ action: "status" });
if (finalStatus.catalogRecords !== EXPECTED_RECORDS) throw new Error(`catalog_total_mismatch:${finalStatus.catalogRecords}`);
for (const stage of STAGES) {
  if (finalStatus.stages?.[stage]?.succeeded !== EXPECTED_PARTITIONS || finalStatus.stages?.[stage]?.failed !== 0) throw new Error(`final_stage_status_invalid:${stage}`);
}
console.log(JSON.stringify({ marker: "pantavion_recovery_downstream_terminal_v1", ...finalStatus }));
console.log("Pantavion Recovery Downstream Executor: VERIFIED 82,413 catalog records and 825/825 stage jobs succeeded");
