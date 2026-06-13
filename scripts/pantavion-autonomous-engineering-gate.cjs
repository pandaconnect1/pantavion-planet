const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/kernel/autonomous-engineering-kernel.ts",
  "core/pantaai/autonomous-code/autonomous-job-queue.ts",
  "core/pantaai/autonomous-code/protected-path-policy.ts",
  "core/pantaai/autonomous-code/capability-gap-scanner.ts",
  "core/pantaai/autonomous-code/provider-ecosystem-registry.ts",
  "core/pantaai/autonomous-code/china-superapp-capability-map.ts",
  "core/pantaai/autonomous-code/kernel-domain-cores.ts",
  "core/pantaai/autonomous-code/github-autonomous-writer.ts",
  "app/api/internal/pantavion/autonomous-engineering/route.ts",
];

const requiredMarkers = [
  "pantavion_autonomous_engineering_kernel_v1_24_366",
  "pantavion_autonomous_registry_c1_v1",
  "pantavion_china_superapp_capability_map_c1_v1",
  "pantavion_protected_path_policy_c1_v1",
  "pantavion_autonomous_job_queue_c1_v1",
  "pantavion_capability_gap_scanner_c1_v1",
  "pantavion_domain_cores_c1_v1",
  "pantavion_github_autonomous_writer_c1_v1",
  "pantavion_autonomous_engineering_route_c1_v1",
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    errors.push(`Missing file: ${file}`);
  }
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const marker of requiredMarkers) {
  if (!allText.includes(marker)) {
    errors.push(`Missing marker: ${marker}`);
  }
}

const packageJsonPath = path.join(process.cwd(), "package.json");
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (!pkg.scripts || !pkg.scripts["audit:autonomous"]) {
    errors.push("Missing package script: audit:autonomous");
  }
}

const vercelPath = path.join(process.cwd(), "vercel.json");
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
  const crons = Array.isArray(vercel.crons) ? vercel.crons : [];
  const hasCron = crons.some(
    (item) =>
      item.path === "/api/internal/pantavion/autonomous-engineering" &&
      item.schedule === "*/5 * * * *"
  );
  if (!hasCron) {
    errors.push("Missing Vercel cron for autonomous engineering every 5 minutes.");
  }
} else {
  errors.push("Missing vercel.json with autonomous engineering cron.");
}

const report = {
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  requiredMarkers: requiredMarkers.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
