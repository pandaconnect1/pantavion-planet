import type {
  PantavionAdminAlert,
  PantavionBuildRecommendation,
  PantavionGap,
  PantavionIntake,
  PantavionPriority,
  PantavionSensitivity,
  PantavionTruthZone,
} from "../../types/pantavion";

export type KernelGapSeverity = "low" | "medium" | "high" | "critical" | "material";

export interface KernelGap {
  id?: string;
  key: string;
  severity: KernelGapSeverity;
  area: string;
  category?: PantavionGap["category"] | "kernel" | "governance";
  description: string;
  message?: string;
  requiredAction: string;
  actionable?: boolean;
}

export interface KernelAlert {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message?: string;
  tags: string[];
  createdAt: string;
}

export interface KernelActorInput {
  actorId: string;
  actorType: string;
  role?: string;
  scopes: string[];
  delegatedBy?: string;
  workspaceId?: string;
  orgId?: string;
  planKey?: string;
  trustTierHint?: string;
}

export interface KernelInput {
  title: string;
  description?: string;
  inputText?: string;
  requestedOperation: string;
  requestedCapabilities: string[];
  targetPath?: string;
  targetModule?: string;
  truthPreference: PantavionTruthZone;
  memoryClass: "session" | "governed-long-term" | "ephemeral" | string;
  sensitivity: PantavionSensitivity;
  actor: KernelActorInput;
  metadata?: Record<string, unknown>;
}

export interface KernelPolicyDecision {
  disposition: "allow" | "review" | "deny";
  allowed: boolean;
  blockers: string[];
  controls: string[];
  reasons: string[];
  riskPosture: "normal" | "guarded" | "admin-only" | "restricted" | "high-stakes";
}

export interface KernelRecommendation {
  status:
    | "ready-to-build"
    | "ready-to-route"
    | "gap-close-first"
    | "blocked"
    | "review-required"
    | "approval-required";
  rationale: string;
  targetPath?: string;
  requiredChecks: string[];
  suggestedNextSteps: string[];
  nextSteps: string[];
}

export interface KernelOutput {
  id: string;
  createdAt: string;
  request: KernelInput;
  classification: {
    truthZone: PantavionTruthZone;
    sensitivity: PantavionSensitivity;
    priority: PantavionPriority;
    severity: "low" | "medium" | "high" | "critical";
  };
  policy: KernelPolicyDecision;
  recommendation: KernelRecommendation;
  gaps: KernelGap[];
  alerts: KernelAlert[];
  identity: {
    trustTier: "untrusted" | "basic" | "trusted" | "high-trust" | "system";
    approvalTier: "none" | "review" | "admin" | "security" | "executive";
  };
  decision: {
    id: string;
  };
  explainability: {
    recommendationWhy: string[];
  };
  metadata: Record<string, unknown>;
}

export interface KernelResult {
  intake: PantavionIntake;
  policy: KernelPolicyDecision;
  buildRecommendation: PantavionBuildRecommendation;
  gaps: PantavionGap[];
  alerts: PantavionAdminAlert[];
}

export interface PantavionKernelHookInput {
  request: KernelInput;
  classification: KernelOutput["classification"];
}

export interface KernelNotice {
  id?: string;
  level?: "info" | "warning" | "critical";
  title?: string;
  message?: string;
  tags?: string[];
  type?: string;
  severity?: string;
  summary?: string;
  actions?: string[];
  createdAt?: string;
}

export interface PantavionKernelHooks {
  resolveIdentityPosture?: (input: {
    actor: KernelActorInput;
    requestedOperation: string;
    sensitivity: PantavionSensitivity;
  }) => Promise<unknown> | unknown;
  memoryAwareness?: (input: PantavionKernelHookInput) => Promise<{ notes?: string[]; gaps?: KernelGap[] }> | { notes?: string[]; gaps?: KernelGap[] };
  selfMaintenance?: () => Promise<KernelNotice[]> | KernelNotice[];
  selfUpgrade?: () => Promise<KernelNotice[]> | KernelNotice[];
  selfExpansion?: () => Promise<KernelNotice[]> | KernelNotice[];
}

export interface PantavionKernel0Coordinator {
  process(input: KernelInput): Promise<KernelOutput>;
  getSnapshot(): {
    createdAt: string;
    processedCount: number;
    lastDecisionId?: string;
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSeverity(value: KernelGapSeverity): PantavionGap["severity"] {
  return value === "material" ? "high" : value;
}

function toKernelAlert(value: unknown): KernelAlert {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: typeof record.id === "string" ? record.id : createId("alert"),
    level:
      record.severity === "critical"
        ? "critical"
        : record.severity === "high"
          ? "warning"
          : "info",
    title: typeof record.type === "string" ? record.type : "kernel-notice",
    message: typeof record.summary === "string" ? record.summary : "Kernel notice.",
    tags: Array.isArray(record.actions) ? record.actions.map(String) : ["kernel"],
    createdAt: nowIso(),
  };
}

function classify(input: KernelInput): KernelOutput["classification"] {
  return {
    truthZone: input.truthPreference ?? "deterministic",
    sensitivity: input.sensitivity ?? "internal",
    priority: input.sensitivity === "critical" || input.sensitivity === "restricted" ? "critical" : "normal",
    severity: input.sensitivity === "critical" || input.sensitivity === "restricted" ? "critical" : input.sensitivity === "confidential" ? "high" : "medium",
  };
}

function evaluatePolicy(input: KernelInput, gaps: KernelGap[]): KernelPolicyDecision {
  const blockers: string[] = [];

  if (!input.actor?.actorId) blockers.push("missing_actor_id");
  if (input.sensitivity === "critical" && input.truthPreference === "generative") {
    blockers.push("critical_generative_not_allowed");
  }

  if (blockers.length > 0) {
    return {
      disposition: "deny",
      allowed: false,
      blockers,
      controls: ["founder-review-required"],
      reasons: blockers,
      riskPosture: "restricted",
    };
  }

  const hasCriticalGap = gaps.some((gap) => gap.severity === "critical");

  return {
    disposition: hasCriticalGap || input.sensitivity === "restricted" ? "review" : "allow",
    allowed: !hasCriticalGap,
    blockers: [],
    controls: input.sensitivity === "restricted" ? ["founder-review-required"] : ["audit-required"],
    reasons: hasCriticalGap ? ["critical-gap-detected"] : [],
    riskPosture: input.sensitivity === "restricted" ? "admin-only" : input.sensitivity === "critical" ? "high-stakes" : hasCriticalGap ? "guarded" : "normal",
  };
}

function recommend(input: KernelInput, policy: KernelPolicyDecision, gaps: KernelGap[]): KernelRecommendation {
  if (policy.disposition === "deny") {
    return {
      status: "blocked",
      rationale: "Kernel policy denied this request.",
      targetPath: input.targetPath,
      requiredChecks: ["policy-review"],
      suggestedNextSteps: ["Resolve policy blockers before continuing."],
      nextSteps: ["Resolve policy blockers before continuing."],
    };
  }

  if (gaps.some((gap) => gap.severity === "critical" || gap.severity === "material")) {
    return {
      status: "gap-close-first",
      rationale: "Kernel detected gaps that must be closed before build or route activation.",
      targetPath: input.targetPath,
      requiredChecks: ["gap-review", "audit"],
      suggestedNextSteps: gaps.map((gap) => gap.requiredAction),
      nextSteps: gaps.map((gap) => gap.requiredAction),
    };
  }

  return {
    status: input.requestedOperation === "route" ? "ready-to-route" : "ready-to-build",
    rationale: "Kernel baseline permits controlled next step.",
    targetPath: input.targetPath,
    requiredChecks: ["audit", "build", "typescript"],
    suggestedNextSteps: ["Proceed with scoped implementation and proof checks."],
    nextSteps: ["Proceed with scoped implementation and proof checks."],
  };
}

export function createKernel0Coordinator(
  options: { hooks?: PantavionKernelHooks } = {},
  _runtimeConfig: Record<string, unknown> = {},
): PantavionKernel0Coordinator {
  void _runtimeConfig;
  let processedCount = 0;
  let lastDecisionId: string | undefined;

  return {
    async process(input: KernelInput): Promise<KernelOutput> {
      processedCount += 1;

      const classification = classify(input);
      const gaps: KernelGap[] = [];
      const alerts: KernelAlert[] = [];

      if (options.hooks?.resolveIdentityPosture) {
        await options.hooks.resolveIdentityPosture({
          actor: input.actor,
          requestedOperation: input.requestedOperation,
          sensitivity: input.sensitivity,
        });
      }

      if (options.hooks?.memoryAwareness) {
        const memory = await options.hooks.memoryAwareness({ request: input, classification });
        if (memory?.gaps?.length) gaps.push(...memory.gaps);
      }

      for (const hookName of ["selfMaintenance", "selfUpgrade", "selfExpansion"] as const) {
        const hook = options.hooks?.[hookName];
        if (!hook) continue;
        const hookAlerts = await hook();
        alerts.push(...hookAlerts.map(toKernelAlert));
      }

      const policy = evaluatePolicy(input, gaps);
      const recommendation = recommend(input, policy, gaps);
      const id = createId("kernel");
      lastDecisionId = id;
      const identity: KernelOutput["identity"] = {
        trustTier:
          input.actor.trustTierHint === "untrusted" ||
          input.actor.trustTierHint === "basic" ||
          input.actor.trustTierHint === "trusted" ||
          input.actor.trustTierHint === "high-trust" ||
          input.actor.trustTierHint === "system"
            ? input.actor.trustTierHint
            : "trusted",
        approvalTier:
          input.sensitivity === "restricted" || input.sensitivity === "critical"
            ? "security"
            : "review",
      };

      return {
        id,
        createdAt: nowIso(),
        request: input,
        classification,
        policy,
        recommendation,
        identity,
        decision: { id },
        explainability: {
          recommendationWhy: [recommendation.rationale],
        },
        gaps: gaps.map((gap) => ({
          ...gap,
          id: gap.id ?? gap.key,
          category: gap.category ?? "kernel",
          message: gap.message ?? gap.description,
          actionable: gap.actionable ?? true,
        })),
        alerts,
        metadata: {
          processedCount,
          kernel: "pantavion-kernel0-compat-v1",
        },
      };
    },

    getSnapshot() {
      return {
        createdAt: nowIso(),
        processedCount,
        lastDecisionId,
      };
    },
  };
}

export function processKernelIntake(intake: PantavionIntake): KernelResult {
  const gaps: PantavionGap[] = [];
  const blockers: string[] = [];

  if (!intake.id) blockers.push("missing_intake_id");
  if (!intake.content?.trim()) blockers.push("missing_intake_content");

  if (intake.truthZone === "generative" && intake.sensitivity === "critical") {
    blockers.push("critical_generative_not_allowed");
  }

  const policy: KernelPolicyDecision = {
    disposition: blockers.length > 0 ? "deny" : "allow",
    allowed: blockers.length === 0,
    blockers,
    controls: ["audit-required"],
    reasons: blockers,
    riskPosture: blockers.length > 0 ? "restricted" : "normal",
  };

  const buildRecommendation: PantavionBuildRecommendation = {
    mode: policy.allowed ? "register-and-build" : "blocked",
    rationale: policy.allowed
      ? "Kernel intake accepted for scoped build flow."
      : "Kernel intake blocked by policy.",
    targetPath: intake.metadata?.targetPath ? String(intake.metadata.targetPath) : undefined,
    requiredChecks: ["audit", "build", "typescript"],
    suggestedNextSteps: policy.allowed
      ? ["Proceed with scoped implementation."]
      : ["Resolve blockers before proceeding."],
  };

  const alerts: PantavionAdminAlert[] = blockers.map((blocker) => ({
    id: createId("admin_alert"),
    level: "critical",
    title: "Kernel intake blocker",
    message: blocker,
    tags: ["kernel", "policy"],
    createdAt: nowIso(),
  }));

  return {
    intake,
    policy,
    buildRecommendation,
    gaps: gaps.map((gap) => ({
      ...gap,
      severity: normalizeSeverity(gap.severity as KernelGapSeverity),
    })),
    alerts,
  };
}
