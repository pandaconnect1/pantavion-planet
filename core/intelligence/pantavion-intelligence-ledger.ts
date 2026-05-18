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

