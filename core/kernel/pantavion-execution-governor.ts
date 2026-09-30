import type { PantavionIntake } from "../../types/pantavion";

export type PantavionExecutionMode =
  | "research"
  | "expert"
  | "viral"
  | "prompt-engineer"
  | "strategy";

export type PantavionGovernorDecision =
  | "ALLOW"
  | "ALLOW_WITH_WARNINGS"
  | "HARD_STOP";

export interface PantavionExecutionEvidence {
  kind: string;
  reference: string;
  verified?: boolean;
}

export interface PantavionGovernorExecutionInput {
  founderDirective: string;
  objective: string;
  proposedAction: string;
  modes?: PantavionExecutionMode[];
  targetProvider?: string;
  targetResource?: string;
  mutationIntent?: "read" | "write" | "deploy" | "delete" | "route" | "publish";
  completionClaim?: boolean;
  evidence?: PantavionExecutionEvidence[];
  constraints?: string[];
  completionGate?: string[];
  priorFailedActionFingerprints?: string[];
  proposedActionFingerprint?: string;
  newEvidenceFingerprint?: string;
  publicContentTask?: boolean;
  explicitFounderOverrides?: {
    reenableVercel?: boolean;
    modifyMapAOriginal?: boolean;
  };
}

export interface PantavionGovernorModePlan {
  mode: PantavionExecutionMode;
  applied: boolean;
  requirements: string[];
}

export interface PantavionGovernorGuardResult {
  decision: PantavionGovernorDecision;
  blockers: string[];
  warnings: string[];
  requiredNextActions: string[];
  modePlan: PantavionGovernorModePlan[];
  executionContract: {
    founderDirective: string;
    objective: string;
    constraints: string[];
    completionGate: string[];
  };
}

const DEFAULT_MODES: PantavionExecutionMode[] = [
  "prompt-engineer",
  "research",
  "expert",
  "strategy",
];

const BASE_CONSTRAINTS = [
  "Latest explicit Founder directive wins.",
  "ChatGPT executes; Pantavion is the Governor/watchdog.",
  "No DONE/LIVE/SUCCESS/VERIFIED_LIVE without matching verification evidence.",
  "Do not repeat a previously failed action without new evidence.",
  "ZERO DELETE until independent verified recovery exists.",
  "Never expose secrets.",
  "Vercel is founder-blocked unless the Founder explicitly re-enables it.",
  "Do not modify authentic Map A source/geometry to solve access, routing or serving faults.",
];

const BASE_COMPLETION_GATE = [
  "Requested change is implemented.",
  "Required checks pass.",
  "Target runtime/deployment is verified when relevant.",
  "Evidence is attached to the execution record.",
  "No known blocker or skipped step remains.",
];

function normalized(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function evidenceIsVerified(evidence: PantavionExecutionEvidence[] | undefined) {
  return Boolean(
    evidence?.some(
      (item) => item.reference.trim().length > 0 && item.verified !== false,
    ),
  );
}

function modePlan(
  requestedModes: PantavionExecutionMode[] | undefined,
  publicContentTask: boolean,
): PantavionGovernorModePlan[] {
  const modes = unique(requestedModes?.length ? requestedModes : DEFAULT_MODES);

  return modes.map((mode) => {
    if (mode === "research") {
      return {
        mode,
        applied: true,
        requirements: [
          "Collect relevant source/runtime evidence before changing direction.",
          "Separate verified facts from assumptions.",
          "Record unresolved evidence gaps.",
        ],
      };
    }

    if (mode === "expert") {
      return {
        mode,
        applied: true,
        requirements: [
          "Use domain-specific technical reasoning.",
          "Prefer root-cause diagnosis over symptom-driven provider changes.",
          "Require verification before protected production mutation.",
        ],
      };
    }

    if (mode === "prompt-engineer") {
      return {
        mode,
        applied: true,
        requirements: [
          "Preserve the exact Founder objective.",
          "Extract non-negotiable constraints before execution.",
          "Define an evidence-backed completion gate.",
        ],
      };
    }

    if (mode === "strategy") {
      return {
        mode,
        applied: true,
        requirements: [
          "Choose the shortest evidence-backed path to the objective.",
          "Do not open a new workstream while a higher-priority blocker remains unless required.",
          "Return to the last verified checkpoint after a failed loop.",
        ],
      };
    }

    return {
      mode,
      applied: publicContentTask,
      requirements: publicContentTask
        ? [
            "Optimize public communication for clarity and reach without weakening factual accuracy.",
            "Never let promotional framing override technical truth or verification.",
          ]
        : [
            "Viral mode is not applied to technical, security, infrastructure, or production decisions.",
          ],
    };
  });
}

export function buildPantavionExecutionContract(
  input: PantavionGovernorExecutionInput,
) {
  return {
    founderDirective: input.founderDirective.trim(),
    objective: input.objective.trim(),
    constraints: unique([
      ...BASE_CONSTRAINTS,
      ...(input.constraints || []).map((item) => item.trim()).filter(Boolean),
    ]),
    completionGate: unique([
      ...BASE_COMPLETION_GATE,
      ...(input.completionGate || []).map((item) => item.trim()).filter(Boolean),
    ]),
  };
}

export function evaluatePantavionGovernorGuard(
  input: PantavionGovernorExecutionInput,
): PantavionGovernorGuardResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const requiredNextActions: string[] = [];
  const contract = buildPantavionExecutionContract(input);

  if (!contract.founderDirective) {
    blockers.push("missing_founder_directive");
  }

  if (!contract.objective) {
    blockers.push("missing_locked_objective");
  }

  if (!input.proposedAction.trim()) {
    blockers.push("missing_proposed_action");
  }

  const provider = normalized(input.targetProvider);
  const targetResource = normalized(input.targetResource);
  const mutationIntent = input.mutationIntent || "read";

  if (
    provider === "vercel" &&
    !input.explicitFounderOverrides?.reenableVercel
  ) {
    blockers.push("vercel_founder_blocked");
    requiredNextActions.push(
      "Keep Vercel outside the active recovery/builder/verifier/deployment critical path.",
    );
  }

  const mutatesMapA =
    targetResource.includes("map a") ||
    targetResource.includes("map-a") ||
    targetResource.includes("water_map_a") ||
    targetResource.includes("water map a");

  if (
    mutatesMapA &&
    mutationIntent !== "read" &&
    !input.explicitFounderOverrides?.modifyMapAOriginal
  ) {
    blockers.push("map_a_original_mutation_forbidden");
    requiredNextActions.push(
      "Diagnose access/routing/serving and leave authentic Map A source geometry unchanged.",
    );
  }

  if (input.completionClaim && !evidenceIsVerified(input.evidence)) {
    blockers.push("completion_claim_without_verified_evidence");
    requiredNextActions.push(
      "Keep the work IN_PROGRESS or BLOCKED until verification evidence exists.",
    );
  }

  const repeatedAction =
    Boolean(input.proposedActionFingerprint) &&
    Boolean(
      input.priorFailedActionFingerprints?.includes(
        input.proposedActionFingerprint as string,
      ),
    );

  if (repeatedAction && !input.newEvidenceFingerprint) {
    blockers.push("repeated_failed_action_without_new_evidence");
    requiredNextActions.push(
      "Return to the last verified checkpoint and choose a different evidence-backed route.",
    );
  }

  if (
    input.modes?.includes("viral") &&
    !input.publicContentTask
  ) {
    warnings.push("viral_mode_ignored_for_non_public_execution");
  }

  if (
    normalized(input.targetProvider) === "supabase" &&
    mutationIntent !== "read"
  ) {
    warnings.push("supabase_is_transition_only_avoid_new_strategic_lock_in");
    requiredNextActions.push(
      "Prefer provider-neutral Pantavion contracts for new strategic implementation.",
    );
  }

  if (blockers.length === 0 && !evidenceIsVerified(input.evidence)) {
    warnings.push("execution_allowed_but_completion_not_yet_verified");
  }

  const decision: PantavionGovernorDecision =
    blockers.length > 0
      ? "HARD_STOP"
      : warnings.length > 0
        ? "ALLOW_WITH_WARNINGS"
        : "ALLOW";

  return {
    decision,
    blockers: unique(blockers),
    warnings: unique(warnings),
    requiredNextActions: unique(requiredNextActions),
    modePlan: modePlan(input.modes, Boolean(input.publicContentTask)),
    executionContract: contract,
  };
}

export function executionInputFromPantavionIntake(
  intake: PantavionIntake,
): PantavionGovernorExecutionInput | null {
  const metadata = intake.metadata || {};
  const founderDirective =
    typeof metadata.founderDirective === "string"
      ? metadata.founderDirective
      : "";
  const objective =
    typeof metadata.lockedObjective === "string"
      ? metadata.lockedObjective
      : intake.content;
  const proposedAction =
    typeof metadata.proposedAction === "string"
      ? metadata.proposedAction
      : intake.intentHint || "";

  if (!founderDirective && !metadata.executionModes) {
    return null;
  }

  const modes = Array.isArray(metadata.executionModes)
    ? metadata.executionModes.filter(
        (value): value is PantavionExecutionMode =>
          value === "research" ||
          value === "expert" ||
          value === "viral" ||
          value === "prompt-engineer" ||
          value === "strategy",
      )
    : undefined;

  const evidence = Array.isArray(metadata.executionEvidence)
    ? metadata.executionEvidence
        .filter((value) => value && typeof value === "object")
        .map((value) => value as Record<string, unknown>)
        .filter(
          (value) =>
            typeof value.kind === "string" &&
            typeof value.reference === "string",
        )
        .map((value) => ({
          kind: String(value.kind),
          reference: String(value.reference),
          verified:
            typeof value.verified === "boolean"
              ? value.verified
              : undefined,
        }))
    : undefined;

  return {
    founderDirective,
    objective,
    proposedAction,
    modes,
    targetProvider:
      typeof metadata.targetProvider === "string"
        ? metadata.targetProvider
        : undefined,
    targetResource:
      typeof metadata.targetResource === "string"
        ? metadata.targetResource
        : undefined,
    mutationIntent:
      metadata.mutationIntent === "read" ||
      metadata.mutationIntent === "write" ||
      metadata.mutationIntent === "deploy" ||
      metadata.mutationIntent === "delete" ||
      metadata.mutationIntent === "route" ||
      metadata.mutationIntent === "publish"
        ? metadata.mutationIntent
        : undefined,
    completionClaim: metadata.completionClaim === true,
    evidence,
    constraints: Array.isArray(metadata.constraints)
      ? metadata.constraints.map(String)
      : undefined,
    completionGate: Array.isArray(metadata.completionGate)
      ? metadata.completionGate.map(String)
      : undefined,
    priorFailedActionFingerprints: Array.isArray(
      metadata.priorFailedActionFingerprints,
    )
      ? metadata.priorFailedActionFingerprints.map(String)
      : undefined,
    proposedActionFingerprint:
      typeof metadata.proposedActionFingerprint === "string"
        ? metadata.proposedActionFingerprint
        : undefined,
    newEvidenceFingerprint:
      typeof metadata.newEvidenceFingerprint === "string"
        ? metadata.newEvidenceFingerprint
        : undefined,
    publicContentTask: metadata.publicContentTask === true,
    explicitFounderOverrides: {
      reenableVercel: metadata.founderOverrideReenableVercel === true,
      modifyMapAOriginal: metadata.founderOverrideModifyMapAOriginal === true,
    },
  };
}
