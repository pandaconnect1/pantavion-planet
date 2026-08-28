const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const workerPath = path.join(root, "services", "translation-agent.ts");
const storePath = path.join(root, "core", "runtime", "supabase-durable-execution-store.ts");
const durableMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260822194957_create_durable_execution_runtime.sql",
);
const fencingMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260828062237_durable_execution_lease_fencing.sql",
);
const fencedPersistenceMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260828082934_durable_translation_fenced_persistence.sql",
);
const messageCoreMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260812205420_human_communication_core.sql",
);
const messageIdempotencyMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260827203215_enforce_message_translation_idempotency.sql",
);

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`missing_required_file:${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8");
}

function requirePattern(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`translation_worker_gate_failed:${label}`);
}

function rejectPattern(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`translation_worker_gate_failed:${label}`);
}

const worker = read(workerPath);
const store = read(storePath);
const durableMigration = read(durableMigrationPath);
const fencingMigration = read(fencingMigrationPath);
const fencedPersistenceMigration = read(fencedPersistenceMigrationPath);
const messageCoreMigration = read(messageCoreMigrationPath);
const messageIdempotencyMigration = read(messageIdempotencyMigrationPath);

// Legacy RPC remains during rollout so schema-first deployment cannot break an older worker revision.
requirePattern(
  durableMigration,
  /create or replace function public\.pantavion_claim_durable_execution\s*\(/,
  "atomic_claim_rpc_missing",
);
requirePattern(
  durableMigration,
  /update public\.durable_executions[\s\S]*status = 'running'[\s\S]*attempt = attempt \+ 1[\s\S]*status = any\(p_expected_statuses\)/,
  "atomic_claim_contract_changed",
);
requirePattern(
  durableMigration,
  /revoke all on function public\.pantavion_claim_durable_execution\(text, text\[\]\) from public, anon, authenticated/,
  "atomic_claim_rpc_exposure_regressed",
);

// New lease/fencing schema must be durable, reclaimable and inaccessible to browser roles.
for (const column of ["lease_owner", "lease_token", "lease_expires_at", "lease_heartbeat_at"]) {
  requirePattern(fencingMigration, new RegExp(`add column if not exists ${column}`), `fencing_column_missing:${column}`);
}
requirePattern(
  fencingMigration,
  /create index if not exists durable_executions_running_lease_expiry_idx[\s\S]*where status = 'running' and lease_expires_at is not null/,
  "lease_reclaim_index_missing",
);
for (const rpc of [
  "pantavion_claim_durable_execution_fenced",
  "pantavion_heartbeat_durable_execution_fenced",
  "pantavion_append_durable_checkpoint_fenced",
  "pantavion_finish_durable_execution_fenced",
]) {
  requirePattern(
    fencingMigration,
    new RegExp(`create or replace function public\\.${rpc}\\s*\\(`),
    `fenced_rpc_missing:${rpc}`,
  );
  requirePattern(
    fencingMigration,
    new RegExp(`revoke all on function public\\.${rpc}\\(`),
    `fenced_rpc_browser_revoke_missing:${rpc}`,
  );
  requirePattern(
    fencingMigration,
    new RegExp(`grant execute on function public\\.${rpc}\\(`),
    `fenced_rpc_service_role_grant_missing:${rpc}`,
  );
}
requirePattern(fencingMigration, /lease_token = d\.lease_token \+ 1/, "monotonic_fencing_token_missing");
requirePattern(
  fencingMigration,
  /d\.status = 'running'[\s\S]*d\.lease_expires_at is null or d\.lease_expires_at <= v_now/,
  "expired_running_reclaim_missing",
);
requirePattern(
  fencingMigration,
  /d\.lease_owner = v_owner[\s\S]*d\.lease_token = p_fencing_token[\s\S]*d\.lease_expires_at > v_now/,
  "fenced_write_guard_missing",
);

// The user-visible translation side effect must be fenced in the same database transaction.
requirePattern(
  fencedPersistenceMigration,
  /create or replace function public\.pantavion_persist_translation_message_fenced\s*\(/,
  "fenced_translation_persistence_rpc_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /from public\.durable_executions as d[\s\S]*d\.task_name = 'translation:process_message'[\s\S]*d\.lease_owner = v_owner[\s\S]*d\.lease_token = p_fencing_token[\s\S]*d\.lease_expires_at > v_now[\s\S]*for update/,
  "translation_side_effect_fence_lock_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /v_execution\.input->>'conversationId'[\s\S]*p_conversation_id::text/,
  "translation_conversation_binding_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /v_execution\.input->>'systemSenderId'[\s\S]*p_sender_id::text/,
  "translation_sender_binding_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /v_client_message_id <> 'translation:' \|\| p_execution_id/,
  "translation_execution_idempotency_binding_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /insert into public\.messages\([\s\S]*message_type[\s\S]*'system'/,
  "atomic_translation_message_insert_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /revoke all on function public\.pantavion_persist_translation_message_fenced\([\s\S]*from public, anon, authenticated/,
  "fenced_translation_persistence_browser_revoke_missing",
);
requirePattern(
  fencedPersistenceMigration,
  /grant execute on function public\.pantavion_persist_translation_message_fenced\([\s\S]*to service_role/,
  "fenced_translation_persistence_service_role_grant_missing",
);

// Supabase store must expose only owner+token guarded worker mutations.
requirePattern(store, /async claimFenced\s*\(/, "store_fenced_claim_missing");
requirePattern(store, /pantavion_claim_durable_execution_fenced/, "store_fenced_claim_rpc_missing");
requirePattern(store, /pantavion_heartbeat_durable_execution_fenced/, "store_fenced_heartbeat_rpc_missing");
requirePattern(store, /pantavion_append_durable_checkpoint_fenced/, "store_fenced_checkpoint_rpc_missing");
requirePattern(store, /pantavion_finish_durable_execution_fenced/, "store_fenced_finish_rpc_missing");
requirePattern(store, /async persistTranslationFenced\s*\(/, "store_fenced_translation_persistence_missing");
requirePattern(store, /pantavion_persist_translation_message_fenced/, "store_fenced_translation_persistence_rpc_missing");
requirePattern(store, /PantavionStaleExecutionFenceError/, "store_stale_fence_fail_closed_missing");

// The production translation worker must never fall back to an unfenced claim/write/side-effect path.
requirePattern(worker, /durable\.claimFenced\s*\(/, "worker_does_not_use_fenced_claim");
requirePattern(worker, /durable\.checkpointFenced\s*\(/, "worker_fenced_checkpoint_missing");
requirePattern(worker, /durable\.heartbeatFenced\s*\(/, "worker_lease_heartbeat_missing");
requirePattern(worker, /durable\.persistTranslationFenced\s*\(/, "worker_atomic_fenced_translation_persistence_missing");
requirePattern(worker, /durable\.finishFencedSuccess\s*\(/, "worker_fenced_success_missing");
requirePattern(worker, /durable\.finishFencedFailure\s*\(/, "worker_fenced_failure_missing");
requirePattern(worker, /PantavionStaleExecutionFenceError/, "worker_stale_fence_guard_missing");
requirePattern(worker, /translation-agent:\$\{process\.pid\}:\$\{randomUUID\(\)\}/, "worker_identity_not_unique");
rejectPattern(worker, /createAdminClient/, "worker_direct_admin_client_reintroduced");
rejectPattern(worker, /\.from\(["']messages["']\)/, "worker_direct_message_access_reintroduced");
rejectPattern(worker, /\.rpc\("pantavion_claim_durable_execution"/, "worker_legacy_claim_reintroduced");
rejectPattern(worker, /durable\.put\s*\(/, "worker_unfenced_put_reintroduced");
requirePattern(worker, /clientMessageId:\s*`translation:\$\{executionId\}`/, "translation_idempotency_key_missing");
requirePattern(
  worker,
  /\["queued", "planned"\]\.includes\(exec\.status\)/,
  "canonical_queue_status_filter_missing",
);
rejectPattern(worker, /status:\s*"pending"|status:\s*"done"/, "legacy_execution_status_reintroduced");
requirePattern(worker, /if \(!res\.ok\)/, "http_failure_guard_missing");
requirePattern(worker, /if \(!body \|\| body\.ok === false\)/, "provider_failure_guard_missing");
requirePattern(worker, /translation_system_sender_id_required/, "required_sender_guard_missing");
requirePattern(worker, /refusing unsupported control task/, "unsupported_control_task_guard_missing");
rejectPattern(worker, /no-op control handler placeholder/, "false_control_completion_reintroduced");

requirePattern(messageCoreMigration, /client_message_id text/, "message_client_id_schema_missing");
requirePattern(
  messageIdempotencyMigration,
  /create unique index if not exists messages_sender_client_id_unique_idx[\s\S]*on public\.messages\(sender_id, client_message_id\)[\s\S]*where client_message_id is not null/,
  "message_idempotency_schema_missing",
);
requirePattern(
  messageCoreMigration,
  /message_type text not null default 'text'[\s\S]*'system'/,
  "system_message_type_not_allowed",
);

console.log("pantavion_translation_worker_gate: PASS");
