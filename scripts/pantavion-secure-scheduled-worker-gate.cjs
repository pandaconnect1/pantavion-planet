const fs = require("node:fs");

const route = fs.readFileSync("app/api/pantavion/intelligence/cron/route.ts", "utf8");
const worker = fs.readFileSync("core/runtime/secure-scheduled-worker.ts", "utf8");
const runKey = fs.readFileSync("core/runtime/scheduled-run-key.ts", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260824134053_create_secure_scheduled_worker.sql",
  "utf8",
);
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

function requireText(source, token, message) {
  if (!source.includes(token)) throw new Error(message + ": missing " + token);
}

requireText(route, "CRON_SECRET", "cron must require a secret");
requireText(route, "timingSafeEqual", "cron secret comparison must be timing-safe");
requireText(route, "runSecureScheduledWorker", "cron must use the secure worker wrapper");
requireText(route, '"pantavion-intelligence-5m"', "cron must use the dedicated five-minute worker identity");
requireText(route, "runKeyBucketMinutes: 5", "cron run-key bucket must match five-minute schedule");
if (route.includes("vercel-cron/1.0")) {
  throw new Error("user-agent-only cron authorization is forbidden");
}

requireText(worker, "pantavion_claim_scheduled_worker", "worker must atomically claim a lease");
requireText(worker, "pantavion_finish_scheduled_worker", "worker must record a terminal state");
requireText(worker, "createScheduledRunKey", "worker must use an idempotency run key");
requireText(worker, "runKeyBucketMinutes", "worker must support bounded run-key buckets");
requireText(runKey, "60 % bucketMinutes", "run-key bucket must divide one UTC hour exactly");

for (const token of [
  "pantavion_scheduled_worker_leases",
  "pantavion_scheduled_worker_runs",
  "enable row level security",
  "revoke all",
  "to service_role",
  "duplicate_run_key",
  "active_lease",
]) {
  requireText(migration.toLowerCase(), token, "secure worker migration is incomplete");
}

const cron = vercel.crons?.find(
  (item) => item.path === "/api/pantavion/intelligence/cron",
);
if (!cron || cron.schedule !== "*/5 * * * *") {
  throw new Error("expected five-minute production cron is missing");
}

console.log("Pantavion secure scheduled worker gate: PASS");
console.log("Five-minute cron/run-key alignment: PASS");
