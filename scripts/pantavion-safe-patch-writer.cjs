const fs = require("fs");
const path = require("path");

const root = process.cwd();

const selectedSlicePath = path.join(root, ".pantavion", "agent-runtime", "selected-implementation-slice.json");
const receiptDir = path.join(root, "data", "pantavion-safe-patches");
const receiptPath = path.join(receiptDir, "last-safe-patch-receipt.json");

const allowedWriteRoots = [
  "core/capabilities/",
  "app/api/pantavion/capabilities/",
  "scripts/pantavion-capability-registry-gate.cjs",
  "docs/continuity/",
  "data/pantavion-safe-patches/",
  "package.json"
];

function normalize(relativePath) {
  return String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function fullPath(relativePath) {
  return path.join(root, normalize(relativePath));
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function assertAllowedWrite(relativePath) {
  const normalized = normalize(relativePath);

  const allowed = allowedWriteRoots.some((prefix) => {
    if (prefix.endsWith("/")) return normalized.startsWith(prefix);
    return normalized === prefix;
  });

  if (!allowed) {
    throw new Error(`Blocked unsafe write target: ${normalized}`);
  }
}

function writeText(relativePath, value) {
  assertAllowedWrite(relativePath);

  const target = fullPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");

  return normalize(relativePath);
}

function patchPackageScript(name, command) {
  const packagePath = fullPath("package.json");
  const pkg = readJsonFile(packagePath, {});

  pkg.scripts = pkg.scripts || {};
  pkg.scripts[name] = command;

  writeText("package.json", JSON.stringify(pkg, null, 2) + "\n");
}

function isSafeSlice(slice) {
  return (
    slice &&
    slice.approvalRequired !== true &&
    (slice.riskZone === "Z1" || slice.riskZone === "Z2")
  );
}

function fileExists(relativePath) {
  return fs.existsSync(fullPath(relativePath));
}

function allTargetsExist(slice) {
  const targets = Array.isArray(slice?.targetFiles) ? slice.targetFiles : [];
  if (targets.length === 0) return false;
  return targets.every((target) => fileExists(target));
}

const selectedSlice = readJsonFile(selectedSlicePath, null);

const fallbackSlice = {
  id: "safe_patch_capability_registry_foundation",
  workOrderId: "pantavion_safe_internal_capability_registry",
  title: "Pantavion Capability Registry Foundation",
  priority: "P0",
  riskZone: "Z2",
  approvalRequired: false,
  implementationMode: "safe_internal_patch_allowed",
  targetFiles: [
    "core/capabilities/pantavion-capability-registry.ts",
    "app/api/pantavion/capabilities/route.ts",
    "scripts/pantavion-capability-registry-gate.cjs"
  ],
  requiredChecks: [
    "npm run audit:capability-registry",
    "npx tsc --noEmit --pretty false",
    "npm run build"
  ],
  nextAction:
    "Create real capability registry route so Pantavion exposes capabilities with status, risk, cost and gates.",
  truthRule:
    "Every capability must show truthful status and cannot claim production readiness without provider/auth/database/policy gates."
};

const activeSlice =
  isSafeSlice(selectedSlice) && !allTargetsExist(selectedSlice)
    ? selectedSlice
    : fallbackSlice;

if (!isSafeSlice(activeSlice)) {
  throw new Error("Selected slice is not safe for automatic patch writing.");
}

const capabilityRegistry = `export type PantavionCapabilityRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionCapabilityStatus =
  | "live_internal"
  | "live_foundation"
  | "requires_provider_adapter"
  | "requires_database"
  | "requires_auth"
  | "requires_policy_gate"
  | "requires_founder_approval"
  | "blocked";

export type PantavionCapabilityRecord = {
  id: string;
  title: string;
  domain:
    | "kernel"
    | "chat"
    | "pulse"
    | "contacts"
    | "people"
    | "files"
    | "voice"
    | "search"
    | "billing"
    | "sos"
    | "dwg"
    | "ops";
  status: PantavionCapabilityStatus;
  riskZone: PantavionCapabilityRiskZone;
  visibleToUser: boolean;
  productionReady: boolean;
  requiredBeforeScale: string[];
  routeTargets: string[];
};

export const PANTAVION_CAPABILITY_REGISTRY_ID =
  "pantavion_capability_registry_v1";

export const PANTAVION_CAPABILITIES: PantavionCapabilityRecord[] = [
  {
    id: "execution_kernel",
    title: "Execution Kernel",
    domain: "kernel",
    status: "live_internal",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["provider adapters", "project memory", "audit dashboard"],
    routeTargets: ["/api/pantavion/execute"]
  },
  {
    id: "live_chat",
    title: "Live Chat Foundation",
    domain: "chat",
    status: "live_foundation",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["auth", "database", "retention policy", "privacy controls"],
    routeTargets: ["/pantavion/chat", "/api/pantavion/chat"]
  },
  {
    id: "pulse_feed",
    title: "Pulse Feed Foundation",
    domain: "pulse",
    status: "live_foundation",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["database", "profiles", "moderation", "report/block"],
    routeTargets: ["/pantavion/pulse", "/api/pantavion/pulse"]
  },
  {
    id: "contacts_import",
    title: "Contacts Import Foundation",
    domain: "contacts",
    status: "requires_database",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["auth", "consent", "encrypted storage", "delete/export"],
    routeTargets: ["/pantavion/contacts", "/api/pantavion/contacts"]
  },
  {
    id: "people_graph",
    title: "People / Social Graph",
    domain: "people",
    status: "requires_auth",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["profiles", "privacy", "follow/connect", "block/report", "moderation"],
    routeTargets: ["/pantavion/people"]
  },
  {
    id: "billing_vip",
    title: "Billing / VIP",
    domain: "billing",
    status: "requires_founder_approval",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["Stripe/provider config", "tax/legal", "entitlements", "receipts"],
    routeTargets: ["/api/pantavion/billing/status", "/api/pantavion/vip/status"]
  },
  {
    id: "sos_rescue",
    title: "SOS / Rescue",
    domain: "sos",
    status: "requires_policy_gate",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["consent", "emergency circle", "jurisdiction policy", "audit", "disclaimers"],
    routeTargets: ["/api/pantavion/sos/status"]
  },
  {
    id: "dwg_source_truth",
    title: "DWG Source Truth",
    domain: "dwg",
    status: "requires_founder_approval",
    riskZone: "Z3",
    visibleToUser: false,
    productionReady: false,
    requiredBeforeScale: ["licensed adapter", "private vault", "read-only viewer", "no source transformation"],
    routeTargets: ["/professional/infrastructure/water/b", "/professional/infrastructure/water/c"]
  }
];

export function getPantavionCapabilityRegistry() {
  return {
    ok: true,
    id: PANTAVION_CAPABILITY_REGISTRY_ID,
    generatedBy: "pantavion_safe_patch_writer",
    status: "live_capability_registry_foundation",
    capabilities: PANTAVION_CAPABILITIES,
    truthRule:
      "Pantavion exposes truthful capability status. visible does not mean production-complete."
  };
}

export function summarizePantavionCapabilities() {
  return {
    total: PANTAVION_CAPABILITIES.length,
    visible: PANTAVION_CAPABILITIES.filter((item) => item.visibleToUser).length,
    productionReady: PANTAVION_CAPABILITIES.filter((item) => item.productionReady).length,
    approvalRequired: PANTAVION_CAPABILITIES.filter(
      (item) => item.riskZone === "Z3" || item.riskZone === "Z4"
    ).length,
    liveFoundations: PANTAVION_CAPABILITIES.filter(
      (item) => item.status === "live_foundation" || item.status === "live_internal"
    ).length
  };
}
`;

const capabilityRoute = `import { NextResponse } from "next/server";
import {
  getPantavionCapabilityRegistry,
  summarizePantavionCapabilities
} from "../../../../core/capabilities/pantavion-capability-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/capabilities",
    summary: summarizePantavionCapabilities(),
    registry: getPantavionCapabilityRegistry()
  });
}

export async function POST(request: Request) {
  let body: { query?: string } = {};

  try {
    body = (await request.json()) as { query?: string };
  } catch {
    body = {};
  }

  const query = String(body.query || "").toLowerCase();

  const registry = getPantavionCapabilityRegistry();
  const matches = registry.capabilities.filter((capability) => {
    const haystack = [
      capability.id,
      capability.title,
      capability.domain,
      capability.status,
      capability.routeTargets.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return query ? haystack.includes(query) : true;
  });

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/capabilities",
    query,
    count: matches.length,
    matches
  });
}
`;

const capabilityGate = `const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "core/capabilities/pantavion-capability-registry.ts",
  "app/api/pantavion/capabilities/route.ts",
  "scripts/pantavion-capability-registry-gate.cjs",
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

const core = read("core/capabilities/pantavion-capability-registry.ts");
const route = read("app/api/pantavion/capabilities/route.ts");
const pkgText = read("package.json");

const markers = [
  "PANTAVION_CAPABILITY_REGISTRY_ID",
  "execution_kernel",
  "live_chat",
  "pulse_feed",
  "contacts_import",
  "people_graph",
  "dwg_source_truth",
  "summarizePantavionCapabilities",
  "visible does not mean production-complete"
];

for (const marker of markers) {
  if (!core.includes(marker)) {
    failures.push("Capability registry missing marker: " + marker);
  }
}

if (!route.includes("/api/pantavion/capabilities")) {
  failures.push("Capability route marker missing.");
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["audit:capability-registry"] !== "node scripts/pantavion-capability-registry-gate.cjs") {
    failures.push("package.json missing audit:capability-registry.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION CAPABILITY REGISTRY GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION CAPABILITY REGISTRY GATE: PASSED");
  console.log("- capability registry present");
  console.log("- capability route present");
  console.log("- truthful statuses present");
  console.log("- package script present");
}
`;

const docs = `# Pantavion Safe Patch Writer

Patch 12 adds the first controlled source-code writer.

## What happened

The Pantavion Safe Patch Writer selected a safe Z1/Z2 implementation slice and wrote scoped source files.

## Rules

- It does not commit.
- It does not push.
- It does not deploy.
- It does not touch secrets.
- It does not touch billing/auth/user-data/DWG/SOS production areas without founder approval.
- It writes only allowlisted source paths.

## First generated implementation

- Capability registry
- Capabilities API route
- Capability registry audit gate
- Safe patch receipt

## Next

After this, Pantavion can keep producing safe implementation slices through:

1. agent:supervisor
2. agent:safe-patch
3. audits/build/typecheck
4. founder scoped commit approval
`;

const wrote = [];

wrote.push(writeText("core/capabilities/pantavion-capability-registry.ts", capabilityRegistry));
wrote.push(writeText("app/api/pantavion/capabilities/route.ts", capabilityRoute));
wrote.push(writeText("scripts/pantavion-capability-registry-gate.cjs", capabilityGate));
wrote.push(writeText("docs/continuity/pantavion-safe-patch-writer.md", docs));

patchPackageScript("audit:capability-registry", "node scripts/pantavion-capability-registry-gate.cjs");

const receipt = {
  ok: true,
  id: "pantavion_safe_patch_receipt_v1",
  generatedAt: new Date().toISOString(),
  writer: "scripts/pantavion-safe-patch-writer.cjs",
  selectedSlice,
  activeSlice,
  wrote,
  checksToRun: [
    "npm run audit:capability-registry",
    "npm run audit:safe-patch",
    "npx tsc --noEmit --pretty false",
    "npm run build"
  ],
  safety: {
    mode: "scoped_source_writer",
    allowedRiskZones: ["Z1", "Z2"],
    approvalRequiredBlocked: true,
    productionDeployBlocked: true,
    secretsBlocked: true,
    blanketAddBlocked: true
  }
};

fs.mkdirSync(receiptDir, { recursive: true });
writeText("data/pantavion-safe-patches/last-safe-patch-receipt.json", JSON.stringify(receipt, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  message: "Pantavion Safe Patch Writer wrote scoped source files.",
  activeSlice: {
    id: activeSlice.id,
    title: activeSlice.title,
    priority: activeSlice.priority,
    riskZone: activeSlice.riskZone,
    approvalRequired: activeSlice.approvalRequired
  },
  wrote,
  receipt: "data/pantavion-safe-patches/last-safe-patch-receipt.json"
}, null, 2));


