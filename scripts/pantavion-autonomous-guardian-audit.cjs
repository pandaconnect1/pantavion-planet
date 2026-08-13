const fs = require("fs");

const failures = [];

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
}

function mustExist(path) {
  if (!fs.existsSync(path)) failures.push(`Missing file: ${path}`);
}

function mustContain(path, marker) {
  if (!read(path).includes(marker)) failures.push(`${path} missing ${marker}`);
}

[
  "core/guardian/pantavion-autonomous-internal-ai-os.ts",
  "app/page.tsx",
  "app/pantavion-home-client.tsx",
  "app/panta-ai/page.tsx",
  "app/sos/page.tsx",
  "app/translate/page.tsx",
  "app/product-status/page.tsx",
  "core/pantavion/no-dead-surface-ledger.ts"
].forEach(mustExist);

[
  "PANTAVION_AUTONOMOUS_INTERNAL_AI_OS_V1",
  "PANTAVION_GUARDIAN_KERNEL_V1",
  "PANTAVION_BUILDER_KERNEL_V1",
  "PANTAVION_RESEARCH_KERNEL_V1",
  "PANTAVION_PRODUCT_TRUTH_KERNEL_V1",
  "PANTAVION_LANGUAGE_KERNEL_V1",
  "PANTAVION_SAFETY_LEGAL_KERNEL_V1",
  "PANTAVION_USER_AI_CONTROL_PLANE_V1",
  "PANTAVION_FOUNDER_APPROVAL_GATE_V1"
].forEach((marker) => mustContain("core/guardian/pantavion-autonomous-internal-ai-os.ts", marker));

mustContain("app/page.tsx", "PantavionHomeClient");
mustContain("app/pantavion-home-client.tsx", "data-pantavion-live-ui");
mustContain("app/panta-ai/page.tsx", "PANTAVION_AI_COMMAND_CENTER_V1");
mustContain("app/sos/page.tsx", "PANTAVION_SOS_AI_CENTER_V1");
mustContain("app/translate/page.tsx", "/api/pantavion/translate");
mustContain("app/product-status/page.tsx", "Pantavion Realness Status");
mustContain("core/pantavion/no-dead-surface-ledger.ts", "NO_DEAD_SURFACE_LEDGER");

["/social", "/people", "/messages", "/translate", "/sos"].forEach((route) => {
  if (!read("app/pantavion-home-client.tsx").includes(route)) {
    failures.push(`Current public gateway missing route ${route}`);
  }
});

if (failures.length) {
  console.error("Pantavion Autonomous Guardian audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Pantavion Autonomous Guardian audit passed.");
