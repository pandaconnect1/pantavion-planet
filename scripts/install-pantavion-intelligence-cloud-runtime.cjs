// PASTE THIS FILE ONLY INTO:
// scripts/install-pantavion-intelligence-cloud-runtime.cjs

const fs = require("fs");
const path = require("path");

const root = process.cwd();

function assertRepoRoot() {
  const packagePath = path.join(root, "package.json");
  const appPath = path.join(root, "app");
  const fabricPath = path.join(root, "core", "intelligence", "pantavion-sovereign-intelligence-fabric.ts");

  if (!fs.existsSync(packagePath) || !fs.existsSync(appPath)) {
    console.error("PANTAVION INTELLIGENCE CLOUD RUNTIME INSTALL: FAILED");
    console.error("Run this from C:\\Users\\gnkkm\\pantavion-planet");
    process.exit(1);
  }

  if (!fs.existsSync(fabricPath)) {
    console.error("PANTAVION INTELLIGENCE CLOUD RUNTIME INSTALL: FAILED");
    console.error("Missing sovereign intelligence fabric. Install/commit fabric batch first.");
    process.exit(1);
  }
}

function writeFile(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content.trimStart() + "\n", "utf8");
  console.log("WROTE " + relativePath);
}

function updatePackageJson() {
  const packagePath = path.join(root, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts["audit:intelligence:cloud"] =
    "node scripts/pantavion-intelligence-cloud-runtime-gate.cjs";

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
  console.log("UPDATED package.json audit:intelligence:cloud");
}

function updateVercelJson() {
  const vercelPath = path.join(root, "vercel.json");
  let vercelJson = {};

  if (fs.existsSync(vercelPath)) {
    try {
      vercelJson = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
    } catch (error) {
      console.error("PANTAVION INTELLIGENCE CLOUD RUNTIME INSTALL: FAILED");
      console.error("vercel.json exists but is not valid JSON.");
      console.error(error && error.message ? error.message : error);
      process.exit(1);
    }
  }

  const cronPath = "/api/pantavion/intelligence/cron";
  const cronSchedule = "0 * * * *";

  const crons = Array.isArray(vercelJson.crons) ? vercelJson.crons : [];
  const filtered = crons.filter((cron) => cron && cron.path !== cronPath);

  filtered.push({
    path: cronPath,
    schedule: cronSchedule,
  });

  vercelJson.crons = filtered;

  fs.writeFileSync(vercelPath, JSON.stringify(vercelJson, null, 2) + "\n", "utf8");
  console.log("UPDATED vercel.json cron " + cronPath + " " + cronSchedule);
}

assertRepoRoot();

const ledgerTs = String.raw`
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  getPantavionBuildQueue,
  getPantavionOpportunities,
  runPantavionIntelligenceTick,
} from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export type PantavionLedgerStorageMode =
  | "external_endpoint_durable"
  | "local_development_file"
  | "runtime_memory_non_durable";

export interface PantavionIntelligenceLedgerEvent {
  id: string;
  createdAt: string;
  source: "manual" | "vercel_cron" | "external_scheduler" | "local_test";
  route: string;
  storageMode: PantavionLedgerStorageMode;
  status: "recorded" | "recorded_non_durable" | "external_failed";
  summary: string;
  opportunityCount: number;
  buildQueueCount: number;
  cloudRequirements: string[];
  warnings: string[];
}

const memoryKey = "__pantavionIntelligenceLedger";
const maxMemoryEvents = 50;

function getMemoryLedger(): PantavionIntelligenceLedgerEvent[] {
  const globalLedger = globalThis as typeof globalThis & {
    __pantavionIntelligenceLedger?: PantavionIntelligenceLedgerEvent[];
  };

  if (!globalLedger[memoryKey]) {
    globalLedger[memoryKey] = [];
  }

  return globalLedger[memoryKey] || [];
}

function getLocalLedgerPath() {
  return path.join(
    process.cwd(),
    "data",
    "pantavion-intelligence-ledger",
    "ticks.json",
  );
}

function getExternalLedgerEndpoint() {
  return process.env.PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT || "";
}

function getExternalLedgerToken() {
  return process.env.PANTAVION_INTELLIGENCE_LEDGER_TOKEN || "";
}

export function getPantavionCloudCronStatus() {
  const hasCronSecret = Boolean(process.env.CRON_SECRET);
  const hasExternalLedgerEndpoint = Boolean(getExternalLedgerEndpoint());
  const hasExternalLedgerToken = Boolean(getExternalLedgerToken());

  return {
    ok: true,
    route: "/api/pantavion/intelligence/health",
    cronRoute: "/api/pantavion/intelligence/cron",
    cronSchedule: "0 * * * *",
    hasCronSecret,
    hasExternalLedgerEndpoint,
    hasExternalLedgerToken,
    storageTruth: hasExternalLedgerEndpoint
      ? "durable external endpoint configured"
      : "no durable external endpoint configured; local dev uses file, production falls back to runtime memory",
    requirementsToBecomeFull24x365: [
      "Vercel deployment must include vercel.json cron",
      "CRON_SECRET should be configured for protected cron calls",
      "PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT should be configured for durable production ledger",
      "PANTAVION_INTELLIGENCE_LEDGER_TOKEN should be configured if external ledger requires auth",
      "production routes must return OK 200 and markers",
    ],
  };
}

export async function readLocalLedgerEvents(limit = 25): Promise<PantavionIntelligenceLedgerEvent[]> {
  const memoryLedger = getMemoryLedger();

  try {
    const raw = await readFile(getLocalLedgerPath(), "utf8");
    const parsed = JSON.parse(raw) as PantavionIntelligenceLedgerEvent[];

    return parsed.slice(-limit).reverse();
  } catch {
    return memoryLedger.slice(-limit).reverse();
  }
}

async function writeLocalDevelopmentLedger(event: PantavionIntelligenceLedgerEvent) {
  const ledgerPath = getLocalLedgerPath();

  await mkdir(path.dirname(ledgerPath), { recursive: true });

  let current: PantavionIntelligenceLedgerEvent[] = [];

  try {
    current = JSON.parse(await readFile(ledgerPath, "utf8")) as PantavionIntelligenceLedgerEvent[];
  } catch {
    current = [];
  }

  current.push(event);
  current = current.slice(-200);

  await writeFile(ledgerPath, JSON.stringify(current, null, 2) + "\n", "utf8");
  await appendFile(
    path.join(path.dirname(ledgerPath), "ticks.ndjson"),
    JSON.stringify(event) + "\n",
    "utf8",
  );
}

async function writeExternalLedger(event: PantavionIntelligenceLedgerEvent) {
  const endpoint = getExternalLedgerEndpoint();

  if (!endpoint) {
    return {
      ok: false,
      message: "PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT is not configured.",
    };
  }

  const token = getExternalLedgerToken();

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (token) {
    headers.authorization = "Bearer " + token;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "pantavion",
      type: "intelligence_tick_ledger_event",
      event,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: "External ledger returned HTTP " + response.status,
    };
  }

  return {
    ok: true,
    message: "External durable ledger accepted event.",
  };
}

export async function recordPantavionIntelligenceLedgerEvent(
  eventInput: Omit<PantavionIntelligenceLedgerEvent, "storageMode" | "status">,
): Promise<PantavionIntelligenceLedgerEvent> {
  const externalEndpoint = getExternalLedgerEndpoint();
  const isProduction = process.env.NODE_ENV === "production";

  const memoryLedger = getMemoryLedger();

  if (externalEndpoint) {
    const event: PantavionIntelligenceLedgerEvent = {
      ...eventInput,
      storageMode: "external_endpoint_durable",
      status: "recorded",
    };

    const external = await writeExternalLedger(event);

    if (external.ok) {
      memoryLedger.push(event);
      memoryLedger.splice(0, Math.max(0, memoryLedger.length - maxMemoryEvents));
      return event;
    }

    const failedEvent: PantavionIntelligenceLedgerEvent = {
      ...event,
      status: "external_failed",
      warnings: [...event.warnings, external.message],
    };

    memoryLedger.push(failedEvent);
    memoryLedger.splice(0, Math.max(0, memoryLedger.length - maxMemoryEvents));

    return failedEvent;
  }

  if (!isProduction) {
    const event: PantavionIntelligenceLedgerEvent = {
      ...eventInput,
      storageMode: "local_development_file",
      status: "recorded",
      warnings: [
        ...eventInput.warnings,
        "Local development ledger writes to data/pantavion-intelligence-ledger. Production durability still requires external storage.",
      ],
    };

    await writeLocalDevelopmentLedger(event);

    memoryLedger.push(event);
    memoryLedger.splice(0, Math.max(0, memoryLedger.length - maxMemoryEvents));

    return event;
  }

  const event: PantavionIntelligenceLedgerEvent = {
    ...eventInput,
    storageMode: "runtime_memory_non_durable",
    status: "recorded_non_durable",
    warnings: [
      ...eventInput.warnings,
      "Production durable ledger endpoint is not configured. This event is visible in runtime memory only and may be lost across serverless instances.",
    ],
  };

  memoryLedger.push(event);
  memoryLedger.splice(0, Math.max(0, memoryLedger.length - maxMemoryEvents));

  return event;
}

export async function runPantavionCloudCronTick(source: PantavionIntelligenceLedgerEvent["source"]) {
  const tick = runPantavionIntelligenceTick();
  const opportunities = getPantavionOpportunities();
  const buildQueue = getPantavionBuildQueue();
  const status = getPantavionCloudCronStatus();

  const event = await recordPantavionIntelligenceLedgerEvent({
    id: "pantavion_intelligence_ledger_" + Date.now(),
    createdAt: new Date().toISOString(),
    source,
    route: "/api/pantavion/intelligence/cron",
    summary:
      "Cloud cron executed Pantavion intelligence tick and refreshed opportunity/build queue status.",
    opportunityCount: opportunities.length,
    buildQueueCount: buildQueue.length,
    cloudRequirements: status.requirementsToBecomeFull24x365,
    warnings: [
      "Cron execution does not mean autonomous code deployment. Founder approval and audit/build gates remain required.",
      "External scanning must use lawful public, licensed, user-provided, or authorized sources only.",
    ],
  });

  return {
    ok: true,
    route: "/api/pantavion/intelligence/cron",
    cron: {
      schedule: "0 * * * *",
      source,
      executedAt: event.createdAt,
    },
    tick,
    ledgerEvent: event,
    health: status,
  };
}
`;

const cronRoute = String.raw`
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCronRequest() {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return {
      ok: true,
      mode: "unprotected_until_cron_secret_is_configured",
    };
  }

  const authorization = headers().get("authorization") || "";

  return {
    ok: authorization === "Bearer " + secret,
    mode: "cron_secret_required",
  };
}

export async function GET() {
  const auth = isAuthorizedCronRequest();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/cron",
        error: "Unauthorized cron request.",
        mode: auth.mode,
      },
      { status: 401 },
    );
  }

  const result = await runPantavionCloudCronTick("vercel_cron");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
  });
}

export async function POST() {
  const auth = isAuthorizedCronRequest();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/cron",
        error: "Unauthorized cron request.",
        mode: auth.mode,
      },
      { status: 401 },
    );
  }

  const result = await runPantavionCloudCronTick("external_scheduler");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
  });
}
`;

const ledgerRoute = String.raw`
import { NextResponse } from "next/server";
import {
  getPantavionCloudCronStatus,
  readLocalLedgerEvents,
} from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await readLocalLedgerEvents(50);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/ledger",
    health: getPantavionCloudCronStatus(),
    eventCount: events.length,
    events,
  });
}
`;

const healthRoute = String.raw`
import { NextResponse } from "next/server";
import { getPantavionCloudCronStatus } from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPantavionCloudCronStatus());
}
`;

const cloudPage = String.raw`
import Link from "next/link";
import {
  getPantavionCloudCronStatus,
  readLocalLedgerEvents,
} from "@/core/intelligence/pantavion-intelligence-ledger";

export const dynamic = "force-dynamic";

export default async function PantavionIntelligenceCloudPage() {
  const status = getPantavionCloudCronStatus();
  const events = await readLocalLedgerEvents(20);

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#060914", color: "#f8e7b0" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#d6b45c" }}>
          Pantavion Cloud Runtime
        </p>

        <h1 style={{ fontSize: "42px", lineHeight: 1.1, margin: "12px 0" }}>
          24/365 Intelligence Scheduler and Tick Ledger
        </h1>

        <p style={{ maxWidth: "920px", color: "#d7d7df", fontSize: "18px" }}>
          This page verifies the cloud scheduler contract, cron endpoint, ledger mode,
          health route, and intelligence tick runtime. It does not claim autonomous deployment
          without approval, audit, build, push, and production verification.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "28px" }}>
          <Card title="Cron route" value={status.cronRoute} />
          <Card title="Schedule" value={status.cronSchedule} />
          <Card title="Cron secret" value={status.hasCronSecret ? "configured" : "missing"} />
          <Card title="Durable ledger" value={status.hasExternalLedgerEndpoint ? "configured" : "pending"} />
        </div>

        <h2 style={{ marginTop: "40px" }}>Live cloud routes</h2>
        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <RouteLink href="/api/pantavion/intelligence/cron" />
          <RouteLink href="/api/pantavion/intelligence/ledger" />
          <RouteLink href="/api/pantavion/intelligence/health" />
          <RouteLink href="/api/pantavion/intelligence/tick" />
        </div>

        <h2 style={{ marginTop: "40px" }}>Storage truth</h2>
        <article style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ color: "#d7d7df" }}>{status.storageTruth}</p>
          <ul style={{ color: "#aeb3c2" }}>
            {status.requirementsToBecomeFull24x365.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <h2 style={{ marginTop: "40px" }}>Recent tick ledger</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {events.length === 0 ? (
            <article style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <p style={{ color: "#d7d7df" }}>
                No tick events recorded in the visible runtime ledger yet. Open the cron route or wait for the cloud scheduler after deployment.
              </p>
            </article>
          ) : (
            events.map((event) => (
              <article key={event.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
                <h3 style={{ margin: 0, color: "#ffd86b" }}>{event.id}</h3>
                <p style={{ color: "#d7d7df" }}>{event.summary}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Created: {event.createdAt}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Storage: {event.storageMode}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {event.status}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "18px", padding: "20px", background: "rgba(255,255,255,0.05)" }}>
      <div style={{ color: "#aeb3c2", fontSize: "14px" }}>{title}</div>
      <div style={{ fontSize: "20px", color: "#ffd86b", fontWeight: 700, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function RouteLink({ href }: { href: string }) {
  return (
    <Link href={href} style={{ color: "#ffd86b", border: "1px solid rgba(214,180,92,0.28)", borderRadius: "12px", padding: "12px 14px", textDecoration: "none", background: "rgba(255,255,255,0.04)" }}>
      {href}
    </Link>
  );
}
`;

const gateScript = String.raw`
const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/intelligence/pantavion-intelligence-ledger.ts",
  "app/api/pantavion/intelligence/cron/route.ts",
  "app/api/pantavion/intelligence/ledger/route.ts",
  "app/api/pantavion/intelligence/health/route.ts",
  "app/pantavion/intelligence/cloud/page.tsx",
  "scripts/pantavion-intelligence-cloud-runtime-gate.cjs",
  "docs/continuity/pantavion-intelligence-cloud-runtime.md",
  "vercel.json",
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

const ledger = read("core/intelligence/pantavion-intelligence-ledger.ts");
const cronRoute = read("app/api/pantavion/intelligence/cron/route.ts");
const ledgerRoute = read("app/api/pantavion/intelligence/ledger/route.ts");
const healthRoute = read("app/api/pantavion/intelligence/health/route.ts");
const cloudPage = read("app/pantavion/intelligence/cloud/page.tsx");
const packageJsonText = read("package.json");
const vercelJsonText = read("vercel.json");

const requiredMarkers = [
  "runPantavionCloudCronTick",
  "recordPantavionIntelligenceLedgerEvent",
  "getPantavionCloudCronStatus",
  "PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT",
  "CRON_SECRET",
  "runtime_memory_non_durable",
  "external_endpoint_durable",
];

for (const marker of requiredMarkers) {
  if (!ledger.includes(marker)) failures.push("Ledger missing marker: " + marker);
}

if (!cronRoute.includes("runPantavionCloudCronTick")) {
  failures.push("cron route must execute cloud cron tick.");
}

if (!ledgerRoute.includes("readLocalLedgerEvents")) {
  failures.push("ledger route must expose tick ledger.");
}

if (!healthRoute.includes("getPantavionCloudCronStatus")) {
  failures.push("health route must expose cron status.");
}

if (!cloudPage.includes("24/365 Intelligence Scheduler and Tick Ledger")) {
  failures.push("cloud page must expose scheduler and ledger.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (
  packageJson &&
  packageJson.scripts &&
  packageJson.scripts["audit:intelligence:cloud"] !== "node scripts/pantavion-intelligence-cloud-runtime-gate.cjs"
) {
  failures.push("package.json must include audit:intelligence:cloud script.");
}

let vercelJson = null;
try {
  vercelJson = JSON.parse(vercelJsonText);
} catch {
  failures.push("vercel.json is invalid JSON.");
}

if (vercelJson) {
  const crons = Array.isArray(vercelJson.crons) ? vercelJson.crons : [];
  const cron = crons.find((item) => item.path === "/api/pantavion/intelligence/cron");

  if (!cron) {
    failures.push("vercel.json must include cron path /api/pantavion/intelligence/cron.");
  } else if (cron.schedule !== "0 * * * *") {
    failures.push("vercel.json cron schedule must be 0 * * * * for hourly intelligence tick.");
  }
}

if (ledger.includes("git add .") || cronRoute.includes("git add .") || cloudPage.includes("git add .")) {
  failures.push("Cloud runtime files must not contain blanket git add.");
}

if (failures.length > 0) {
  console.error("PANTAVION INTELLIGENCE CLOUD RUNTIME GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION INTELLIGENCE CLOUD RUNTIME GATE: PASSED");
  console.log("- cron route present");
  console.log("- vercel cron configured");
  console.log("- ledger route present");
  console.log("- health route present");
  console.log("- visible cloud page present");
  console.log("- durable external endpoint support present");
  console.log("- local development ledger support present");
  console.log("- production non-durable fallback is explicitly marked, not hidden");
}
`;

const docs = String.raw`
# Pantavion Intelligence Cloud Runtime

This batch adds the first cloud scheduler and tick ledger layer for the Pantavion Sovereign Intelligence Fabric.

## Live Page

- /pantavion/intelligence/cloud

## Live API Routes

- /api/pantavion/intelligence/cron
- /api/pantavion/intelligence/ledger
- /api/pantavion/intelligence/health
- /api/pantavion/intelligence/tick

## Vercel Cron

vercel.json now includes:

- path: /api/pantavion/intelligence/cron
- schedule: 0 * * * *

This means the production deployment can call the Pantavion intelligence cron endpoint hourly.

## Storage Truth

The ledger supports three modes:

1. external_endpoint_durable
   - Real durable production mode.
   - Requires PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT.
   - Optional PANTAVION_INTELLIGENCE_LEDGER_TOKEN.

2. local_development_file
   - Writes to data/pantavion-intelligence-ledger on local machine.
   - Useful for development only.

3. runtime_memory_non_durable
   - Production fallback if no external ledger endpoint is configured.
   - It is explicitly labeled non-durable and must not be claimed as full persistence.

## Required Environment Variables

- CRON_SECRET
- PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT
- PANTAVION_INTELLIGENCE_LEDGER_TOKEN

## Non-Negotiable Rule

Do not call this full autonomous 24/365 intelligence until cron, storage, provider access, queue, monitoring, audit, and production checks are configured and verified.
`;

writeFile("core/intelligence/pantavion-intelligence-ledger.ts", ledgerTs);
writeFile("app/api/pantavion/intelligence/cron/route.ts", cronRoute);
writeFile("app/api/pantavion/intelligence/ledger/route.ts", ledgerRoute);
writeFile("app/api/pantavion/intelligence/health/route.ts", healthRoute);
writeFile("app/pantavion/intelligence/cloud/page.tsx", cloudPage);
writeFile("scripts/pantavion-intelligence-cloud-runtime-gate.cjs", gateScript);
writeFile("docs/continuity/pantavion-intelligence-cloud-runtime.md", docs);

updatePackageJson();
updateVercelJson();

console.log("PANTAVION INTELLIGENCE CLOUD RUNTIME INSTALL: PASSED");