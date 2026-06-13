import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  detectProtectedDomain,
  type ProtectedKernelDomain,
} from "../autonomous-code/protected-path-policy";
import {
  acquirePantavionThreadLock,
  releasePantavionThreadLock,
} from "./file-thread-lock-registry";
import { appendPantavionRuntimeLedgerEvent } from "./runtime-ledger";

export type PantavionWorkPackageState =
  | "pending"
  | "claimed"
  | "completed"
  | "blocked"
  | "failed"
  | "quarantined";

export type PantavionWorkPackagePriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type PantavionWorkPackageRisk =
  | "low"
  | "medium"
  | "high"
  | "protected";

export type PantavionWorkPackage = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly capabilityFamily: string;
  readonly state: PantavionWorkPackageState;
  readonly priority: PantavionWorkPackagePriority;
  readonly risk: PantavionWorkPackageRisk;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly claimedAt?: string;
  readonly completedAt?: string;
  readonly blockedAt?: string;
  readonly failedAt?: string;
  readonly ownerId?: string;
  readonly ownerKind?: "kernel" | "cron" | "founder" | "worker_thread" | "github_pr";
  readonly branch?: string;
  readonly lockId?: string;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly dependsOn: readonly string[];
  readonly targetFiles: readonly string[];
  readonly protectedDomains: readonly ProtectedKernelDomain[];
  readonly requiredGates: readonly string[];
  readonly successSignals: readonly string[];
  readonly failureReason?: string;
};

export type PantavionWorkPackageQueue = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly packages: readonly PantavionWorkPackage[];
};

export type PantavionWorkPackageSeed = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly capabilityFamily: string;
  readonly priority: PantavionWorkPackagePriority;
  readonly risk: PantavionWorkPackageRisk;
  readonly targetFiles: readonly string[];
  readonly dependsOn?: readonly string[];
  readonly requiredGates?: readonly string[];
  readonly successSignals?: readonly string[];
  readonly maxAttempts?: number;
};

export type PantavionClaimWorkPackageInput = {
  readonly ownerId: string;
  readonly ownerKind: "kernel" | "cron" | "founder" | "worker_thread";
  readonly branch?: string;
  readonly sourceRunId?: string;
};

export type PantavionClaimWorkPackageResult =
  | {
      readonly ok: true;
      readonly marker: "pantavion_autonomous_work_package_coordinator_c9e_v1";
      readonly package: PantavionWorkPackage;
      readonly summary: ReturnType<typeof summarizePantavionWorkPackageQueue>;
    }
  | {
      readonly ok: false;
      readonly marker: "pantavion_autonomous_work_package_coordinator_c9e_v1";
      readonly reason: string;
      readonly package?: PantavionWorkPackage;
      readonly summary: ReturnType<typeof summarizePantavionWorkPackageQueue>;
    };

const WORK_PACKAGE_QUEUE_FILE = path.join(
  process.cwd(),
  ".pantavion",
  "work-packages",
  "queue.json",
);

const DEFAULT_MAX_ATTEMPTS = 3;

const DEFAULT_WORK_PACKAGES: readonly PantavionWorkPackageSeed[] = [
  {
    id: "wp-001-china-superapp-ecosystem",
    title: "China ecosystem capability map",
    summary:
      "Build Pantavion-owned capability map inspired by Chinese super-app patterns without copying brands, UI, logos or claims.",
    capabilityFamily: "PantaLife Super-App Kernel",
    priority: "critical",
    risk: "medium",
    targetFiles: [
      "core/pantaai/ecosystems/china-superapp-capabilities.ts",
      "core/pantaai/ecosystems/china-superapp-capabilities.test-contract.ts",
    ],
    requiredGates: ["typescript", "build", "legal_adaptation", "provider_router"],
    successSignals: [
      "pantavion_china_superapp_capability_map",
      "no_brand_clone",
      "legal_adaptation_required",
    ],
  },
  {
    id: "wp-002-seven-continent-ecosystem",
    title: "Seven-continent ecosystem kernel",
    summary:
      "Create global localization and continent-aware ecosystem contract for Pantavion without fragmenting the core product.",
    capabilityFamily: "Seven-Continent Ecosystem Kernel",
    priority: "critical",
    risk: "medium",
    targetFiles: [
      "core/pantaai/ecosystems/seven-continent-ecosystem-kernel.ts",
      "core/pantaai/ecosystems/global-localization-contract.ts",
    ],
    requiredGates: ["typescript", "build", "i18n_policy", "regional_safety"],
    successSignals: [
      "pantavion_seven_continent_kernel",
      "continent_localization_contract",
    ],
  },
  {
    id: "wp-003-provider-router-expansion",
    title: "Provider router expansion",
    summary:
      "Expand Pantavion provider router for models, coding agents, RAG, workflow, video, image, voice and translation providers.",
    capabilityFamily: "PantaAI Provider Router",
    priority: "critical",
    risk: "low",
    targetFiles: [
      "core/pantaai/providers/provider-router-expansion.ts",
      "core/pantaai/providers/provider-capability-matrix.ts",
    ],
    requiredGates: ["typescript", "build", "provider_policy", "cost_control"],
    successSignals: [
      "pantavion_provider_router_expansion",
      "provider_capability_matrix",
    ],
  },
  {
    id: "wp-004-pantadev-autonomous-coding",
    title: "PantaDev autonomous coding lifecycle",
    summary:
      "Define Pantavion-owned coding-agent lifecycle for planning, generating, auditing, repairing and opening PRs.",
    capabilityFamily: "PantaDev Autonomous Coding Kernel",
    priority: "critical",
    risk: "low",
    targetFiles: [
      "core/pantaai/developer/pantadev-agent-lifecycle.ts",
      "core/pantaai/developer/pantadev-code-quality-gates.ts",
    ],
    dependsOn: ["wp-003-provider-router-expansion"],
    requiredGates: ["typescript", "build", "autonomous_gate", "repair_loop"],
    successSignals: [
      "pantavion_pantadev_lifecycle",
      "code_quality_gates",
    ],
  },
  {
    id: "wp-005-pantarag-memory-kernel",
    title: "PantaRAG memory and knowledge kernel",
    summary:
      "Create RAG/memory contract for Pantavion source atlas, project memory, user memory boundaries and retrieval routing.",
    capabilityFamily: "PantaRAG / Memory Kernel",
    priority: "high",
    risk: "medium",
    targetFiles: [
      "core/pantaai/rag/pantarag-memory-kernel.ts",
      "core/pantaai/rag/source-reliability-contract.ts",
    ],
    requiredGates: ["typescript", "build", "privacy_gate", "source_reliability"],
    successSignals: [
      "pantavion_pantarag_memory_kernel",
      "source_reliability_contract",
    ],
  },
  {
    id: "wp-006-live-translation-kernel",
    title: "Live translation and communication kernel",
    summary:
      "Build core contract for voice/text/video/subtitle translation with assistive-not-certified disclaimer.",
    capabilityFamily: "PantaTranslation / Live Voice Kernel",
    priority: "high",
    risk: "protected",
    targetFiles: [
      "core/pantaai/translation/live-translation-kernel.ts",
      "core/pantaai/translation/translation-safety-boundaries.ts",
    ],
    requiredGates: ["typescript", "build", "safety_policy", "translation_disclaimer"],
    successSignals: [
      "pantavion_live_translation_kernel",
      "assistive_translation_not_certified",
    ],
  },
  {
    id: "wp-007-social-universe-kernel",
    title: "Pantavion social universe kernel",
    summary:
      "Create Pantavion-owned social/profile/community/media surfaces without copying social networks.",
    capabilityFamily: "PantaSocial Universe Kernel",
    priority: "high",
    risk: "medium",
    targetFiles: [
      "core/pantaai/social/pantavion-social-universe-kernel.ts",
      "core/pantaai/social/community-safety-contract.ts",
    ],
    requiredGates: ["typescript", "build", "moderation_policy", "minors_policy"],
    successSignals: [
      "pantavion_social_universe_kernel",
      "community_safety_contract",
    ],
  },
  {
    id: "wp-008-creator-media-studio",
    title: "PantaCreator and media studio kernel",
    summary:
      "Define image/video/presentation/music/content capability surfaces with copyright, consent and provider boundaries.",
    capabilityFamily: "PantaCreator / PantaMedia Studio",
    priority: "high",
    risk: "medium",
    targetFiles: [
      "core/pantaai/media/pantacreator-media-studio-kernel.ts",
      "core/pantaai/media/copyright-consent-guardrails.ts",
    ],
    requiredGates: ["typescript", "build", "copyright_gate", "consent_gate"],
    successSignals: [
      "pantavion_creator_media_studio",
      "copyright_consent_guardrails",
    ],
  },
  {
    id: "wp-009-marketplace-work-income",
    title: "Marketplace, work and income kernel",
    summary:
      "Define professional services, classifieds, work, income and monetization boundaries with claim safety.",
    capabilityFamily: "PantaWork / Marketplace Kernel",
    priority: "high",
    risk: "protected",
    targetFiles: [
      "core/pantaai/marketplace/pantawork-marketplace-kernel.ts",
      "core/pantaai/marketplace/income-claim-safety-policy.ts",
    ],
    requiredGates: ["typescript", "build", "income_claim_safety", "legal_policy"],
    successSignals: [
      "pantavion_work_marketplace_kernel",
      "income_claim_safety_policy",
    ],
  },
  {
    id: "wp-010-pantapay-compliance",
    title: "PantaPay compliance foundation",
    summary:
      "Create payment/subscription/billing compliance contract without activating live merchant operations.",
    capabilityFamily: "PantaPay Compliance Kernel",
    priority: "medium",
    risk: "protected",
    targetFiles: [
      "core/pantaai/payments/pantapay-compliance-kernel.ts",
      "core/pantaai/payments/subscription-billing-boundaries.ts",
    ],
    requiredGates: ["typescript", "build", "payment_policy", "founder_approval"],
    successSignals: [
      "pantavion_pantapay_compliance_kernel",
      "subscription_billing_boundaries",
    ],
  },
  {
    id: "wp-011-safety-legal-identity",
    title: "Safety, legal and identity coordination kernel",
    summary:
      "Coordinate legal, consent, identity, minors and vulnerable-user safety boundaries.",
    capabilityFamily: "PantaSafety / Legal / Identity Kernel",
    priority: "critical",
    risk: "protected",
    targetFiles: [
      "core/pantaai/safety/pantasafety-legal-identity-kernel.ts",
      "core/pantaai/safety/minors-vulnerable-users-policy.ts",
    ],
    requiredGates: ["typescript", "build", "legal_policy", "identity_policy", "founder_approval"],
    successSignals: [
      "pantavion_safety_legal_identity_kernel",
      "minors_vulnerable_users_policy",
    ],
  },
  {
    id: "wp-012-sos-offgrid-safety",
    title: "SOS and off-grid safety kernel",
    summary:
      "Define SOS/off-grid safety execution boundaries without claiming certified emergency beacon behavior.",
    capabilityFamily: "PantaSOS / Off-Grid Safety Kernel",
    priority: "critical",
    risk: "protected",
    targetFiles: [
      "core/pantaai/sos/pantasos-offgrid-kernel.ts",
      "core/pantaai/sos/certified-provider-boundaries.ts",
    ],
    requiredGates: ["typescript", "build", "sos_policy", "emergency_disclaimer", "founder_approval"],
    successSignals: [
      "pantavion_sos_offgrid_kernel",
      "certified_provider_boundaries",
    ],
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function ensureQueueDir(): void {
  fs.mkdirSync(path.dirname(WORK_PACKAGE_QUEUE_FILE), { recursive: true });
}

function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function priorityWeight(priority: PantavionWorkPackagePriority): number {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    default:
      return 3;
  }
}

function stateWeight(state: PantavionWorkPackageState): number {
  switch (state) {
    case "pending":
      return 0;
    case "blocked":
      return 1;
    case "failed":
      return 2;
    case "claimed":
      return 3;
    case "quarantined":
      return 4;
    case "completed":
      return 5;
    default:
      return 9;
  }
}

function detectDomains(targetFiles: readonly string[], explicit: readonly ProtectedKernelDomain[] = []): ProtectedKernelDomain[] {
  const detected = targetFiles
    .map((file) => detectProtectedDomain(file))
    .filter((domain): domain is ProtectedKernelDomain => typeof domain === "string");

  return uniqueStrings([...explicit, ...detected]);
}

function createWorkPackage(seed: PantavionWorkPackageSeed): PantavionWorkPackage {
  const targetFiles = uniqueStrings(seed.targetFiles.map(normalizeRepoPath).filter(Boolean));
  const protectedDomains = detectDomains(targetFiles);
  const requiredGates = uniqueStrings([
    ...(seed.requiredGates ?? []),
    "runtime_ledger",
    "file_thread_lock",
    "github_pr_writer",
    "autonomous_repair_loop",
  ]);

  return {
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    capabilityFamily: seed.capabilityFamily,
    state: "pending",
    priority: seed.priority,
    risk: protectedDomains.length > 0 ? "protected" : seed.risk,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    attempts: 0,
    maxAttempts: seed.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    dependsOn: seed.dependsOn ?? [],
    targetFiles,
    protectedDomains,
    requiredGates,
    successSignals: seed.successSignals ?? [],
  };
}

export function loadPantavionWorkPackageQueue(): PantavionWorkPackageQueue {
  try {
    if (!fs.existsSync(WORK_PACKAGE_QUEUE_FILE)) {
      return {
        version: 1,
        updatedAt: nowIso(),
        packages: [],
      };
    }

    const parsed = JSON.parse(fs.readFileSync(WORK_PACKAGE_QUEUE_FILE, "utf8")) as PantavionWorkPackageQueue;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      packages: Array.isArray(parsed.packages) ? parsed.packages : [],
    };
  } catch {
    return {
      version: 1,
      updatedAt: nowIso(),
      packages: [],
    };
  }
}

export function savePantavionWorkPackageQueue(queue: PantavionWorkPackageQueue): void {
  ensureQueueDir();
  fs.writeFileSync(
    WORK_PACKAGE_QUEUE_FILE,
    JSON.stringify(
      {
        version: 1,
        updatedAt: nowIso(),
        packages: queue.packages.slice(-1000),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

export function seedPantavionAutonomousWorkPackages(
  seeds: readonly PantavionWorkPackageSeed[] = DEFAULT_WORK_PACKAGES,
): PantavionWorkPackageQueue {
  const queue = loadPantavionWorkPackageQueue();
  const existingIds = new Set(queue.packages.map((pkg) => pkg.id));
  const newPackages = seeds
    .filter((seed) => !existingIds.has(seed.id))
    .map(createWorkPackage);

  const nextQueue = {
    version: 1 as const,
    updatedAt: nowIso(),
    packages: [...queue.packages, ...newPackages],
  };

  savePantavionWorkPackageQueue(nextQueue);

  appendPantavionRuntimeLedgerEvent({
    eventType: "work_package_planned",
    severity: "info",
    kernelFamily: "Pantavion Autonomous Work Package Coordinator",
    message: "Autonomous work package queue seeded.",
    protectedDomains: [],
    metadata: {
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      packagesAdded: newPackages.length,
      totalPackages: nextQueue.packages.length,
    },
  });

  return nextQueue;
}

function dependenciesSatisfied(pkg: PantavionWorkPackage, queue: PantavionWorkPackageQueue): boolean {
  if (pkg.dependsOn.length === 0) return true;

  const completed = new Set(
    queue.packages
      .filter((candidate) => candidate.state === "completed")
      .map((candidate) => candidate.id),
  );

  return pkg.dependsOn.every((dependency) => completed.has(dependency));
}

function selectNextPackage(queue: PantavionWorkPackageQueue): PantavionWorkPackage | undefined {
  return queue.packages
    .filter((pkg) => pkg.state === "pending" || pkg.state === "failed")
    .filter((pkg) => pkg.attempts < pkg.maxAttempts)
    .filter((pkg) => dependenciesSatisfied(pkg, queue))
    .sort((a, b) => {
      const stateDelta = stateWeight(a.state) - stateWeight(b.state);
      if (stateDelta !== 0) return stateDelta;

      const priorityDelta = priorityWeight(a.priority) - priorityWeight(b.priority);
      if (priorityDelta !== 0) return priorityDelta;

      return a.createdAt.localeCompare(b.createdAt);
    })[0];
}

function updatePackage(
  queue: PantavionWorkPackageQueue,
  packageId: string,
  updater: (pkg: PantavionWorkPackage) => PantavionWorkPackage,
): PantavionWorkPackageQueue {
  return {
    version: 1,
    updatedAt: nowIso(),
    packages: queue.packages.map((pkg) => (pkg.id === packageId ? updater(pkg) : pkg)),
  };
}

export function claimNextPantavionWorkPackage(
  input: PantavionClaimWorkPackageInput,
): PantavionClaimWorkPackageResult {
  const seeded = seedPantavionAutonomousWorkPackages();
  const pkg = selectNextPackage(seeded);

  if (!pkg) {
    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "work_package_planned",
      severity: "warning",
      kernelFamily: "Pantavion Autonomous Work Package Coordinator",
      message: "No claimable autonomous work package is currently available.",
      protectedDomains: [],
      metadata: {
        marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      },
    });

    return {
      ok: false,
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      reason: "No claimable work package available.",
      summary: summarizePantavionWorkPackageQueue(),
    };
  }

  const lock = acquirePantavionThreadLock({
    ownerKind: input.ownerKind,
    ownerId: input.ownerId,
    purpose: `Work package ${pkg.id}: ${pkg.title}`,
    files: pkg.targetFiles,
    branch: input.branch,
    sourceRunId: input.sourceRunId,
    ttlMinutes: 180,
  });

  if (!lock.ok) {
    const blockedQueue = updatePackage(seeded, pkg.id, (candidate) => ({
      ...candidate,
      state: "blocked",
      blockedAt: nowIso(),
      updatedAt: nowIso(),
      failureReason: `File/thread lock conflict: ${lock.conflicts.map((conflict) => conflict.reason).join(" | ")}`,
    }));

    savePantavionWorkPackageQueue(blockedQueue);

    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "protected_gate_required",
      severity: "warning",
      kernelFamily: "Pantavion Autonomous Work Package Coordinator",
      message: "Work package blocked by file/thread lock conflict.",
      protectedDomains: pkg.protectedDomains,
      metadata: {
        marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
        packageId: pkg.id,
        conflicts: lock.conflicts,
      },
    });

    return {
      ok: false,
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      reason: "Work package blocked by file/thread lock conflict.",
      package: {
        ...pkg,
        state: "blocked",
        blockedAt: nowIso(),
        updatedAt: nowIso(),
      },
      summary: summarizePantavionWorkPackageQueue(),
    };
  }

  const claimedPackage: PantavionWorkPackage = {
    ...pkg,
    state: "claimed",
    claimedAt: nowIso(),
    updatedAt: nowIso(),
    ownerId: input.ownerId,
    ownerKind: input.ownerKind,
    branch: input.branch,
    lockId: lock.lock.id,
    attempts: pkg.attempts + 1,
  };

  const claimedQueue = updatePackage(seeded, pkg.id, () => claimedPackage);
  savePantavionWorkPackageQueue(claimedQueue);

  appendPantavionRuntimeLedgerEvent({
    runId: input.sourceRunId,
    eventType: "job_claimed",
    severity: pkg.protectedDomains.length > 0 ? "warning" : "info",
    kernelFamily: "Pantavion Autonomous Work Package Coordinator",
    message: "Autonomous work package claimed.",
    protectedDomains: pkg.protectedDomains,
    metadata: {
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      packageId: pkg.id,
      title: pkg.title,
      capabilityFamily: pkg.capabilityFamily,
      priority: pkg.priority,
      risk: pkg.risk,
      ownerId: input.ownerId,
      ownerKind: input.ownerKind,
      branch: input.branch,
      lockId: lock.lock.id,
      targetFiles: pkg.targetFiles,
      requiredGates: pkg.requiredGates,
      successSignals: pkg.successSignals,
    },
  });

  if (pkg.protectedDomains.length > 0) {
    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "founder_gate_required",
      severity: "warning",
      kernelFamily: "Pantavion Autonomous Work Package Coordinator",
      message: "Claimed work package touches protected domains and requires founder-aware review before merge.",
      protectedDomains: pkg.protectedDomains,
      metadata: {
        marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
        packageId: pkg.id,
        protectedDomains: pkg.protectedDomains,
      },
    });
  }

  return {
    ok: true,
    marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
    package: claimedPackage,
    summary: summarizePantavionWorkPackageQueue(),
  };
}

export function completePantavionWorkPackage(args: {
  readonly packageId: string;
  readonly sourceRunId?: string;
}): PantavionClaimWorkPackageResult {
  const queue = loadPantavionWorkPackageQueue();
  const pkg = queue.packages.find((candidate) => candidate.id === args.packageId);

  if (!pkg) {
    return {
      ok: false,
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      reason: "Work package not found.",
      summary: summarizePantavionWorkPackageQueue(),
    };
  }

  if (pkg.lockId) {
    releasePantavionThreadLock({
      lockId: pkg.lockId,
      ownerId: pkg.ownerId,
      sourceRunId: args.sourceRunId,
    });
  }

  const completedPackage: PantavionWorkPackage = {
    ...pkg,
    state: "completed",
    completedAt: nowIso(),
    updatedAt: nowIso(),
  };

  const nextQueue = updatePackage(queue, pkg.id, () => completedPackage);
  savePantavionWorkPackageQueue(nextQueue);

  appendPantavionRuntimeLedgerEvent({
    runId: args.sourceRunId,
    eventType: "audit_passed",
    severity: "info",
    kernelFamily: "Pantavion Autonomous Work Package Coordinator",
    message: "Autonomous work package completed.",
    protectedDomains: pkg.protectedDomains,
    metadata: {
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      packageId: pkg.id,
    },
  });

  return {
    ok: true,
    marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
    package: completedPackage,
    summary: summarizePantavionWorkPackageQueue(),
  };
}

export function failPantavionWorkPackage(args: {
  readonly packageId: string;
  readonly reason: string;
  readonly sourceRunId?: string;
}): PantavionClaimWorkPackageResult {
  const queue = loadPantavionWorkPackageQueue();
  const pkg = queue.packages.find((candidate) => candidate.id === args.packageId);

  if (!pkg) {
    return {
      ok: false,
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      reason: "Work package not found.",
      summary: summarizePantavionWorkPackageQueue(),
    };
  }

  const nextState: PantavionWorkPackageState =
    pkg.attempts >= pkg.maxAttempts ? "quarantined" : "failed";

  const failedPackage: PantavionWorkPackage = {
    ...pkg,
    state: nextState,
    failedAt: nowIso(),
    updatedAt: nowIso(),
    failureReason: args.reason,
  };

  const nextQueue = updatePackage(queue, pkg.id, () => failedPackage);
  savePantavionWorkPackageQueue(nextQueue);

  appendPantavionRuntimeLedgerEvent({
    runId: args.sourceRunId,
    eventType: "error_recorded",
    severity: nextState === "quarantined" ? "critical" : "error",
    kernelFamily: "Pantavion Autonomous Work Package Coordinator",
    message:
      nextState === "quarantined"
        ? "Autonomous work package quarantined after repeated failures."
        : "Autonomous work package failed and is available for repair/retry.",
    protectedDomains: pkg.protectedDomains,
    metadata: {
      marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
      packageId: pkg.id,
      reason: args.reason,
      state: nextState,
    },
  });

  return {
    ok: true,
    marker: "pantavion_autonomous_work_package_coordinator_c9e_v1",
    package: failedPackage,
    summary: summarizePantavionWorkPackageQueue(),
  };
}

export function summarizePantavionWorkPackageQueue() {
  const queue = loadPantavionWorkPackageQueue();

  const byState = queue.packages.reduce<Record<string, number>>((acc, pkg) => {
    acc[pkg.state] = (acc[pkg.state] ?? 0) + 1;
    return acc;
  }, {});

  const byPriority = queue.packages.reduce<Record<string, number>>((acc, pkg) => {
    acc[pkg.priority] = (acc[pkg.priority] ?? 0) + 1;
    return acc;
  }, {});

  const byCapabilityFamily = queue.packages.reduce<Record<string, number>>((acc, pkg) => {
    acc[pkg.capabilityFamily] = (acc[pkg.capabilityFamily] ?? 0) + 1;
    return acc;
  }, {});

  const claimable = queue.packages.filter((pkg) => {
    return (
      (pkg.state === "pending" || pkg.state === "failed") &&
      pkg.attempts < pkg.maxAttempts &&
      dependenciesSatisfied(pkg, queue)
    );
  });

  return {
    ok: true,
    marker: "pantavion_autonomous_work_package_summary_c9e_v1",
    updatedAt: queue.updatedAt,
    totalPackages: queue.packages.length,
    claimablePackages: claimable.length,
    pendingPackages: queue.packages.filter((pkg) => pkg.state === "pending").length,
    claimedPackages: queue.packages.filter((pkg) => pkg.state === "claimed").length,
    blockedPackages: queue.packages.filter((pkg) => pkg.state === "blocked").length,
    failedPackages: queue.packages.filter((pkg) => pkg.state === "failed").length,
    quarantinedPackages: queue.packages.filter((pkg) => pkg.state === "quarantined").length,
    completedPackages: queue.packages.filter((pkg) => pkg.state === "completed").length,
    protectedPackages: queue.packages.filter((pkg) => pkg.protectedDomains.length > 0).length,
    byState,
    byPriority,
    byCapabilityFamily,
    nextClaimable: claimable
      .sort((a, b) => {
        const priorityDelta = priorityWeight(a.priority) - priorityWeight(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return a.createdAt.localeCompare(b.createdAt);
      })
      .slice(0, 10),
    lastPackages: queue.packages.slice(-20),
  };
}

export const pantavion_autonomous_work_package_coordinator_marker_v1 =
  "pantavion_autonomous_work_package_coordinator_c9e_v1";
