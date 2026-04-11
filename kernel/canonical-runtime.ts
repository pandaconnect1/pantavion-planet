import * as CanonicalAudit from "./canonical-audit";
import * as CanonicalStore from "./canonical-store";
import * as CanonicalMemory from "./canonical-memory";

export type CanonicalAuditModule = typeof CanonicalAudit;
export type CanonicalStoreModule = typeof CanonicalStore;
export type CanonicalMemoryModule = typeof CanonicalMemory;

export interface CanonicalKernelRuntimeHealth {
  ok: true;
  runtime: "canonical";
  version: "patch-8";
  modules: {
    audit: true;
    store: true;
    memory: true;
  };
}

export interface CanonicalKernelRuntime {
  audit: CanonicalAuditModule;
  store: CanonicalStoreModule;
  memory: CanonicalMemoryModule;
  health: () => CanonicalKernelRuntimeHealth;
}

export function createCanonicalKernelRuntime(): CanonicalKernelRuntime {
  return {
    audit: CanonicalAudit,
    store: CanonicalStore,
    memory: CanonicalMemory,
    health: () => ({
      ok: true,
      runtime: "canonical",
      version: "patch-8",
      modules: {
        audit: true,
        store: true,
        memory: true,
      },
    }),
  };
}

let runtimeSingleton: CanonicalKernelRuntime | null = null;

export function getCanonicalKernelRuntime(): CanonicalKernelRuntime {
  if (!runtimeSingleton) {
    runtimeSingleton = createCanonicalKernelRuntime();
  }

  return runtimeSingleton;
}

export const canonicalKernelRuntime = getCanonicalKernelRuntime();
