export type PantavionImplementationRisk =
  | "static_only"
  | "fake_ui"
  | "dead_route"
  | "missing_backend"
  | "missing_audit"
  | "local_only_success"
  | "production_unsafe"
  | "private_data_exposure"
  | "founder_approval_required";

export type PantavionImplementationStatus =
  | "blocked"
  | "needs_founder_approval"
  | "ready_for_scoped_patch"
  | "ready_for_build_verification";

export type PantavionImplementationSurface =
  | "kernel"
  | "api"
  | "app_route"
  | "admin"
  | "sos"
  | "water"
  | "translation"
  | "marketplace"
  | "social"
  | "ai"
  | "docs";

export type PantavionImplementationRequest = {
  id: string;
  title: string;
  founderIntent: string;
  targetFiles: string[];
  surfaces: PantavionImplementationSurface[];
  requiresRuntimeBehavior: boolean;
  requiresFounderApproval: boolean;
  touchesSensitiveData: boolean;
  touchesProductionAccess: boolean;
  visibleUserInterface: boolean;
  hasBackendOrRoute: boolean;
  hasAudit: boolean;
  hasBuildVerification: boolean;
};

export type PantavionImplementationFinding = {
  risk: PantavionImplementationRisk;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  requiredAction: string;
};

export type PantavionImplementationPlan = {
  id: string;
  status: PantavionImplementationStatus;
  title: string;
  targetFiles: string[];
  allowedNextCommands: string[];
  blockedCommands: string[];
  findings: PantavionImplementationFinding[];
  founderApprovalRequired: boolean;
  buildVerificationRequired: boolean;
  auditRequired: boolean;
  generatedAt: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function createPantavionImplementationPlan(
  request: PantavionImplementationRequest,
): PantavionImplementationPlan {
  const findings: PantavionImplementationFinding[] = [];

  if (request.visibleUserInterface && !request.hasBackendOrRoute && request.requiresRuntimeBehavior) {
    findings.push({
      risk: "fake_ui",
      severity: "critical",
      message:
        "Visible UI claims runtime behavior but no backend, route, or execution path is attached.",
      requiredAction:
        "Add a real route/function/backend path or mark the visible control as disabled/beta.",
    });
  }

  if (request.requiresRuntimeBehavior && request.targetFiles.length === 0) {
    findings.push({
      risk: "static_only",
      severity: "critical",
      message:
        "Runtime behavior was requested but no implementation files were declared.",
      requiredAction:
        "Declare exact scoped files before patching.",
    });
  }

  if (request.requiresRuntimeBehavior && !request.hasAudit) {
    findings.push({
      risk: "missing_audit",
      severity: "high",
      message:
        "Runtime behavior requires an audit/check before it can be called complete.",
      requiredAction:
        "Add or run a deterministic audit script for this implementation slice.",
    });
  }

  if (request.touchesSensitiveData) {
    findings.push({
      risk: "private_data_exposure",
      severity: "critical",
      message:
        "This implementation touches sensitive/private data boundaries.",
      requiredAction:
        "Require explicit privacy/data exposure review and never expose raw private infrastructure data publicly.",
    });
  }

  if (request.touchesProductionAccess) {
    findings.push({
      risk: "production_unsafe",
      severity: "critical",
      message:
        "This implementation touches production access or authorization behavior.",
      requiredAction:
        "Require scoped diff review, build, TypeScript, and founder approval before deploy.",
    });
  }

  const founderApprovalRequired =
    request.requiresFounderApproval ||
    request.touchesSensitiveData ||
    request.touchesProductionAccess ||
    findings.some((finding) => finding.severity === "critical");

  const status: PantavionImplementationStatus = findings.some(
    (finding) => finding.severity === "critical" && finding.risk !== "founder_approval_required",
  )
    ? "blocked"
    : founderApprovalRequired
      ? "needs_founder_approval"
      : request.hasBuildVerification
        ? "ready_for_scoped_patch"
        : "ready_for_build_verification";

  return {
    id: request.id,
    status,
    title: request.title,
    targetFiles: unique(request.targetFiles),
    allowedNextCommands: [
      "git status --short --untracked-files=all",
      "git diff --check",
      "npm run audit:implementation",
      "npx tsc --noEmit",
      "npm run build",
    ],
    blockedCommands: [
      "git add .",
      "blind encoding replacement",
      "public upload of private infrastructure data",
      "claim complete without build and TypeScript verification",
    ],
    findings,
    founderApprovalRequired,
    buildVerificationRequired: true,
    auditRequired: true,
    generatedAt: new Date().toISOString(),
  };
}

export const pantavionImplementationEngineContract = {
  id: "pantavion_implementation_engine_v1",
  doctrine:
    "Pantavion implementation is not static presentation. User intent must become scoped files, real routes/functions where needed, audit gates, build verification, TypeScript verification, and founder-controlled approval for sensitive changes.",
  nonNegotiables: [
    "No fake UI",
    "No dead buttons",
    "No static-only completion claims",
    "No git add .",
    "No public private-data exposure",
    "No production/local mismatch",
    "No founder-sensitive change without founder approval",
    "No complete claim without audit, TypeScript, and build verification",
  ],
} as const;
