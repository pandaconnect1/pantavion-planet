const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/access/pantavion-universal-entry.ts",
  "components/pantavion/PantavionUniversalEntryClient.tsx",
  "app/pantavion/entry/page.tsx",
  "app/api/pantavion/entry/route.ts",
  "scripts/pantavion-universal-entry-gate.cjs",
  "docs/continuity/pantavion-universal-entry.md",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) read(file);

const core = read("core/access/pantavion-universal-entry.ts");
const route = read("app/api/pantavion/entry/route.ts");
const client = read("components/pantavion/PantavionUniversalEntryClient.tsx");
const packageText = read("package.json");

const requiredCoreMarkers = [
  "PANTAVION_UNIVERSAL_ENTRY_ID",
  "PANTAVION_ENTRY_CAPABILITIES",
  "assessPantavionUniversalEntry",
  "social_network_gateway",
  "messaging_gateway",
  "dating_gateway",
  "payments_stripe_gateway",
  "vip_gateway",
  "saved_chat_gateway",
  "auto_category_gateway",
  "No scraping",
  "requiresFounderApproval",
  "requiresPolicyGate"
];

for (const marker of requiredCoreMarkers) {
  if (!core.includes(marker)) failures.push("Universal entry core missing marker: " + marker);
}

if (!route.includes("/api/pantavion/entry")) {
  failures.push("Entry route must expose /api/pantavion/entry.");
}

if (!route.includes("saved-chats.jsonl")) {
  failures.push("Entry route must include local saved-chat foundation.");
}

if (!client.includes("Open Pantavion Entry")) {
  failures.push("Entry client must expose open entry action.");
}

if (core.includes("password bypass") || core.includes("2FA bypass") || core.includes("spyware")) {
  failures.push("Entry gateway must not contain unsafe bypass/spyware language.");
}

if (core.includes("scrape other platforms automatically")) {
  failures.push("Entry gateway must not allow unauthorized scraping.");
}

let packageJson = null;

try {
  packageJson = JSON.parse(packageText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (packageJson && packageJson.scripts) {
  if (packageJson.scripts["audit:entry"] !== "node scripts/pantavion-universal-entry-gate.cjs") {
    failures.push("package.json must include audit:entry script.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION UNIVERSAL ENTRY GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION UNIVERSAL ENTRY GATE: PASSED");
  console.log("- universal entry core present");
  console.log("- entry route present");
  console.log("- entry UI present");
  console.log("- chat/search/voice/social/messaging/dating/payments/VIP categories present");
  console.log("- legal/safety boundary present");
  console.log("- package script present");
}
