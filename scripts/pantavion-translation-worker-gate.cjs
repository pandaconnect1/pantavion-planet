const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const workerPath = path.join(root, "services", "translation-agent.ts");
const migrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260811002000_create_durable_execution_runtime.sql",
);
const messageMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260810200000_create_human_communication_core.sql",
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
const durableMigration = read(migrationPath);
const messageMigration = read(messageMigrationPath);

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
  worker,
  /\.rpc\("pantavion_claim_durable_execution"/,
  "worker_does_not_use_atomic_claim",
);
requirePattern(
  worker,
  /if \(claim\.data !== true\) return null;/,
  "claim_loser_must_not_execute",
);
requirePattern(
  worker,
  /\["queued", "planned"\]\.includes\(exec\.status\)/,
  "canonical_queue_status_filter_missing",
);
rejectPattern(worker, /status:\s*"pending"|status:\s*"done"/, "legacy_execution_status_reintroduced");
requirePattern(worker, /if \(!res\.ok\)/, "http_failure_guard_missing");
requirePattern(worker, /if \(!body \|\| body\.ok === false\)/, "provider_failure_guard_missing");
requirePattern(worker, /client_message_id:\s*`translation:\$\{executionId\}`/, "translation_idempotency_key_missing");
requirePattern(worker, /message_type:\s*"system"/, "schema_valid_translation_message_type_missing");
rejectPattern(worker, /message_type:\s*"translation"/, "invalid_translation_message_type_reintroduced");
requirePattern(worker, /translation_system_sender_id_required/, "required_sender_guard_missing");
requirePattern(worker, /refusing unsupported control task/, "unsupported_control_task_guard_missing");
rejectPattern(worker, /no-op control handler placeholder/, "false_control_completion_reintroduced");
requirePattern(
  messageMigration,
  /client_message_id text[\s\S]*unique index if not exists messages_sender_client_id_unique_idx/,
  "message_idempotency_schema_missing",
);
requirePattern(
  messageMigration,
  /message_type text not null default 'text'[\s\S]*'system'/,
  "system_message_type_not_allowed",
);

console.log("pantavion_translation_worker_gate: PASS");
