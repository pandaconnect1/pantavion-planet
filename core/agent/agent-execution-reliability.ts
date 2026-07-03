export type PantavionAgentExecutionRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionAgentExecutionStatus =
  | "planned"
  | "ready_after_approval"
  | "blocked"
  | "captured_result";

export type PantavionAgentExecutionActionClass =
  | "safe_check"
  | "build_check"
  | "typecheck"
  | "kernel_check"
  | "file_write"
  | "repo_change"
  | "dependency_install"
  | "external_repo"
  | "ci_cd"
  | "deploy"
  | "secret_sensitive"
  | "source_truth_sensitive"
  | "unknown";

export type PantavionAgentCommandResultStatus =
  | "not_run"
  | "success"
  | "failed"
  | "timed_out"
  | "cancelled";

export type PantavionAgentExecutionReliabilityInput = {
  actionClass?: PantavionAgentExecutionActionClass;
  command?: string;
  touchedFiles?: string[];
  timeoutMs?: number;
  maxRetries?: number;
  requiresCheckpoint?: boolean;
  requiresRollbackPlan?: boolean;
  founderApproved?: boolean;
  approvalId?: string;
  actor?: string;
  reason?: string;
  resultStatus?: PantavionAgentCommandResultStatus;
  exitCode?: number;
  durationMs?: number;
  stdoutPreview?: string;
  stderrPreview?: string;
};

export type PantavionAgentExecutionReliabilityAssessment = {
  ok: true;
  requestId: string;
  actionClass: PantavionAgentExecutionActionClass;
  status: PantavionAgentExecutionStatus;
  riskZone: PantavionAgentExecutionRiskZone;
  command: string | null;
  timeoutMs: number;
  maxRetries: number;
  requiresFounderApproval: boolean;
  requiresCheckpoint: boolean;
  requiresRollbackPlan: boolean;
  requiresResultCapture: boolean;
  requiresGreenChecks: boolean;
  secretsRedactionRequired: boolean;
  blocked: boolean;
  allowedForPlanning: boolean;
  allowedForAutomaticExecution: boolean;
  allowedForExecutionAfterApproval: boolean;
  retryPolicy: {
    retryable: boolean;
    maxRetries: number;
    backoff: "none" | "linear" | "exponential";
  };
  checkpointPlan: string[];
  rollbackPlan: string[];
  requiredChecks: string[];
  sanitizedResult?: {
    resultStatus: PantavionAgentCommandResultStatus;
    exitCode?: number;
    durationMs?: number;
    stdoutPreview?: string;
    stderrPreview?: string;
  };
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const DEFAULT_TIMEOUT_MS = 120000;
const MAX_TIMEOUT_MS = 600000;
const DEFAULT_RETRIES = 0;
const MAX_RETRIES = 3;

const normalize = (value: unknown): string => String(value || "").trim();

const normalizePath = (value: unknown): string =>
  normalize(value).replace(/\\/g, "/").toLowerCase();

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /private[_-]?key/i,
  /bearer\s+[a-z0-9._-]+/i,
  /sk-[a-z0-9]/i
];

const BLOCKED_COMMAND_PATTERNS = [
  /\bgit\s+add\s+\.(\s|$)/i,
  /\bgit\s+add\s+--all\b/i,
  /\bgit\s+push\s+--force\b/i,
  /\brm\s+-rf\b/i,
  /\bgh\s+secret\b/i,
  /\bvercel\s+env\b/i,
  /\bcurl\b.*\|\s*(sh|bash|powershell|pwsh)/i,
  /\bpowershell\s+-enc\b/i,
  /\bpwsh\s+-enc\b/i
];

const HIGH_RISK_ACTIONS = new Set<PantavionAgentExecutionActionClass>([
  "file_write",
  "repo_change",
  "dependency_install",
  "external_repo",
  "ci_cd",
  "deploy",
  "secret_sensitive",
  "source_truth_sensitive"
]);

const GREEN_CHECK_ACTIONS = new Set<PantavionAgentExecutionActionClass>([
  "file_write",
  "repo_change",
  "dependency_install",
  "ci_cd",
  "deploy"
]);

function clampNumber(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function redactSecrets(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value : undefined;
  if (!raw) {
    return undefined;
  }

  let redacted = raw.slice(0, 2000);
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }

  return redacted;
}

function hasSecretLikeText(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

function hasBlockedCommand(command: string): boolean {
  return BLOCKED_COMMAND_PATTERNS.some((pattern) => pattern.test(command));
}

function inferRiskZone(params: {
  actionClass: PantavionAgentExecutionActionClass;
  command: string;
  touchedFiles: string[];
  blockedCommand: boolean;
  secretLikeText: boolean;
}): PantavionAgentExecutionRiskZone {
  if (
    params.blockedCommand ||
    params.secretLikeText ||
    params.actionClass === "secret_sensitive" ||
    params.actionClass === "source_truth_sensitive" ||
    params.actionClass === "deploy"
  ) {
    return "Z4";
  }

  if (
    HIGH_RISK_ACTIONS.has(params.actionClass) ||
    params.touchedFiles.some((file) => file.includes(".github/") || file.includes("package.json"))
  ) {
    return "Z3";
  }

  if (
    params.actionClass === "build_check" ||
    params.actionClass === "typecheck" ||
    params.actionClass === "kernel_check"
  ) {
    return "Z1";
  }

  return "Z2";
}

export function assessPantavionAgentExecutionReliability(
  input: PantavionAgentExecutionReliabilityInput
): PantavionAgentExecutionReliabilityAssessment {
  const actionClass = input.actionClass ?? "unknown";
  const command = normalize(input.command);
  const touchedFiles = (input.touchedFiles ?? []).map(normalizePath).filter(Boolean);
  const timeoutMs = clampNumber(input.timeoutMs, DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const maxRetries = clampNumber(input.maxRetries, DEFAULT_RETRIES, MAX_RETRIES);

  const blockedCommand = command.length > 0 && hasBlockedCommand(command);
  const secretLikeText =
    hasSecretLikeText(command) ||
    hasSecretLikeText(input.stdoutPreview ?? "") ||
    hasSecretLikeText(input.stderrPreview ?? "");

  const riskZone = inferRiskZone({
    actionClass,
    command,
    touchedFiles,
    blockedCommand,
    secretLikeText
  });

  const requiresFounderApproval =
    blockedCommand ||
    secretLikeText ||
    HIGH_RISK_ACTIONS.has(actionClass) ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const requiresGreenChecks = GREEN_CHECK_ACTIONS.has(actionClass) || touchedFiles.length > 0;
  const requiresCheckpoint =
    Boolean(input.requiresCheckpoint) ||
    actionClass === "file_write" ||
    actionClass === "repo_change" ||
    actionClass === "dependency_install" ||
    actionClass === "ci_cd" ||
    actionClass === "deploy";

  const requiresRollbackPlan =
    Boolean(input.requiresRollbackPlan) ||
    requiresCheckpoint;

  const blocked = blockedCommand || secretLikeText || actionClass === "secret_sensitive";

  const founderApproved = Boolean(input.founderApproved);

  const allowedForAutomaticExecution =
    !blocked &&
    !requiresFounderApproval &&
    (actionClass === "safe_check" ||
      actionClass === "build_check" ||
      actionClass === "typecheck" ||
      actionClass === "kernel_check");

  const allowedForExecutionAfterApproval =
    !blocked && requiresFounderApproval && founderApproved;

  const requiredChecks = requiresGreenChecks
    ? ["npm run build", "npx tsc --noEmit --pretty false", "npm run kernel"]
    : [];

  const checkpointPlan = requiresCheckpoint
    ? [
        "Record git status --short before write.",
        "Record touched files before write.",
        "Avoid destructive operations.",
        "Use scoped git add only after green checks."
      ]
    : [];

  const rollbackPlan = requiresRollbackPlan
    ? [
        "Stop on first failed command.",
        "Do not continue chained execution after failure.",
        "Keep failed command, exit code, duration, and sanitized stderr in audit.",
        "Use git diff to inspect changes before any commit."
      ]
    : [];

  const resultStatus = input.resultStatus ?? "not_run";

  const sanitizedResult =
    resultStatus !== "not_run"
      ? {
          resultStatus,
          exitCode: input.exitCode,
          durationMs: input.durationMs,
          stdoutPreview: redactSecrets(input.stdoutPreview),
          stderrPreview: redactSecrets(input.stderrPreview)
        }
      : undefined;

  const retryable =
    !blocked &&
    maxRetries > 0 &&
    (actionClass === "safe_check" ||
      actionClass === "build_check" ||
      actionClass === "typecheck" ||
      actionClass === "kernel_check");

  const status: PantavionAgentExecutionStatus =
    resultStatus !== "not_run"
      ? "captured_result"
      : blocked
        ? "blocked"
        : requiresFounderApproval
          ? "ready_after_approval"
          : "planned";

  const notes: string[] = [
    "Execution reliability gate plans commands but does not bypass repo safety, vault, approval, build, typecheck, or kernel checks.",
    "Command output must be sanitized before audit."
  ];

  if (blockedCommand) {
    notes.push("Blocked command pattern detected.");
  }

  if (secretLikeText) {
    notes.push("Secret-like content detected. Do not expose secrets to prompts, logs, browser routes, or public CI output.");
  }

  if (requiresFounderApproval && !founderApproved) {
    notes.push("Founder approval is required before execution.");
  }

  if (requiresCheckpoint) {
    notes.push("Checkpoint is required before file, repo, dependency, CI/CD, or deploy actions.");
  }

  if (requiresRollbackPlan) {
    notes.push("Rollback planning is required before high-risk execution.");
  }

  if (requiredChecks.length > 0) {
    notes.push("Green build, typecheck, and kernel checks are required before merge or deployment.");
  }

  return {
    ok: true,
    requestId: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    actionClass,
    status,
    riskZone,
    command: command || null,
    timeoutMs,
    maxRetries,
    requiresFounderApproval,
    requiresCheckpoint,
    requiresRollbackPlan,
    requiresResultCapture: true,
    requiresGreenChecks,
    secretsRedactionRequired: true,
    blocked,
    allowedForPlanning: true,
    allowedForAutomaticExecution,
    allowedForExecutionAfterApproval,
    retryPolicy: {
      retryable,
      maxRetries: retryable ? maxRetries : 0,
      backoff: retryable ? "linear" : "none"
    },
    checkpointPlan,
    rollbackPlan,
    requiredChecks,
    sanitizedResult,
    notes,
    auditTags: [
      "agent_execution_reliability",
      actionClass,
      riskZone.toLowerCase(),
      status,
      blocked ? "blocked" : "not_blocked"
    ],
    assessedAt: new Date().toISOString()
  };
}

export function listPantavionAgentExecutionReliabilityPolicy() {
  return {
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
    maxTimeoutMs: MAX_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
    highRiskActions: [...HIGH_RISK_ACTIONS],
    greenCheckActions: [...GREEN_CHECK_ACTIONS],
    blockedCommandPatterns: BLOCKED_COMMAND_PATTERNS.map((pattern) => pattern.source),
    secretPatterns: SECRET_PATTERNS.map((pattern) => pattern.source),
    requiredGreenChecks: ["npm run build", "npx tsc --noEmit --pretty false", "npm run kernel"]
  };
}
