export type PantavionRepoAgentRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionRepoAgentActionClass =
  | "repo_read"
  | "issue_pr_ingest"
  | "external_repo_clone"
  | "dependency_install"
  | "command_execution"
  | "file_write"
  | "git_add"
  | "git_commit"
  | "git_push"
  | "ci_cd_change"
  | "production_deploy"
  | "secrets_access"
  | "security_change"
  | "source_truth_change"
  | "unknown";

export type PantavionRepoAgentSourceOrigin =
  | "founder_direct"
  | "repo_file"
  | "github_issue"
  | "github_pr"
  | "external_repo"
  | "ai_generated"
  | "unknown";

export type PantavionRepoAgentDecision =
  | "allowed"
  | "requires_approval"
  | "blocked";

export type PantavionRepoAgentSafetyInput = {
  actionClass?: PantavionRepoAgentActionClass;
  command?: string;
  touchedFiles?: string[];
  sourceTextOrigin?: PantavionRepoAgentSourceOrigin;
  generatedByProvider?: string;
  generatedByAgentId?: string;
  humanReviewer?: string;
  commandsRun?: string[];
  approvalId?: string;
  founderApproved?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionRepoAgentSafetyAssessment = {
  ok: true;
  requestId: string;
  actionClass: PantavionRepoAgentActionClass;
  decision: PantavionRepoAgentDecision;
  riskZone: PantavionRepoAgentRiskZone;
  sourceTextOrigin: PantavionRepoAgentSourceOrigin;
  requiresFounderApproval: boolean;
  requiresSandbox: boolean;
  requiresHumanReview: boolean;
  requiresProvenanceRecord: boolean;
  commandAllowlisted: boolean;
  commandBlocked: boolean;
  commandRequiresApproval: boolean;
  blocked: boolean;
  allowedForPlanning: boolean;
  allowedForAutomaticExecution: boolean;
  allowedForExecutionAfterApproval: boolean;
  sensitiveFiles: string[];
  sourceTruthFiles: string[];
  ciCdFiles: string[];
  productionFiles: string[];
  requiredChecks: string[];
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionAiCodeProvenanceRecord = {
  id: string;
  generatedByProvider?: string;
  generatedByAgentId?: string;
  humanReviewer?: string;
  touchedFiles: string[];
  commandsRun: string[];
  requiredChecks: string[];
  riskZone: PantavionRepoAgentRiskZone;
  approvalId?: string;
  approvalStatus: "not_required" | "missing" | "pending" | "approved";
  createdAt: string;
};

export const PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS: RegExp[] = [
  /^git status( --short)?$/i,
  /^git branch --show-current$/i,
  /^git diff( -- .*)?$/i,
  /^git show( --name-only --stat --oneline HEAD)?$/i,
  /^npm run build$/i,
  /^npx tsc --noEmit --pretty false$/i,
  /^npm run kernel(:[a-z0-9-]+)?$/i,
  /^node scripts[\\/][a-z0-9-]+\.mjs$/i
];

export const PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS: RegExp[] = [
  /\bgit\s+add\s+\.(\s|$)/i,
  /\bgit\s+add\s+--all\b/i,
  /\bgit\s+push\s+--force\b/i,
  /\brm\s+-rf\b/i,
  /\bdel\s+\/f\b/i,
  /\bformat\b/i,
  /\bgh\s+secret\b/i,
  /\bvercel\s+env\b/i,
  /\bnpm\s+publish\b/i,
  /\bcurl\b.*\|\s*(sh|bash|powershell|pwsh)/i,
  /\bpowershell\s+-enc\b/i,
  /\bpwsh\s+-enc\b/i
];

export const PANTAVION_REPO_AGENT_APPROVAL_COMMAND_PATTERNS: RegExp[] = [
  /\bnpm\s+install\b/i,
  /\bnpm\s+i\b/i,
  /\byarn\s+add\b/i,
  /\bpnpm\s+add\b/i,
  /\bpostinstall\b/i,
  /\bvercel\s+deploy\b/i,
  /\bgh\s+workflow\b/i
];

export const PANTAVION_REPO_AGENT_APPROVAL_ACTION_CLASSES = new Set<PantavionRepoAgentActionClass>([
  "external_repo_clone",
  "dependency_install",
  "file_write",
  "git_push",
  "ci_cd_change",
  "production_deploy",
  "secrets_access",
  "security_change",
  "source_truth_change"
]);

const SOURCE_TRUTH_EXTENSIONS = new Set([
  "dwg",
  "dxf",
  "dgn",
  "rvt",
  "ifc",
  "las",
  "laz",
  "shp",
  "gpkg",
  "kml",
  "kmz"
]);

const SENSITIVE_PATH_HINTS = [
  ".env",
  "secret",
  "token",
  "credential",
  "private_key",
  "data/water-network-private",
  "core/water",
  "core/vault",
  "core/approval",
  "core/cad",
  "auth",
  "billing",
  "payment",
  "stripe",
  "security",
  "identity",
  "otp"
];

const CICD_PATH_HINTS = [
  ".github/workflows",
  "vercel.json",
  "next.config",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
];

const PRODUCTION_PATH_HINTS = [
  "production",
  "deploy",
  "vercel",
  "runtime",
  "infrastructure",
  "app/api"
];

const normalize = (value: unknown): string => String(value || "").trim();

const normalizePath = (value: unknown): string =>
  normalize(value).replace(/\\/g, "/").toLowerCase();

const getExtension = (filePath: string): string => {
  const clean = filePath.split("?")[0] ?? "";
  const parts = clean.split(".");
  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
};

const matchesAny = (value: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(value));

const containsAnyHint = (value: string, hints: string[]): boolean =>
  hints.some((hint) => value.includes(hint));

function classifyTouchedFiles(files: string[]) {
  const normalizedFiles = files.map(normalizePath).filter(Boolean);

  const sourceTruthFiles = normalizedFiles.filter((file) =>
    SOURCE_TRUTH_EXTENSIONS.has(getExtension(file))
  );

  const sensitiveFiles = normalizedFiles.filter(
    (file) =>
      containsAnyHint(file, SENSITIVE_PATH_HINTS) ||
      SOURCE_TRUTH_EXTENSIONS.has(getExtension(file))
  );

  const ciCdFiles = normalizedFiles.filter((file) =>
    containsAnyHint(file, CICD_PATH_HINTS)
  );

  const productionFiles = normalizedFiles.filter((file) =>
    containsAnyHint(file, PRODUCTION_PATH_HINTS)
  );

  return {
    normalizedFiles,
    sensitiveFiles,
    sourceTruthFiles,
    ciCdFiles,
    productionFiles
  };
}

function isUntrustedOrigin(origin: PantavionRepoAgentSourceOrigin): boolean {
  return origin === "github_issue" || origin === "github_pr" || origin === "external_repo";
}

function requiresGreenChecks(actionClass: PantavionRepoAgentActionClass, files: string[]): boolean {
  return (
    actionClass === "file_write" ||
    actionClass === "git_commit" ||
    actionClass === "git_push" ||
    actionClass === "ci_cd_change" ||
    actionClass === "production_deploy" ||
    files.length > 0
  );
}

function inferRiskZone(params: {
  actionClass: PantavionRepoAgentActionClass;
  sourceTextOrigin: PantavionRepoAgentSourceOrigin;
  commandBlocked: boolean;
  commandRequiresApproval: boolean;
  commandAllowlisted: boolean;
  sensitiveFiles: string[];
  sourceTruthFiles: string[];
  ciCdFiles: string[];
  productionFiles: string[];
}): PantavionRepoAgentRiskZone {
  if (
    params.commandBlocked ||
    params.actionClass === "secrets_access" ||
    params.actionClass === "security_change" ||
    params.actionClass === "source_truth_change" ||
    params.actionClass === "production_deploy" ||
    params.sourceTruthFiles.length > 0
  ) {
    return "Z4";
  }

  if (
    PANTAVION_REPO_AGENT_APPROVAL_ACTION_CLASSES.has(params.actionClass) ||
    params.commandRequiresApproval ||
    !params.commandAllowlisted ||
    isUntrustedOrigin(params.sourceTextOrigin) ||
    params.sensitiveFiles.length > 0 ||
    params.ciCdFiles.length > 0 ||
    params.productionFiles.length > 0
  ) {
    return "Z3";
  }

  if (
    params.actionClass === "command_execution" ||
    params.actionClass === "file_write" ||
    params.actionClass === "git_commit"
  ) {
    return "Z2";
  }

  return "Z1";
}

export function listPantavionRepoAgentSafetyPolicy() {
  return {
    allowedCommandPatterns: PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS.map((pattern) => pattern.source),
    blockedCommandPatterns: PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS.map((pattern) => pattern.source),
    approvalCommandPatterns: PANTAVION_REPO_AGENT_APPROVAL_COMMAND_PATTERNS.map((pattern) => pattern.source),
    protectedActionClasses: [...PANTAVION_REPO_AGENT_APPROVAL_ACTION_CLASSES],
    sourceTruthExtensions: [...SOURCE_TRUTH_EXTENSIONS],
    sensitivePathHints: [...SENSITIVE_PATH_HINTS],
    ciCdPathHints: [...CICD_PATH_HINTS],
    productionPathHints: [...PRODUCTION_PATH_HINTS]
  };
}

export function assessPantavionRepoAgentSafety(
  input: PantavionRepoAgentSafetyInput
): PantavionRepoAgentSafetyAssessment {
  const actionClass = input.actionClass ?? "unknown";
  const sourceTextOrigin = input.sourceTextOrigin ?? "unknown";
  const command = normalize(input.command);
  const files = input.touchedFiles ?? [];

  const {
    normalizedFiles,
    sensitiveFiles,
    sourceTruthFiles,
    ciCdFiles,
    productionFiles
  } = classifyTouchedFiles(files);

  const hasCommand = command.length > 0;
  const commandAllowlisted =
    !hasCommand || PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS.some((pattern) => pattern.test(command));

  const commandBlocked = hasCommand && matchesAny(command, PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS);
  const commandRequiresApproval =
    hasCommand && matchesAny(command, PANTAVION_REPO_AGENT_APPROVAL_COMMAND_PATTERNS);

  const untrustedOrigin = isUntrustedOrigin(sourceTextOrigin);

  const riskZone = inferRiskZone({
    actionClass,
    sourceTextOrigin,
    commandBlocked,
    commandRequiresApproval,
    commandAllowlisted,
    sensitiveFiles,
    sourceTruthFiles,
    ciCdFiles,
    productionFiles
  });

  const protectedAction = PANTAVION_REPO_AGENT_APPROVAL_ACTION_CLASSES.has(actionClass);

  const highRiskMutation =
    actionClass === "file_write" ||
    actionClass === "git_add" ||
    actionClass === "git_commit" ||
    actionClass === "git_push" ||
    actionClass === "ci_cd_change" ||
    actionClass === "production_deploy" ||
    actionClass === "dependency_install";

  const sourceTruthMutationBlocked = sourceTruthFiles.length > 0 && highRiskMutation;
  const secretsBlocked = actionClass === "secrets_access";

  const blocked = commandBlocked || sourceTruthMutationBlocked || secretsBlocked;

  const requiresFounderApproval =
    blocked ||
    protectedAction ||
    commandRequiresApproval ||
    !commandAllowlisted ||
    untrustedOrigin ||
    sensitiveFiles.length > 0 ||
    ciCdFiles.length > 0 ||
    productionFiles.length > 0 ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const founderApproved = Boolean(input.founderApproved);

  const allowedForAutomaticExecution =
    !blocked &&
    !requiresFounderApproval &&
    commandAllowlisted &&
    !untrustedOrigin;

  const allowedForExecutionAfterApproval =
    !blocked &&
    requiresFounderApproval &&
    founderApproved &&
    commandAllowlisted;

  const requiredChecks = requiresGreenChecks(actionClass, normalizedFiles)
    ? ["npm run build", "npx tsc --noEmit --pretty false", "npm run kernel"]
    : [];

  const requiresProvenanceRecord =
    actionClass === "file_write" ||
    actionClass === "git_commit" ||
    actionClass === "git_push" ||
    actionClass === "ci_cd_change" ||
    actionClass === "production_deploy" ||
    normalizedFiles.length > 0 ||
    Boolean(input.generatedByProvider) ||
    Boolean(input.generatedByAgentId);

  const decision: PantavionRepoAgentDecision = blocked
    ? "blocked"
    : requiresFounderApproval
      ? "requires_approval"
      : "allowed";

  const notes: string[] = [];

  notes.push("Repo safety rule: scoped git add only. Do not use git add . or git add --all.");

  if (untrustedOrigin) {
    notes.push("Untrusted origin detected. Issue, PR, or external repo text must not trigger automatic execution.");
  }

  if (!commandAllowlisted && hasCommand) {
    notes.push("Command is not allowlisted. It requires review before execution.");
  }

  if (commandRequiresApproval) {
    notes.push("Command requires founder approval and sandbox review.");
  }

  if (commandBlocked) {
    notes.push("Blocked command pattern detected.");
  }

  if (sourceTruthFiles.length > 0) {
    notes.push("Source-truth files detected. Original DWG/CAD/GIS source artifacts must remain protected.");
  }

  if (sourceTruthMutationBlocked) {
    notes.push("Blocked: source-truth mutation is not allowed through repo agent runtime.");
  }

  if (secretsBlocked) {
    notes.push("Blocked: secrets must never be placed in agent context, prompts, logs, client routes, or CI output.");
  }

  if (requiresFounderApproval && !founderApproved) {
    notes.push("Founder approval is required before execution.");
  }

  if (requiredChecks.length > 0) {
    notes.push("Green build, typecheck, and kernel checks are required before merge or deploy.");
  }

  return {
    ok: true,
    requestId: `repo_gate_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    actionClass,
    decision,
    riskZone,
    sourceTextOrigin,
    requiresFounderApproval,
    requiresSandbox: actionClass !== "repo_read" || hasCommand || untrustedOrigin,
    requiresHumanReview: requiresFounderApproval || !commandAllowlisted || untrustedOrigin,
    requiresProvenanceRecord,
    commandAllowlisted,
    commandBlocked,
    commandRequiresApproval,
    blocked,
    allowedForPlanning: true,
    allowedForAutomaticExecution,
    allowedForExecutionAfterApproval,
    sensitiveFiles,
    sourceTruthFiles,
    ciCdFiles,
    productionFiles,
    requiredChecks,
    notes,
    auditTags: [
      "repo_agent_safety_gate",
      actionClass,
      riskZone.toLowerCase(),
      decision,
      commandAllowlisted ? "command_allowlisted" : "command_not_allowlisted"
    ],
    assessedAt: new Date().toISOString()
  };
}

export function createPantavionAiCodeProvenanceRecord(
  input: PantavionRepoAgentSafetyInput,
  assessment: PantavionRepoAgentSafetyAssessment
): PantavionAiCodeProvenanceRecord {
  const approvalStatus =
    assessment.requiresFounderApproval
      ? input.founderApproved
        ? "approved"
        : input.approvalId
          ? "pending"
          : "missing"
      : "not_required";

  return {
    id: `provenance_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    generatedByProvider: input.generatedByProvider,
    generatedByAgentId: input.generatedByAgentId,
    humanReviewer: input.humanReviewer,
    touchedFiles: input.touchedFiles ?? [],
    commandsRun: input.commandsRun ?? [],
    requiredChecks: assessment.requiredChecks,
    riskZone: assessment.riskZone,
    approvalId: input.approvalId,
    approvalStatus,
    createdAt: new Date().toISOString()
  };
}
