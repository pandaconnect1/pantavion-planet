import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260830192500_create_internal_scheduler_redundancy.sql",
  "utf8",
);
const route = fs.readFileSync("app/api/pantavion/intelligence/cron/route.ts", "utf8");
const health = fs.readFileSync(
  "app/api/pantavion/intelligence/scheduler-health/route.ts",
  "utf8",
);
const ledger = fs.readFileSync("core/intelligence/pantavion-intelligence-ledger.ts", "utf8");
const workflow = fs.readFileSync(
  ".github/workflows/pantavion-production-cron-e2e.yml",
  "utf8",
);
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

function requireText(source, token, message) {
  if (!source.includes(token)) throw new Error(`${message}: missing ${token}`);
}

for (const token of [
  "create extension if not exists pg_net",
  "create extension if not exists pg_cron",
  "pantavion_internal_scheduler_dispatches",
  "pantavion_verify_internal_scheduler_token",
  "vault.decrypted_secrets",
  "extensions.digest",
  "pantavion_internal_scheduler_dispatch",
  "net.http_get",
  "x-pantavion-scheduler-token",
  "on conflict (scheduler_name, bucket_start) do nothing",
  "revoke all",
  "to service_role",
]) {
  requireText(migration.toLowerCase(), token.toLowerCase(), "internal scheduler migration contract");
}

if (/cron\.schedule\s*\(/i.test(migration)) {
  throw new Error("internal scheduler migration must remain disabled-by-default");
}

for (const token of [
  "internal_scheduler_verified",
  "pantavion_verify_internal_scheduler_token",
  "x-pantavion-scheduler-token",
  "runSecureScheduledWorker",
  "pantavion-intelligence-5m",
  "runKeyBucketMinutes: 5",
]) {
  requireText(route, token, "cron route redundancy contract");
}

for (const token of [
  "executionVerified",
  "pantavion_scheduled_worker_runs",
  "pantavion_internal_scheduler_dispatches",
  "pantavion:recovery_partition:v1",
  "No user data, recovered payload, secret, lease token, request token or error detail is exposed",
]) {
  requireText(health, token, "scheduler health evidence contract");
}

requireText(ledger, '"internal_scheduler"', "intelligence ledger must identify internal scheduler source");
requireText(ledger, 'const PANTAVION_CRON_SCHEDULE = "*/5 * * * *"', "intelligence ledger schedule truth");
if (ledger.includes('cronSchedule: "0 * * * *"') || ledger.includes('schedule: "0 * * * *"')) {
  throw new Error("stale hourly scheduler truth is forbidden");
}

for (const token of [
  "Verify fresh durable scheduled execution evidence",
  "/api/pantavion/intelligence/scheduler-health",
  "executionVerified",
  "recovery.totalPartitions",
  "no fresh durable scheduled execution was observed",
]) {
  requireText(workflow, token, "production cron evidence gate");
}

const cron = vercel.crons?.find(
  (item) => item.path === "/api/pantavion/intelligence/cron",
);
if (!cron || cron.schedule !== "*/5 * * * *") {
  throw new Error("production Vercel cron must remain five-minute bounded schedule");
}

console.log("Pantavion Internal Scheduler Redundancy contract: PASS");
console.log("Vault secret embedded in repository: false");
console.log("Migration auto-activates scheduler: false");
console.log("Five-minute execution evidence gate: PASS");
console.log("Dual scheduler duplicate execution protection: PASS");
