import { promises as fs } from "fs";
import path from "path";
import { KERNEL_CONSTITUTION, KERNEL_NAME } from "./kernel-constitution";
import type { KernelMemoryEntry, KernelRunResult, KernelState } from "./kernel-types";

const DATA_DIR = path.join(process.cwd(), ".pantavion-data");
const STATE_FILE = path.join(DATA_DIR, "kernel-state.json");

function nowIso() {
  return new Date().toISOString();
}

function makeMemory(kind: KernelMemoryEntry["kind"], content: string): KernelMemoryEntry {
  return {
    id: crypto.randomUUID(),
    kind,
    content,
    createdAt: nowIso()
  };
}

function initialState(): KernelState {
  return {
    constitutionVersion: KERNEL_CONSTITUTION.version,
    kernelName: KERNEL_NAME,
    memories: [
      makeMemory("directive", "Pantavion Kernel OS is the governed system-of-record for building and evolving Pantavion."),
      makeMemory("directive", "Core principle: Controlled Sovereign Self-Building."),
      makeMemory("system", "Kernel state initialized.")
    ],
    runs: [],
    lastUpdatedAt: nowIso()
  };
}

async function ensureStateFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STATE_FILE);
  } catch {
    const state = initialState();
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  }
}

export async function readKernelState(): Promise<KernelState> {
  await ensureStateFile();
  const raw = await fs.readFile(STATE_FILE, "utf8");
  return JSON.parse(raw) as KernelState;
}

export async function writeKernelState(state: KernelState): Promise<void> {
  await ensureStateFile();
  const next: KernelState = {
    ...state,
    lastUpdatedAt: nowIso()
  };
  await fs.writeFile(STATE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function appendKernelRun(run: KernelRunResult): Promise<KernelState> {
  const state = await readKernelState();

  const next: KernelState = {
    ...state,
    runs: [run, ...state.runs].slice(0, 100),
    memories: [
      makeMemory("run-log", `Run completed for input: ${run.input}`),
      makeMemory("decision", run.classification.cleanConclusion),
      ...state.memories
    ].slice(0, 300),
    lastUpdatedAt: nowIso()
  };

  await writeKernelState(next);
  return next;
}
