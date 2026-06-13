const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/file-thread-lock-registry.ts",
  "app/api/internal/pantavion/file-thread-locks/route.ts"
];

const requiredSignals = [
  "pantavion_file_thread_lock_registry_c9c_v1",
  "pantavion_file_thread_locks_route_c9c_v1",
  "acquirePantavionThreadLock",
  "releasePantavionThreadLock",
  "summarizePantavionThreadLocks",
  "detectProtectedDomain",
  "appendPantavionRuntimeLedgerEvent",
  "job_claimed",
  "protected_gate_required",
  "founder_gate_required",
  "worker_thread",
  "github_pr",
  "conflict",
  "released",
  "expired",
  "Unauthorized file/thread lock mutation blocked in production"
];

const forbiddenSignals = [
  "git add .",
  "auto merge without gate",
  "ignore protected",
  "PANTAVION_GITHUB_TOKEN:",
  "PANTAVION_AUTONOMOUS_SECRET:",
  "CRON_SECRET:"
];

const errors = [];

for (const file of requiredFiles) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    errors.push(`Missing file: ${file}`);
    continue;
  }

  const text = fs.readFileSync(full, "utf8");

  if (file.endsWith("route.ts") && /^export const pantavion_.*_marker_v1\s*=/m.test(text)) {
    errors.push(`Route has forbidden exported marker: ${file}`);
  }
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const signal of requiredSignals) {
  if (!allText.includes(signal)) {
    errors.push(`Missing signal: ${signal}`);
  }
}

for (const signal of forbiddenSignals) {
  if (allText.toLowerCase().includes(signal.toLowerCase())) {
    errors.push(`Forbidden unsafe signal found: ${signal}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:file-thread-locks"]) {
  errors.push("Missing package script: audit:file-thread-locks");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
