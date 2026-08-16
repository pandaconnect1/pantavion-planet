const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "core/live/pantavion-live-surface.ts",
  "components/pantavion/PantavionLiveSurfaceClient.tsx",
  "app/pantavion/live/page.tsx",
  "app/pantavion/chat/page.tsx",
  "app/pantavion/pulse/page.tsx",
  "app/api/pantavion/live/status/route.ts",
  "app/api/pantavion/chat/route.ts",
  "app/api/pantavion/pulse/route.ts",
  "scripts/pantavion-live-surface-gate.cjs",
  "docs/continuity/pantavion-live-surface.md",
  "package.json"
];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const core = read("core/live/pantavion-live-surface.ts");
const client = read("components/pantavion/PantavionLiveSurfaceClient.tsx");
const chatRoute = read("app/api/pantavion/chat/route.ts");
const pulseRoute = read("app/api/pantavion/pulse/route.ts");
const pkgText = read("package.json");

const markers = [
  "PANTAVION_LIVE_SURFACE_ID",
  "Pantavion Chat",
  "Pantavion Pulse",
  "People / Social Graph",
  "Execution Engine",
  "requires_founder_approval",
  "truthRule"
];

for (const marker of markers) {
  if (!core.includes(marker)) failures.push("Live surface core missing marker: " + marker);
}

if (!client.includes("Send to Pantavion Chat")) {
  failures.push("Live client missing chat send button.");
}

if (!client.includes("Publish Pulse")) {
  failures.push("Live client missing pulse publish button.");
}

if (!chatRoute.includes("runPantavionExecution")) {
  failures.push("Chat route must connect to execution kernel.");
}

if (!chatRoute.includes("chat.jsonl")) {
  failures.push("Chat route must save local runtime JSONL.");
}

if (!pulseRoute.includes("pulse.jsonl")) {
  failures.push("Pulse route must save local runtime JSONL.");
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["audit:live-surface"] !== "node scripts/pantavion-live-surface-gate.cjs") {
    failures.push("package.json missing audit:live-surface.");
  }
}

const unsafe = chatRoute + "\n" + pulseRoute + "\n" + client;

if (unsafe.includes("git add .")) failures.push("Live surface must not contain blanket git add.");
if (unsafe.includes("vercel --prod")) failures.push("Live surface must not production deploy.");
if (unsafe.includes("password bypass")) failures.push("Unsafe bypass language detected.");

if (failures.length > 0) {
  console.error("PANTAVION LIVE SURFACE GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION LIVE SURFACE GATE: PASSED");
  console.log("- live surface core present");
  console.log("- live UI present");
  console.log("- chat page present");
  console.log("- pulse page present");
  console.log("- live status API present");
  console.log("- chat API connected to execution kernel");
  console.log("- pulse API present");
  console.log("- package script present");
}
