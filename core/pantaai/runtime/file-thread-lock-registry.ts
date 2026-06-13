import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  detectProtectedDomain,
  type ProtectedKernelDomain,
} from "../autonomous-code/protected-path-policy";
import { appendPantavionRuntimeLedgerEvent } from "./runtime-ledger";

export type PantavionLockOwnerKind =
  | "founder"
  | "worker_thread"
  | "kernel"
  | "cron"
  | "github_pr"
  | "unknown";

export type PantavionThreadLockStatus =
  | "active"
  | "released"
  | "expired"
  | "conflict";

export type PantavionThreadLockFile = {
  readonly path: string;
  readonly protectedDomain?: ProtectedKernelDomain;
};

export type PantavionThreadLockConflict = {
  readonly lockId: string;
  readonly ownerId: string;
  readonly ownerKind: PantavionLockOwnerKind;
  readonly branch?: string;
  readonly reason: string;
  readonly files: readonly PantavionThreadLockFile[];
};

export type PantavionThreadLock = {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string;
  readonly releasedAt?: string;
  readonly status: PantavionThreadLockStatus;
  readonly ownerKind: PantavionLockOwnerKind;
  readonly ownerId: string;
  readonly purpose: string;
  readonly branch?: string;
  readonly sourceRunId?: string;
  readonly files: readonly PantavionThreadLockFile[];
  readonly protectedDomains: readonly ProtectedKernelDomain[];
  readonly requiresFounderApproval: boolean;
  readonly conflicts: readonly PantavionThreadLockConflict[];
};

export type PantavionThreadLockRegistry = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly locks: readonly PantavionThreadLock[];
};

export type PantavionAcquireThreadLockInput = {
  readonly ownerKind: PantavionLockOwnerKind;
  readonly ownerId: string;
  readonly purpose: string;
  readonly files: readonly string[];
  readonly branch?: string;
  readonly sourceRunId?: string;
  readonly ttlMinutes?: number;
};

export type PantavionAcquireThreadLockResult =
  | {
      readonly ok: true;
      readonly marker: "pantavion_file_thread_lock_registry_c9c_v1";
      readonly lock: PantavionThreadLock;
      readonly summary: ReturnType<typeof summarizePantavionThreadLocks>;
    }
  | {
      readonly ok: false;
      readonly marker: "pantavion_file_thread_lock_registry_c9c_v1";
      readonly lock: PantavionThreadLock;
      readonly conflicts: readonly PantavionThreadLockConflict[];
      readonly summary: ReturnType<typeof summarizePantavionThreadLocks>;
    };

export type PantavionReleaseThreadLockResult =
  | {
      readonly ok: true;
      readonly marker: "pantavion_file_thread_lock_registry_c9c_v1";
      readonly lock: PantavionThreadLock;
      readonly summary: ReturnType<typeof summarizePantavionThreadLocks>;
    }
  | {
      readonly ok: false;
      readonly marker: "pantavion_file_thread_lock_registry_c9c_v1";
      readonly reason: string;
      readonly summary: ReturnType<typeof summarizePantavionThreadLocks>;
    };

const LOCK_REGISTRY_FILE = path.join(
  process.cwd(),
  ".pantavion",
  "thread-locks",
  "locks.json",
);

const DEFAULT_TTL_MINUTES = 120;
const MAX_TTL_MINUTES = 24 * 60;
const MAX_FILES_PER_LOCK = 50;

function nowIso(): string {
  return new Date().toISOString();
}

function ensureLockRegistryDir(): void {
  fs.mkdirSync(path.dirname(LOCK_REGISTRY_FILE), { recursive: true });
}

function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function parseDate(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isExpired(lock: PantavionThreadLock): boolean {
  return lock.status === "active" && parseDate(lock.expiresAt) <= Date.now();
}

function expireLockIfNeeded(lock: PantavionThreadLock): PantavionThreadLock {
  if (!isExpired(lock)) return lock;

  return {
    ...lock,
    status: "expired",
    updatedAt: nowIso(),
  };
}

function toFiles(files: readonly string[]): PantavionThreadLockFile[] {
  return uniqueStrings(files.map(normalizeRepoPath).filter(Boolean)).map((filePath) => ({
    path: filePath,
    protectedDomain: detectProtectedDomain(filePath),
  }));
}

function collectProtectedDomains(files: readonly PantavionThreadLockFile[]): ProtectedKernelDomain[] {
  return uniqueStrings(
    files
      .map((file) => file.protectedDomain)
      .filter((domain): domain is ProtectedKernelDomain => typeof domain === "string"),
  );
}

function lockIsActive(lock: PantavionThreadLock): boolean {
  return lock.status === "active" && !isExpired(lock);
}

function sameOwner(existing: PantavionThreadLock, input: PantavionAcquireThreadLockInput): boolean {
  return existing.ownerId === input.ownerId && existing.ownerKind === input.ownerKind;
}

function filesOverlap(
  a: readonly PantavionThreadLockFile[],
  b: readonly PantavionThreadLockFile[],
): boolean {
  const paths = new Set(a.map((file) => file.path));
  return b.some((file) => paths.has(file.path));
}

function protectedDomainsOverlap(
  a: readonly ProtectedKernelDomain[],
  b: readonly ProtectedKernelDomain[],
): boolean {
  const domains = new Set(a);
  return b.some((domain) => domains.has(domain));
}

function findConflicts(
  existingLocks: readonly PantavionThreadLock[],
  requestedFiles: readonly PantavionThreadLockFile[],
  requestedDomains: readonly ProtectedKernelDomain[],
  input: PantavionAcquireThreadLockInput,
): PantavionThreadLockConflict[] {
  return existingLocks
    .filter(lockIsActive)
    .filter((lock) => !sameOwner(lock, input))
    .filter((lock) => {
      return (
        filesOverlap(lock.files, requestedFiles) ||
        protectedDomainsOverlap(lock.protectedDomains, requestedDomains)
      );
    })
    .map((lock) => ({
      lockId: lock.id,
      ownerId: lock.ownerId,
      ownerKind: lock.ownerKind,
      branch: lock.branch,
      reason: filesOverlap(lock.files, requestedFiles)
        ? "Requested files overlap with an active lock."
        : "Requested protected domain overlaps with an active lock.",
      files: lock.files,
    }));
}

function lockDuration(input: PantavionAcquireThreadLockInput): number {
  const requested = input.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  const safe = Math.max(1, Math.min(requested, MAX_TTL_MINUTES));
  return safe * 60 * 1000;
}

export function loadPantavionThreadLockRegistry(): PantavionThreadLockRegistry {
  try {
    if (!fs.existsSync(LOCK_REGISTRY_FILE)) {
      return {
        version: 1,
        updatedAt: nowIso(),
        locks: [],
      };
    }

    const parsed = JSON.parse(fs.readFileSync(LOCK_REGISTRY_FILE, "utf8")) as PantavionThreadLockRegistry;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      locks: Array.isArray(parsed.locks) ? parsed.locks.map(expireLockIfNeeded) : [],
    };
  } catch {
    return {
      version: 1,
      updatedAt: nowIso(),
      locks: [],
    };
  }
}

export function savePantavionThreadLockRegistry(registry: PantavionThreadLockRegistry): void {
  ensureLockRegistryDir();
  fs.writeFileSync(
    LOCK_REGISTRY_FILE,
    JSON.stringify(
      {
        version: 1,
        updatedAt: nowIso(),
        locks: registry.locks.slice(-1000),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

export function acquirePantavionThreadLock(
  input: PantavionAcquireThreadLockInput,
): PantavionAcquireThreadLockResult {
  const registry = loadPantavionThreadLockRegistry();
  const requestedFiles = toFiles(input.files);
  const protectedDomains = collectProtectedDomains(requestedFiles);
  const conflicts = findConflicts(registry.locks, requestedFiles, protectedDomains, input);
  const now = Date.now();
  const expiresAt = new Date(now + lockDuration(input)).toISOString();

  const inputErrors: string[] = [];

  if (requestedFiles.length === 0) {
    inputErrors.push("No files supplied for thread lock.");
  }

  if (requestedFiles.length > MAX_FILES_PER_LOCK) {
    inputErrors.push(`Too many files for one thread lock: ${requestedFiles.length}.`);
  }

  if (!input.ownerId.trim()) {
    inputErrors.push("Missing ownerId.");
  }

  if (!input.purpose.trim()) {
    inputErrors.push("Missing purpose.");
  }

  const allConflicts = [
    ...conflicts,
    ...inputErrors.map((error) => ({
      lockId: "input-error",
      ownerId: input.ownerId || "unknown",
      ownerKind: input.ownerKind,
      branch: input.branch,
      reason: error,
      files: requestedFiles,
    })),
  ];

  const status: PantavionThreadLockStatus = allConflicts.length > 0 ? "conflict" : "active";

  const lock: PantavionThreadLock = {
    id: `lock-${randomUUID()}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    expiresAt,
    status,
    ownerKind: input.ownerKind,
    ownerId: input.ownerId,
    purpose: input.purpose,
    branch: input.branch,
    sourceRunId: input.sourceRunId,
    files: requestedFiles,
    protectedDomains,
    requiresFounderApproval: protectedDomains.length > 0,
    conflicts: allConflicts,
  };

  savePantavionThreadLockRegistry({
    version: 1,
    updatedAt: nowIso(),
    locks: [...registry.locks, lock],
  });

  appendPantavionRuntimeLedgerEvent({
    runId: input.sourceRunId,
    eventType: status === "active" ? "job_claimed" : "protected_gate_required",
    severity: status === "active" ? "info" : "warning",
    kernelFamily: "Pantavion File Thread Lock Registry",
    message:
      status === "active"
        ? "Thread/file lock acquired."
        : "Thread/file lock conflict detected.",
    protectedDomains,
    metadata: {
      marker: "pantavion_file_thread_lock_registry_c9c_v1",
      lockId: lock.id,
      status,
      ownerKind: input.ownerKind,
      ownerId: input.ownerId,
      branch: input.branch,
      files: requestedFiles.map((file) => file.path),
      conflicts: allConflicts,
      requiresFounderApproval: lock.requiresFounderApproval,
    },
  });

  if (lock.requiresFounderApproval || status === "conflict") {
    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "founder_gate_required",
      severity: status === "conflict" ? "warning" : "info",
      kernelFamily: "Pantavion File Thread Lock Registry",
      message:
        status === "conflict"
          ? "Lock conflict requires coordinator decision."
          : "Lock touches protected domain and requires founder-aware review.",
      protectedDomains: protectedDomains.length > 0 ? protectedDomains : ["founder_gate"],
      metadata: {
        marker: "pantavion_file_thread_lock_registry_c9c_v1",
        lockId: lock.id,
        status,
      },
    });
  }

  if (status === "conflict") {
    return {
      ok: false,
      marker: "pantavion_file_thread_lock_registry_c9c_v1",
      lock,
      conflicts: allConflicts,
      summary: summarizePantavionThreadLocks(),
    };
  }

  return {
    ok: true,
    marker: "pantavion_file_thread_lock_registry_c9c_v1",
    lock,
    summary: summarizePantavionThreadLocks(),
  };
}

export function releasePantavionThreadLock(args: {
  readonly lockId: string;
  readonly ownerId?: string;
  readonly sourceRunId?: string;
}): PantavionReleaseThreadLockResult {
  const registry = loadPantavionThreadLockRegistry();
  const lock = registry.locks.find((candidate) => candidate.id === args.lockId);

  if (!lock) {
    return {
      ok: false,
      marker: "pantavion_file_thread_lock_registry_c9c_v1",
      reason: "Lock not found.",
      summary: summarizePantavionThreadLocks(),
    };
  }

  if (args.ownerId && lock.ownerId !== args.ownerId) {
    return {
      ok: false,
      marker: "pantavion_file_thread_lock_registry_c9c_v1",
      reason: "Lock owner mismatch.",
      summary: summarizePantavionThreadLocks(),
    };
  }

  const released: PantavionThreadLock = {
    ...lock,
    status: "released",
    updatedAt: nowIso(),
    releasedAt: nowIso(),
  };

  savePantavionThreadLockRegistry({
    version: 1,
    updatedAt: nowIso(),
    locks: registry.locks.map((candidate) => (candidate.id === lock.id ? released : candidate)),
  });

  appendPantavionRuntimeLedgerEvent({
    runId: args.sourceRunId,
    eventType: "audit_passed",
    severity: "info",
    kernelFamily: "Pantavion File Thread Lock Registry",
    message: "Thread/file lock released.",
    protectedDomains: released.protectedDomains,
    metadata: {
      marker: "pantavion_file_thread_lock_registry_c9c_v1",
      lockId: released.id,
      ownerId: released.ownerId,
      status: released.status,
    },
  });

  return {
    ok: true,
    marker: "pantavion_file_thread_lock_registry_c9c_v1",
    lock: released,
    summary: summarizePantavionThreadLocks(),
  };
}

export function summarizePantavionThreadLocks() {
  const registry = loadPantavionThreadLockRegistry();

  const byStatus = registry.locks.reduce<Record<string, number>>((acc, lock) => {
    acc[lock.status] = (acc[lock.status] ?? 0) + 1;
    return acc;
  }, {});

  const byOwnerKind = registry.locks.reduce<Record<string, number>>((acc, lock) => {
    acc[lock.ownerKind] = (acc[lock.ownerKind] ?? 0) + 1;
    return acc;
  }, {});

  const activeLocks = registry.locks.filter(lockIsActive);
  const conflictLocks = registry.locks.filter((lock) => lock.status === "conflict");
  const protectedLocks = registry.locks.filter((lock) => lock.protectedDomains.length > 0);

  return {
    ok: true,
    marker: "pantavion_file_thread_lock_summary_c9c_v1",
    updatedAt: registry.updatedAt,
    totalLocks: registry.locks.length,
    activeLocks: activeLocks.length,
    conflictLocks: conflictLocks.length,
    protectedLocks: protectedLocks.length,
    byStatus,
    byOwnerKind,
    active: activeLocks.slice(-50),
    conflicts: conflictLocks.slice(-20),
    lastLocks: registry.locks.slice(-20),
  };
}

export const pantavion_file_thread_lock_registry_marker_v1 =
  "pantavion_file_thread_lock_registry_c9c_v1";
