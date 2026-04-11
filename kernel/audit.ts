import type { AuditEntry, KernelState } from "./types";
import { createKernelId, nowIso } from "./types";

export const createAuditEntry = (
  action: string,
  message: string,
  level: AuditEntry["level"] = "info",
  refs: string[] = [],
  metadata: Record<string, unknown> = {}
): AuditEntry => ({
  id: createKernelId("audit"),
  createdAt: nowIso(),
  level,
  action,
  message,
  refs,
  metadata,
});

export const appendAuditEntries = (
  state: KernelState,
  entries: AuditEntry[]
): AuditEntry[] => {
  state.audit.push(...entries);
  return state.audit;
};

export const buildAuditSummary = (state: KernelState, limit: number = 12): string => {
  const recent = state.audit.slice(-limit);
  if (recent.length === 0) return "No audit activity recorded yet.";

  return recent
    .map((entry) => {
      return "[" + entry.level.toUpperCase() + "] " + entry.action + " — " + entry.message;
    })
    .join("\n");
};

/* PANTAVION_LEGACY_AUDIT_COMPAT */
const cloneAuditCompat = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const addAuditEntry = (state: any, entry: any): any => {
  const next = cloneAuditCompat(state ?? {});
  next.audit = Array.isArray(next.audit) ? next.audit : [];

  const normalized =
    entry && typeof entry === "object"
      ? {
          id: entry.id ?? createKernelId("audit"),
          createdAt: entry.createdAt ?? nowIso(),
          level: entry.level ?? "info",
          action: entry.action ?? "legacy.audit",
          message:
            entry.message ??
            entry.content ??
            entry.label ??
            entry.title ??
            "Legacy audit entry",
          refs: Array.isArray(entry.refs) ? entry.refs : [],
          metadata: entry.metadata ?? {},
        }
      : createAuditEntry("legacy.audit", String(entry ?? "Legacy audit entry"), "info", []);

  next.audit.push(normalized);
  return next;
};

/**
 * PATCH 4
 * Compatibility bridge from legacy kernel/audit.ts to canonical-audit.ts
 * Additive only: exports only missing canonical audit symbols.
 */
export type {
  CanonicalAuditEntry,
  CanonicalAuditInput,
} from "./canonical-audit";
export {
  createCanonicalAuditEntry,
  formatCanonicalAuditEntry,
  formatCanonicalAuditRecent,
  appendCanonicalAuditEntry,
} from "./canonical-audit";

