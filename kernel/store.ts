import type { KernelActor, KernelState } from "./types";
import { createKernelId, nowIso } from "./types";

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const DEFAULT_ACTOR: KernelActor = {
  id: "system",
  type: "system",
  name: "Pantavion Kernel",
  permissions: ["kernel:full"],
};

export const createInitialKernelState = (actorPatch?: Partial<KernelActor>): KernelState => {
  const now = nowIso();

  return {
    session: {
      id: createKernelId("session"),
      createdAt: now,
      updatedAt: now,
      mode: "active",
    },
    actor: {
      ...DEFAULT_ACTOR,
      ...actorPatch,
      permissions: actorPatch?.permissions ?? DEFAULT_ACTOR.permissions,
    },
    context: {
      sessionId: createKernelId("ctx"),
      locale: "el-CY",
      timezone: "Europe/Nicosia",
      tags: ["pantavion", "kernel"],
    },
    intake: [],
    inputs: [],
    memory: {
      entries: [],
      indexKeywords: [],
      lastUpdated: now,
    },
    continuity: {
      activeGoals: [],
      lockedBaselines: [
        "Pantavion Kernel = canonical governed intelligence core",
        "Kernel-first doctrine",
        "Compact full-file architecture doctrine",
        "Multimodal, governed, anti-fragile evolution doctrine",
      ],
      openThreads: [],
      preferences: [
        "full files only",
        "terminal-ready commands only",
        "compact architecture",
        "kernel first",
      ],
    },
    signals: [],
    priorities: {
      score: 0,
      band: "BACKGROUND",
      ring: "archived",
      topSignalIds: [],
      updatedAt: now,
    },
    plans: [],
    tasks: [],
    executions: [],
    capabilities: {
      enabled: [
        "kernel.analyze",
        "kernel.complete",
        "kernel.intake",
        "kernel.run",
        "kernel.state",
      ],
      recommended: [],
    },
    policies: {
      safeMode: true,
      truthFloor: "uncertain",
      privacyMode: "balanced",
      requireApprovalForCommit: true,
    },
    audit: [],
    health: {
      status: "healthy",
      lastUpdated: now,
      counters: {
        intakes: 0,
        memories: 0,
        signals: 0,
        plans: 0,
        executions: 0,
      },
    },
    outputs: [],
  };
};

export class KernelStore {
  private state: KernelState;

  constructor(initialState?: KernelState) {
    this.state = cloneJson(initialState ?? createInitialKernelState());
  }

  snapshot(): KernelState {
    return cloneJson(this.state);
  }

  replace(nextState: KernelState): KernelState {
    this.state = cloneJson(nextState);
    return this.snapshot();
  }

  mutate(mutator: (draft: KernelState) => void): KernelState {
    const draft = cloneJson(this.state);
    mutator(draft);

    draft.session.updatedAt = nowIso();
    draft.memory.lastUpdated = nowIso();
    draft.health.lastUpdated = nowIso();
    draft.health.counters = {
      intakes: draft.intake.length,
      memories: draft.memory.entries.length,
      signals: draft.signals.length,
      plans: draft.plans.length,
      executions: draft.executions.length,
    };

    this.state = draft;
    return this.snapshot();
  }
}

export const createKernelStore = (initialState?: KernelState): KernelStore =>
  new KernelStore(initialState);

/* PANTAVION_LEGACY_STORE_COMPAT */
const LEGACY_KERNEL_STATE_KEY = "pantavion.kernel.state";

const isBrowser = (): boolean => typeof window !== "undefined";

const readLegacyKernelStateRaw = (): string | null => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(LEGACY_KERNEL_STATE_KEY);
  } catch {
    return null;
  }
};

const writeLegacyKernelStateRaw = (value: unknown): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(LEGACY_KERNEL_STATE_KEY, JSON.stringify(value));
  } catch {}
};

const createLegacyKernelFallback = (): KernelState => createInitialKernelState();

export const loadKernelState = (): any => {
  const fallback = createLegacyKernelFallback();
  const raw = readLegacyKernelStateRaw();

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const saveKernelState = (state: any): any => {
  writeLegacyKernelStateRaw(state);
  return state;
};

export const resetKernelState = (): any => {
  const next = createLegacyKernelFallback();
  writeLegacyKernelStateRaw(next);
  return next;
};
