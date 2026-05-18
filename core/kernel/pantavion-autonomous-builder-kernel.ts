export type PantavionAutonomousBuilderCapability =
  | "repo_truth"
  | "code_audit"
  | "error_repair"
  | "scoped_patch"
  | "internal_feature_build"
  | "external_app_build"
  | "provider_integration"
  | "deployment_plan"
  | "founder_approval_gate"
  | "verification";

export type PantavionAutonomousBuilderMode =
  | "observe"
  | "diagnose"
  | "propose"
  | "draft_patch"
  | "verify"
  | "ready_for_founder_approval"
  | "blocked";

export type PantavionAutonomousBuildTarget =
  | "pantavion_internal"
  | "external_app"
  | "api_integration"
  | "admin_tool"
  | "safety_system"
  | "water_infrastructure"
  | "sos_elder"
  | "translation"
  | "marketplace"
  | "social_universe"
  | "pantaai_center";

export type PantavionAutonomousRisk =
  | "no_repo_truth"
  | "unscoped_request"
  | "missing_founder_approval"
  | "missing_audit"
  | "missing_build_verification"
  | "missing_typescript_verification"
  | "sensitive_data_boundary"
  | "production_deploy_boundary"
  | "external_app_boundary"
  | "unsafe_autonomy_claim";

export type PantavionAutonomousBuildRequest = {
  id: string;
  founderIntent: string;
  target: PantavionAutonomousBuildTarget;
  capabilities: PantavionAutonomousBuilderCapability[];
  targetFiles: string[];
  repoTruthChecked: boolean;
  allowFileWrite: boolean;
  allowExternalAppCreation: boolean;
  allowProductionDeploy: boolean;
  hasFounderApproval: boolean;
  hasAudit: boolean;
  hasBuildVerification: boolean;
  hasTypeScriptVerification: boolean;
  touchesSensitiveData: boolean;
  touchesPaymentsAuthSafetyOrInfrastructure: boolean;
};

export type PantavionAutonomousFinding = {
  risk: PantavionAutonomousRisk;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  requiredAction: string;
};

export type PantavionAutonomousPhase = {
  id: string;
  mode: PantavionAutonomousBuilderMode;
  title: string;
  required: boolean;
  commands: string[];
};

export type PantavionAutonomousWorkOrder = {
  id: string;
  target: PantavionAutonomousBuildTarget;
  mode: PantavionAutonomousBuilderMode;
  founderIntent: string;
  targetFiles: string[];
  findings: PantavionAutonomousFinding[];
  phases: PantavionAutonomousPhase[];
  founderApprovalRequired: boolean;
  auditRequired: boolean;
  buildVerificationRequired: boolean;
  typeScriptVerificationRequired: boolean;
  externalAppCreationAllowed: boolean;
  productionDeployAllowed: boolean;
  blockedCommands: string[];
  generatedAt: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function hasCapability(
  request: PantavionAutonomousBuildRequest,
  capability: PantavionAutonomousBuilderCapability,
) {
  return request.capabilities.includes(capability);
}

export function createPantavionAutonomousWorkOrder(
  request: PantavionAutonomousBuildRequest,
): PantavionAutonomousWorkOrder {
  const findings: PantavionAutonomousFinding[] = [];

  if (!request.repoTruthChecked) {
    findings.push({
      risk: "no_repo_truth",
      severity: "critical",
      message: "Autonomous building cannot begin without repo truth.",
      requiredAction:
        "Run git status, recent git log, and inspect the scoped files before any patch.",
    });
  }

  if (request.allowFileWrite && request.targetFiles.length === 0) {
    findings.push({
      risk: "unscoped_request",
      severity: "critical",
      message: "File-writing autonomy was requested without exact scoped files.",
      requiredAction:
        "Declare the exact files the builder is allowed to create or modify.",
    });
  }

  if (request.allowFileWrite && !request.hasFounderApproval) {
    findings.push({
      risk: "missing_founder_approval",
      severity: "critical",
      message: "The builder cannot write or alter product code without founder approval.",
      requiredAction:
        "Capture explicit founder approval before patching product, safety, infrastructure, or production paths.",
    });
  }

  if (!request.hasAudit) {
    findings.push({
      risk: "missing_audit",
      severity: "high",
      message: "Autonomous work requires a deterministic audit gate.",
      requiredAction:
        "Add or run a scoped audit script before completion can be claimed.",
    });
  }

  if (!request.hasBuildVerification) {
    findings.push({
      risk: "missing_build_verification",
      severity: "high",
      message: "Autonomous work requires build verification.",
      requiredAction: "Run npm run build before completion can be claimed.",
    });
  }

  if (!request.hasTypeScriptVerification) {
    findings.push({
      risk: "missing_typescript_verification",
      severity: "high",
      message: "Autonomous work requires TypeScript verification.",
      requiredAction: "Run npx tsc --noEmit before completion can be claimed.",
    });
  }

  if (request.touchesSensitiveData) {
    findings.push({
      risk: "sensitive_data_boundary",
      severity: "critical",
      message: "The work touches sensitive or private data boundaries.",
      requiredAction:
        "Require privacy review, founder approval, and no raw private data exposure.",
    });
  }

  if (request.allowProductionDeploy && !request.hasFounderApproval) {
    findings.push({
      risk: "production_deploy_boundary",
      severity: "critical",
      message: "Production deploy cannot be autonomous without founder approval.",
      requiredAction:
        "Block production deploy until founder approval, audit, TypeScript, and build pass.",
    });
  }

  if (request.allowExternalAppCreation && !hasCapability(request, "external_app_build")) {
    findings.push({
      risk: "external_app_boundary",
      severity: "high",
      message: "External app creation was requested without the external app build capability.",
      requiredAction:
        "Declare external app build capability and target files before creating a separate app.",
    });
  }

  if (request.touchesPaymentsAuthSafetyOrInfrastructure && !request.hasFounderApproval) {
    findings.push({
      risk: "missing_founder_approval",
      severity: "critical",
      message:
        "Payments, auth, safety, SOS, water, or infrastructure work requires founder approval.",
      requiredAction:
        "Founder approval must be explicit before this work can move from proposal to patch.",
    });
  }

  const critical = findings.some((finding) => finding.severity === "critical");

  const founderApprovalRequired =
    request.allowFileWrite ||
    request.allowExternalAppCreation ||
    request.allowProductionDeploy ||
    request.touchesSensitiveData ||
    request.touchesPaymentsAuthSafetyOrInfrastructure ||
    critical;

  const auditRequired = true;
  const buildVerificationRequired = true;
  const typeScriptVerificationRequired = true;

  const externalAppCreationAllowed =
    request.allowExternalAppCreation &&
    request.hasFounderApproval &&
    request.hasAudit &&
    request.hasBuildVerification &&
    request.hasTypeScriptVerification &&
    hasCapability(request, "external_app_build");

  const productionDeployAllowed =
    request.allowProductionDeploy &&
    request.hasFounderApproval &&
    request.hasAudit &&
    request.hasBuildVerification &&
    request.hasTypeScriptVerification &&
    !request.touchesSensitiveData;

  const mode: PantavionAutonomousBuilderMode = critical
    ? "blocked"
    : founderApprovalRequired && !request.hasFounderApproval
      ? "ready_for_founder_approval"
      : request.hasAudit && request.hasBuildVerification && request.hasTypeScriptVerification
        ? "verify"
        : "propose";

  return {
    id: request.id,
    target: request.target,
    mode,
    founderIntent: request.founderIntent,
    targetFiles: unique(request.targetFiles),
    findings,
    phases: [
      {
        id: "repo_truth",
        mode: "observe",
        title: "Read repo state before changing anything",
        required: true,
        commands: [
          "git status --short --untracked-files=all",
          "git log --oneline -8",
        ],
      },
      {
        id: "diagnose",
        mode: "diagnose",
        title: "Find missing routes, dead UI, broken build, unsafe data exposure, or incomplete execution path",
        required: true,
        commands: ["git diff --check"],
      },
      {
        id: "proposal",
        mode: "propose",
        title: "Generate a scoped work order before patching",
        required: true,
        commands: ["npm run audit:autonomous-builder"],
      },
      {
        id: "verification",
        mode: "verify",
        title: "Verify the patch with audit, TypeScript, and build",
        required: true,
        commands: [
          "npm run audit:autonomous-builder",
          "npm run audit:implementation",
          "npx tsc --noEmit",
          "npm run build",
        ],
      },
    ],
    founderApprovalRequired,
    auditRequired,
    buildVerificationRequired,
    typeScriptVerificationRequired,
    externalAppCreationAllowed,
    productionDeployAllowed,
    blockedCommands: [
      "blanket git staging",
      "blind encoding replacement",
      "unapproved production deploy",
      "public exposure of private infrastructure data",
      "claiming completion without audit, TypeScript, and build verification",
      "autonomous changes to payments, auth, SOS, water, or infrastructure without founder approval",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export const pantavionAutonomousBuilderKernelContract = {
  id: "pantavion_autonomous_builder_kernel_v1",
  doctrine:
    "Pantavion autonomous building means controlled execution: observe repo truth, diagnose gaps, propose scoped patches, require founder approval for sensitive work, verify with audit TypeScript and build, then allow controlled expansion into internal modules or external apps.",
  nonNegotiables: [
    "Repo truth before patch",
    "Founder approval before sensitive file writes",
    "No fake UI",
    "No dead routes",
    "No unsafe production deploy",
    "No raw private data exposure",
    "No completion claim without audit",
    "No completion claim without TypeScript verification",
    "No completion claim without build verification",
    "External apps require explicit target and founder approval",
  ],
} as const;
