import { runPantavionRecoveryFencedExecutor } from "../core/recovery/pantavion-recovery-fenced-executor.ts";

const BRIDGE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-github-recovery-executor-bridge";
const OIDC_AUDIENCE = "pantavion-supabase-recovery";
const TASK_NAME = "pantavion:recovery_partition:v1";
const EXPECTED_PARTITIONS = 165;
const MAX_ROUNDS = 24;

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
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return Number(decoded.exp ?? 0) * 1000;
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
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (response.status === 401 && allowRefresh) {
    await getOidcToken(true);
    return invokeBridge(payload, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    const code = typeof body.code === "string" ? body.code : `http_${response.status}`;
    throw new Error(`github_recovery_bridge_call_failed:${payload.action}:${code}`);
  }
  return body;
}

class GitHubOidcRecoveryStore {
  async listByTaskName(taskName, limit = EXPECTED_PARTITIONS) {
    if (taskName !== TASK_NAME) throw new Error(`unexpected_task_name:${taskName}`);
    const body = await invokeBridge({ action: "list" });
    if (!Array.isArray(body.records)) throw new Error("recovery_list_records_missing");
    return body.records.slice(0, Math.max(1, Math.min(EXPECTED_PARTITIONS, limit)));
  }

  async claimFenced(executionId, ownerId, leaseMs = 120_000, expectedStatuses = ["queued", "planned"]) {
    if (expectedStatuses.some((status) => status !== "queued" && status !== "planned")) {
      throw new Error("unexpected_claim_status");
    }
    const body = await invokeBridge({ action: "claim", executionId, ownerId, leaseMs });
    if (body.acquired !== true) return null;
    if (!body.record || !body.fence) throw new Error("recovery_claim_payload_missing");
    return { record: body.record, fence: body.fence };
  }

  async checkpointFenced(fence, label, state = {}) {
    const body = await invokeBridge({
      action: "checkpoint",
      executionId: fence.executionId,
      ownerId: fence.ownerId,
      fencingToken: fence.fencingToken,
      label,
      state,
    });
    if (!body.record) throw new Error("recovery_checkpoint_record_missing");
    return body.record;
  }

  async finishFencedSuccess(fence, output) {
    const body = await invokeBridge({
      action: "finish",
      executionId: fence.executionId,
      ownerId: fence.ownerId,
      fencingToken: fence.fencingToken,
      succeeded: true,
      output,
    });
    if (!body.record) throw new Error("recovery_finish_success_record_missing");
    return body.record;
  }

  async finishFencedFailure(fence, error) {
    const body = await invokeBridge({
      action: "finish",
      executionId: fence.executionId,
      ownerId: fence.ownerId,
      fencingToken: fence.fencingToken,
      succeeded: false,
      error: String(error).slice(0, 500),
    });
    if (!body.record) throw new Error("recovery_finish_failure_record_missing");
    return body.record;
  }
}

function countStatuses(records) {
  return records.reduce(
    (acc, record) => {
      if (record.status === "succeeded") acc.succeeded += 1;
      else if (record.status === "failed") acc.failed += 1;
      else if (["planned", "queued", "running"].includes(record.status)) acc.remaining += 1;
      else acc.other += 1;
      return acc;
    },
    { succeeded: 0, failed: 0, remaining: 0, other: 0 },
  );
}

const runId = requireEnv("GITHUB_RUN_ID");
const runAttempt = requireEnv("GITHUB_RUN_ATTEMPT");
const store = new GitHubOidcRecoveryStore();
let completed = false;

for (let round = 1; round <= MAX_ROUNDS; round += 1) {
  const ownerId = `github-recovery:${runId}:${runAttempt}:${round}`;
  const report = await runPantavionRecoveryFencedExecutor({
    store,
    limit: 10,
    rootDir: process.cwd(),
    ownerId,
  });
  console.log(JSON.stringify({ round, ...report }));

  const records = await store.listByTaskName(TASK_NAME, EXPECTED_PARTITIONS);
  if (records.length !== EXPECTED_PARTITIONS) {
    throw new Error(`recovery_partition_count_mismatch:${records.length}`);
  }
  const counts = countStatuses(records);
  console.log(JSON.stringify({ marker: "pantavion_github_recovery_progress_v1", round, ...counts }));

  if (counts.failed > 0) throw new Error(`recovery_partition_failed_count:${counts.failed}`);
  if (counts.remaining === 0 && counts.succeeded === EXPECTED_PARTITIONS) {
    completed = true;
    break;
  }
  if (report.status === "blocked" && report.succeededExecutions === 0) {
    throw new Error(`recovery_executor_blocked:${report.issues.join("|")}`);
  }
}

const finalRecords = await store.listByTaskName(TASK_NAME, EXPECTED_PARTITIONS);
const finalCounts = countStatuses(finalRecords);
console.log(JSON.stringify({ marker: "pantavion_github_recovery_final_v1", ...finalCounts }));
if (!completed || finalCounts.succeeded !== EXPECTED_PARTITIONS || finalCounts.failed !== 0 || finalCounts.remaining !== 0) {
  throw new Error(`recovery_executor_not_terminal:${JSON.stringify(finalCounts)}`);
}

console.log("Pantavion GitHub OIDC Recovery Executor: VERIFIED 165/165 succeeded");
