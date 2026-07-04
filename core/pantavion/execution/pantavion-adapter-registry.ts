// core/pantavion/execution/pantavion-adapter-registry.ts

import type {
  PantavionExecutionAdapter,
  PantavionExecutionTask,
  PantavionExecutionKind,
} from "./pantavion-execution-bus";

export type PantavionAdapterCategory =
  | "internal"
  | "discovery"
  | "simulation"
  | "voice"
  | "billing"
  | "workflow"
  | "provider_handoff";

export type PantavionAdapterHealth =
  | "healthy"
  | "degraded"
  | "disabled";

export type PantavionAdapterRecord = {
  key: string;
  label: string;
  version: string;
  category: PantavionAdapterCategory;
  health: PantavionAdapterHealth;
  priority: number;
  executionKinds: PantavionExecutionKind[];
  adapter: PantavionExecutionAdapter;
};

export type PantavionAdapterRegistryOptions = {
  adapters?: PantavionAdapterRecord[];
};

export class PantavionAdapterRegistry {
  private readonly adapters: Map<string, PantavionAdapterRecord>;

  constructor(options: PantavionAdapterRegistryOptions = {}) {
    this.adapters = new Map<string, PantavionAdapterRecord>();

    for (const record of options.adapters ?? []) {
      this.register(record);
    }
  }

  register(record: PantavionAdapterRecord) {
    this.adapters.set(record.key, record);
  }

  unregister(key: string) {
    this.adapters.delete(key);
  }

  get(key: string): PantavionAdapterRecord | null {
    return this.adapters.get(key) ?? null;
  }

  list(): PantavionAdapterRecord[] {
    return Array.from(this.adapters.values()).sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.key.localeCompare(b.key);
    });
  }

  listByCategory(category: PantavionAdapterCategory): PantavionAdapterRecord[] {
    return this.list().filter((item) => item.category === category);
  }

  resolveForTask(task: PantavionExecutionTask): PantavionAdapterRecord | null {
    if (task.preferredAdapterKey) {
      const preferred = this.get(task.preferredAdapterKey);
      if (
        preferred &&
        preferred.health !== "disabled" &&
        preferred.executionKinds.includes(task.kind) &&
        preferred.adapter.supports(task)
      ) {
        return preferred;
      }
    }

    const candidates = this.list().filter((record) => {
      return (
        record.health !== "disabled" &&
        record.executionKinds.includes(task.kind) &&
        record.adapter.supports(task)
      );
    });

    return candidates[0] ?? null;
  }

  getSummary() {
    const all = this.list();

    return {
      total: all.length,
      healthy: all.filter((item) => item.health === "healthy").length,
      degraded: all.filter((item) => item.health === "degraded").length,
      disabled: all.filter((item) => item.health === "disabled").length,
      byCategory: {
        internal: all.filter((item) => item.category === "internal").length,
        discovery: all.filter((item) => item.category === "discovery").length,
        simulation: all.filter((item) => item.category === "simulation").length,
        voice: all.filter((item) => item.category === "voice").length,
        billing: all.filter((item) => item.category === "billing").length,
        workflow: all.filter((item) => item.category === "workflow").length,
        provider_handoff: all.filter((item) => item.category === "provider_handoff").length,
      },
    };
  }
}

export function createPantavionAdapterRegistry(
  options: PantavionAdapterRegistryOptions = {}
) {
  return new PantavionAdapterRegistry(options);
}

export const PANTAVION_INTERNAL_ADAPTER_RECORD: PantavionAdapterRecord = {
  key: "pantavion_internal_summary",
  label: "Pantavion Internal Summary Adapter",
  version: "1.0.0",
  category: "internal",
  health: "healthy",
  priority: 100,
  executionKinds: [
    "internal",
    "workflow",
    "simulation",
    "discovery",
    "voice",
    "billing",
    "provider_handoff",
  ],
  adapter: {
    key: "pantavion_internal_summary",
    label: "Pantavion Internal Summary Adapter",
    version: "1.0.0",
    kinds: [
      "internal",
      "workflow",
      "simulation",
      "discovery",
      "voice",
      "billing",
      "provider_handoff",
    ],
    supports() {
      return true;
    },
    async execute(context) {
      return {
        status: "succeeded",
        output: {
          kind: "json",
          title: "Pantavion internal adapter result",
          summary:
            "Pantavion returned a registry-level internal adapter result.",
          payload: {
            taskId: context.task.id,
            kind: context.task.kind,
            intent: context.task.intent,
            workspace: context.task.workspace,
          },
        },
        warnings: [
          "Internal adapter registry fallback used.",
        ],
        errors: [],
        memoryWrites: [],
      };
    },
  },
};

export function createPantavionDefaultAdapterRegistry() {
  return createPantavionAdapterRegistry({
    adapters: [PANTAVION_INTERNAL_ADAPTER_RECORD],
  });
}
