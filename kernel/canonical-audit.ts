import {
  AuditLevel,
  createKernelId,
  nowIso,
  normalizeAuditLevel,
} from "./canonical-types";

export type CanonicalAuditEntry = {
  id: string;
  action: string;
  message: string;
  level: AuditLevel;
  createdAt: string;
  refs: string[];
  metadata: Record<string, unknown>;
};

export type CanonicalAuditInput = {
  id?: unknown;
  action?: unknown;
  message?: unknown;
  level?: unknown;
  createdAt?: unknown;
  refs?: unknown;
  metadata?: unknown;
};

function normalizeString(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function normalizeRefs(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [];
  return Array.from(
    new Set(
      list
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function createCanonicalAuditEntry(input: CanonicalAuditInput = {}): CanonicalAuditEntry {
  return {
    id: normalizeString(input.id, createKernelId("audit")),
    action: normalizeString(input.action, "unknown"),
    message: normalizeString(input.message, ""),
    level: normalizeAuditLevel(input.level),
    createdAt: normalizeString(input.createdAt, nowIso()),
    refs: normalizeRefs(input.refs),
    metadata: normalizeMetadata(input.metadata),
  };
}

export function formatCanonicalAuditEntry(entry: CanonicalAuditInput): string {
  const normalized = createCanonicalAuditEntry(entry);
  const level = normalized.level.toUpperCase();
  return "[" + level + "] " + normalized.action + " - " + normalized.message;
}

export function formatCanonicalAuditRecent(entries: CanonicalAuditInput[]): string {
  return entries.map((entry) => formatCanonicalAuditEntry(entry)).join("\n");
}

export function appendCanonicalAuditEntry(
  state: any,
  entry: CanonicalAuditInput
): any {
  const next = { ...(state ?? {}) };
  const current = Array.isArray(next.audit) ? next.audit : [];
  next.audit = [...current, createCanonicalAuditEntry(entry)];
  return next;
}
