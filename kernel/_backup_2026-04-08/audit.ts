import type { KernelState } from "./types";
import { makeId, nowIso } from "./store";

export function addAuditEntry(
  state: KernelState,
  action: string,
  entity: string,
  message: string
): KernelState {
  return {
    ...state,
    audit: [
      {
        id: makeId("audit"),
        action,
        entity,
        message,
        createdAt: nowIso(),
      },
      ...state.audit,
    ].slice(0, 300),
    modules: state.modules.map((m) =>
      m.key === "audit"
        ? {
            ...m,
            state: "active",
            health: "green",
            changes: m.changes + 1,
            lastRunAt: nowIso(),
          }
        : m
    ),
  };
}
