import type {
  KernelState,
  ModuleEntry,
  CapabilityEntry,
  SignalEntry,
} from "./types";

export const KERNEL_STORAGE_KEY = "pantavion.kernel.v2";

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function baseModules(t: string): ModuleEntry[] {
  return [
    { key: "memory", title: "Memory", state: "active", health: "green", runs: 1, changes: 0, errors: 0, lastRunAt: t },
    { key: "planner", title: "Planner", state: "active", health: "green", runs: 1, changes: 0, errors: 0, lastRunAt: t },
    { key: "runner", title: "Runner", state: "idle", health: "yellow", runs: 0, changes: 0, errors: 0 },
    { key: "registry", title: "Capability Registry", state: "active", health: "green", runs: 1, changes: 0, errors: 0, lastRunAt: t },
    { key: "intelligence", title: "Intelligence", state: "active", health: "yellow", runs: 1, changes: 0, errors: 0, lastRunAt: t },
    { key: "radar", title: "Tech Radar", state: "idle", health: "yellow", runs: 0, changes: 0, errors: 0 },
    { key: "evolution", title: "Evolution", state: "idle", health: "yellow", runs: 0, changes: 0, errors: 0 },
    { key: "audit", title: "Audit", state: "active", health: "green", runs: 1, changes: 0, errors: 0, lastRunAt: t },
  ];
}

function baseCapabilities(t: string): CapabilityEntry[] {
  return [
    { id: id("cap"), key: "kernel.memory", title: "Persistent Memory", owner: "kernel", maturity: "prototype", status: "healthy", createdAt: t },
    { id: id("cap"), key: "kernel.planner", title: "Planner Core", owner: "kernel", maturity: "prototype", status: "healthy", createdAt: t },
    { id: id("cap"), key: "kernel.runner", title: "Deterministic Runner", owner: "kernel", maturity: "prototype", status: "healthy", createdAt: t },
    { id: id("cap"), key: "kernel.registry", title: "Capability Registry", owner: "kernel", maturity: "seed", status: "building", createdAt: t },
    { id: id("cap"), key: "kernel.intelligence", title: "Intelligence Registry", owner: "kernel", maturity: "seed", status: "building", createdAt: t },
    { id: id("cap"), key: "kernel.evolution", title: "Evolution Engine", owner: "kernel", maturity: "seed", status: "building", createdAt: t },
  ];
}

function baseSignals(t: string): SignalEntry[] {
  return [
    {
      id: id("sig"),
      name: "Governed memory classes",
      category: "memory",
      description: "Directive, decision, context, fact, signal.",
      impact: 5,
      confidence: 5,
      urgency: 4,
      createdAt: t,
    },
    {
      id: id("sig"),
      name: "Deterministic planner to runner flow",
      category: "runner",
      description: "Planner items should become queued tasks and then executed cleanly.",
      impact: 5,
      confidence: 4,
      urgency: 5,
      createdAt: t,
    },
    {
      id: id("sig"),
      name: "Radar scoring before adoption",
      category: "radar",
      description: "All new ideas should pass through scoring before entering core direction.",
      impact: 4,
      confidence: 4,
      urgency: 4,
      createdAt: t,
    },
  ];
}

export function createKernelState(): KernelState {
  const t = now();

  return {
    version: 2,
    updatedAt: t,
    memory: [
      {
        id: id("mem"),
        text: "Pantavion is Kernel App / Builder Brain first.",
        tags: ["direction", "kernel", "builder-brain"],
        kind: "directive",
        createdAt: t,
      },
      {
        id: id("mem"),
        text: "Core target: persistent memory, planner, registry, runner, audit, intelligence, radar, evolution.",
        tags: ["core", "target"],
        kind: "directive",
        createdAt: t,
      },
    ],
    planner: [
      {
        id: id("plan"),
        title: "Build Kernel Spine",
        detail: "Lock stable governed kernel modules before large Pantavion surfaces.",
        priority: "critical",
        domain: "kernel.spine",
        status: "planned",
        createdAt: t,
      },
    ],
    tasks: [],
    signals: baseSignals(t),
    radar: [],
    audit: [
      {
        id: id("audit"),
        action: "kernel.bootstrap",
        entity: "kernel",
        message: "Pantavion Kernel v2 initialized.",
        createdAt: t,
      },
    ],
    modules: baseModules(t),
    capabilities: baseCapabilities(t),
  };
}

export function loadKernelState(): KernelState {
  if (typeof window === "undefined") return createKernelState();

  try {
    const raw = window.localStorage.getItem(KERNEL_STORAGE_KEY);
    if (!raw) return createKernelState();
    return JSON.parse(raw) as KernelState;
  } catch {
    return createKernelState();
  }
}

export function saveKernelState(state: KernelState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KERNEL_STORAGE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: now(),
    })
  );
}

export function resetKernelState() {
  return createKernelState();
}

export function makeId(prefix: string) {
  return id(prefix);
}

export function nowIso() {
  return now();
}
