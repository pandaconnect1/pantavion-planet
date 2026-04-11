/**
 * PATCH 1
 * Canonical shared types foundation for future kernel alignment.
 *
 * IMPORTANT:
 * - This file is additive and low-risk.
 * - Live modules are NOT redirected here yet.
 * - Future patches will migrate store / memory / audit / runner / API routes
 *   one controlled step at a time.
 */

export * as LegacyKernelTypes from "./types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonMap = Record<string, JsonValue>;

export const KernelPriorities = [
  "background",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type KernelPriority = (typeof KernelPriorities)[number];

export const KernelScopes = [
  "global",
  "identity",
  "memory",
  "knowledge",
  "communication",
  "planning",
  "execution",
  "safety",
] as const;

export type KernelScope = (typeof KernelScopes)[number];

export const AuditLevels = [
  "info",
  "warn",
  "error",
  "critical",
] as const;

export type AuditLevel = (typeof AuditLevels)[number];

export type KernelIntakeRequest = {
  text: string;
  scopes?: KernelScope[];
  priority?: KernelPriority;
  metadata?: Record<string, unknown>;
};

export type KernelRunRequest = {
  intent: string;
  payload?: Record<string, unknown>;
  scopes?: KernelScope[];
  priority?: KernelPriority;
  metadata?: Record<string, unknown>;
};

export type KernelSignalRecord = {
  id: string;
  name: string;
  priority: KernelPriority;
  source?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export function clamp(value: number, min: number, max: number): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.min(Math.max(safe, min), max);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createKernelId(prefix = "kernel"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeKernelPriority(value: unknown): KernelPriority {
  const raw = String(value ?? "background").trim().toLowerCase();

  if (raw === "critical") return "critical";
  if (raw === "high") return "high";
  if (raw === "medium") return "medium";
  if (raw === "low") return "low";
  return "background";
}

export function normalizeAuditLevel(value: unknown): AuditLevel {
  const raw = String(value ?? "info").trim().toLowerCase();

  if (raw === "critical") return "critical";
  if (raw === "error") return "error";
  if (raw === "warn" || raw === "warning") return "warn";
  return "info";
}

export function normalizeKernelScopes(value: unknown): KernelScope[] {
  const list = Array.isArray(value) ? value : [value];

  const normalized = list
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      if (item === "identity") return "identity";
      if (item === "memory") return "memory";
      if (item === "knowledge") return "knowledge";
      if (item === "communication") return "communication";
      if (item === "planning") return "planning";
      if (item === "execution") return "execution";
      if (item === "safety") return "safety";
      return "global";
    });

  return Array.from(new Set(normalized));
}
