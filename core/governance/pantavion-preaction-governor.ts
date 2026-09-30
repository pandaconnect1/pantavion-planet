export type PantavionPreActionDecision =
  | "GO"
  | "CONFLICT"
  | "STOP"
  | "OVERRIDE_BY_FOUNDER";

export type PantavionPreActionKind =
  | "github_mutation"
  | "railway_mutation"
  | "vercel_mutation"
  | "dns_change"
  | "water_map_change"
  | "deployment"
  | "provider_switch"
  | "data_migration"
  | "security_policy_change"
  | "read_only";

export type PantavionPreActionInput = {
  actionKind: PantavionPreActionKind;
  target: string;
  reason: string;
  expectedOutcome: string;
  relevantFounderDirectiveIds: string[];
  evidence: string[];
  proposedProvider?: string | null;
  affectsWaterMaps?: boolean;
  disablesAuthorizedFounderAdminAccess?: boolean;
  repeatsKnownFailedLoop?: boolean;
  conflictsWithLatestFounderDirective?: boolean;
  latestFounderDirectiveExplicitlyOverridesOlderRule?: boolean;
};

export type PantavionPreActionResult = {
  decision: PantavionPreActionDecision;
  allowed: boolean;
  reasons: string[];
  founderDirectiveWins: boolean;
  requiresEvidenceAfterExecution: boolean;
};

const MUTATIONS = new Set<PantavionPreActionKind>([
  "github_mutation",
  "railway_mutation",
  "vercel_mutation",
  "dns_change",
  "water_map_change",
  "deployment",
  "provider_switch",
  "data_migration",
  "security_policy_change",
]);

export function evaluatePantavionPreAction(
  input: PantavionPreActionInput,
): PantavionPreActionResult {
  const reasons: string[] = [];

  if (input.latestFounderDirectiveExplicitlyOverridesOlderRule) {
    return {
      decision: "OVERRIDE_BY_FOUNDER",
      allowed: true,
      reasons: ["Latest explicit Founder directive overrides the older rule or agent assumption."],
      founderDirectiveWins: true,
      requiresEvidenceAfterExecution: MUTATIONS.has(input.actionKind),
    };
  }

  if (input.conflictsWithLatestFounderDirective) {
    return {
      decision: "CONFLICT",
      allowed: false,
      reasons: ["Proposed action conflicts with the latest explicit Founder directive."],
      founderDirectiveWins: true,
      requiresEvidenceAfterExecution: false,
    };
  }

  if (
    input.disablesAuthorizedFounderAdminAccess ||
    (input.affectsWaterMaps &&
      /(?:disable|blocked|deny|lock)/i.test(input.expectedOutcome) &&
      !/(?:public|unauthorized|raw master)/i.test(input.expectedOutcome))
  ) {
    return {
      decision: "CONFLICT",
      allowed: false,
      reasons: [
        "Private/protected Water requirements must not disable founder/admin operational viewing, editing, approval or serving.",
      ],
      founderDirectiveWins: true,
      requiresEvidenceAfterExecution: false,
    };
  }

  if (input.repeatsKnownFailedLoop) {
    return {
      decision: "STOP",
      allowed: false,
      reasons: ["Action repeats a known failed loop without new evidence."],
      founderDirectiveWins: false,
      requiresEvidenceAfterExecution: false,
    };
  }

  if (
    input.actionKind === "vercel_mutation" ||
    input.proposedProvider?.toLowerCase() === "vercel"
  ) {
    return {
      decision: "STOP",
      allowed: false,
      reasons: [
        "Current Founder policy keeps Vercel out of the active critical recovery/deployment path until explicitly re-enabled.",
      ],
      founderDirectiveWins: true,
      requiresEvidenceAfterExecution: false,
    };
  }

  if (
    MUTATIONS.has(input.actionKind) &&
    input.relevantFounderDirectiveIds.length === 0
  ) {
    reasons.push("Covered mutation has no linked Founder directive.");
  }

  if (MUTATIONS.has(input.actionKind) && input.evidence.length === 0) {
    reasons.push("Covered mutation has no supporting evidence.");
  }

  if (!input.target.trim()) reasons.push("Target is missing.");
  if (!input.reason.trim()) reasons.push("Reason is missing.");
  if (!input.expectedOutcome.trim()) reasons.push("Expected outcome is missing.");

  if (reasons.length > 0) {
    return {
      decision: "STOP",
      allowed: false,
      reasons,
      founderDirectiveWins: false,
      requiresEvidenceAfterExecution: false,
    };
  }

  return {
    decision: "GO",
    allowed: true,
    reasons: ["No active Founder-directive conflict detected and required evidence is present."],
    founderDirectiveWins: false,
    requiresEvidenceAfterExecution: MUTATIONS.has(input.actionKind),
  };
}
