const fs = require("node:fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workerPath = path.join(root, "services", "translation-agent.ts");
const translationRoutePath = path.join(root, "app", "api", "pantavion", "translate", "route.ts");
const durableMigrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260822194957_create_durable_execution_runtime.sql",
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
const translationRoute = read(translationRoutePath);
const durableMigration = read(durableMigrationPath);
const messageCoreMigration = read(messageCoreMigrationPath);
const messageIdempotencyMigration = read(messageIdempotencyMigrationPath);

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
requirePattern(worker, /result\.error && result\.error\.code !== "23505"/, "idempotency_race_error_guard_missing");
requirePattern(worker, /result\.error\?\.code === "23505"/, "idempotency_race_recovery_missing");
requirePattern(worker, /message_type:\s*"system"/, "schema_valid_translation_message_type_missing");
rejectPattern(worker, /message_type:\s*"translation"/, "invalid_translation_message_type_reintroduced");
requirePattern(worker, /translation_system_sender_id_required/, "required_sender_guard_missing");
requirePattern(worker, /refusing unsupported control task/, "unsupported_control_task_guard_missing");
rejectPattern(worker, /no-op control handler placeholder/, "false_control_completion_reintroduced");

requirePattern(
  translationRoute,
  /const GATEWAY_ROUND_BUDGETS_MS = \[18_000, 12_000\] as const;/,
  "bounded_gateway_round_budgets_missing",
);
requirePattern(
  translationRoute,
  /function gatewayModelRounds\(\): GatewayRoundPlan\[\]/,
  "gateway_model_reroute_plan_missing",
);
requirePattern(
  translationRoute,
  /const secondPrimary = ordered\[1\] \?\? ordered\[0\]/,
  "gateway_second_round_primary_not_rotated",
);
requirePattern(
  translationRoute,
  /function retryableGatewayFailure/,
  "retryable_gateway_failure_classifier_missing",
);
requirePattern(
  translationRoute,
  /for \(let roundIndex = 0; roundIndex < rounds\.length; roundIndex \+= 1\)/,
  "bounded_gateway_retry_loop_missing",
);
requirePattern(
  translationRoute,
  /maxRetries:\s*0/,
  "nested_ai_sdk_retry_must_be_disabled_for_bounded_rounds",
);
requirePattern(
  translationRoute,
  /AbortSignal\.timeout\(input\.roundBudgetMs\)/,
  "per_round_abort_budget_missing",
);
requirePattern(
  translationRoute,
  /publicFallbackAllowed = pantavionPublicTranslationFallbackAllowed\(\)/,
  "public_fallback_policy_guard_missing",
);
requirePattern(
  translationRoute,
  /boundedGatewayRounds:\s*rounds\.length/,
  "gateway_round_truth_metadata_missing",
);
rejectPattern(
  translationRoute,
  /abortSignal:\s*AbortSignal\.timeout\(38_000\)/,
  "single_round_38s_gateway_regressed",
);

requirePattern(
  messageCoreMigration,
  /client_message_id text/,
  "message_client_id_schema_missing",
);
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
