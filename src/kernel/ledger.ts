import { promises as fs } from "node:fs";
import path from "node:path";
import {
  KernelLedgerEvent,
  KernelMemoryItem,
  KernelPlan,
  KernelRegistryItem,
  KernelRun,
  KernelState,
} from "./contracts";

const LEDGER_DIR = path.join(process.cwd(), ".pantavion");
const LEDGER_FILE = path.join(LEDGER_DIR, "kernel-ledger.jsonl");

async function ensureLedger(): Promise<void> {
  await fs.mkdir(LEDGER_DIR, { recursive: true });
  try {
    await fs.access(LEDGER_FILE);
  } catch {
    await fs.writeFile(LEDGER_FILE, "", "utf8");
  }
}

export async function getLedgerFilePath(): Promise<string> {
  await ensureLedger();
  return LEDGER_FILE;
}

export async function appendLedgerEvents(
  events: KernelLedgerEvent[],
): Promise<void> {
  if (!events.length) return;
  await ensureLedger();
  const lines = events.map((event) => JSON.stringify(event)).join("\n") + "\n";
  await fs.appendFile(LEDGER_FILE, lines, "utf8");
}

export async function readLedgerEvents(): Promise<KernelLedgerEvent[]> {
  await ensureLedger();
  const raw = await fs.readFile(LEDGER_FILE, "utf8");
  if (!raw.trim()) return [];

  const events: KernelLedgerEvent[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as KernelLedgerEvent);
    } catch {
      // ignore malformed lines to keep ledger resilient
    }
  }
  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function materializeKernelState(
  events: KernelLedgerEvent[],
): KernelState {
  const state: KernelState = {
    memory: {},
    registry: {},
    plans: [],
    runs: [],
    eventCount: events.length,
    lastUpdatedAt: events.length ? events[events.length - 1].createdAt : null,
  };

  for (const event of events) {
    switch (event.type) {
      case "memory.upserted": {
        const payload = event.payload as KernelMemoryItem;
        state.memory[payload.id] = payload;
        break;
      }
      case "registry.upserted": {
        const payload = event.payload as KernelRegistryItem;
        state.registry[payload.id] = payload;
        break;
      }
      case "plan.recorded": {
        const payload = event.payload as KernelPlan;
        state.plans.push(payload);
        break;
      }
      case "run.recorded": {
        const payload = event.payload as KernelRun;
        state.runs.push(payload);
        break;
      }
    }
  }

  state.plans.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  state.runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return state;
}

export async function readKernelState(): Promise<KernelState> {
  const events = await readLedgerEvents();
  return materializeKernelState(events);
}
