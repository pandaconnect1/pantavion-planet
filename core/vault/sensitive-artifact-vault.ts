export type PantavionArtifactRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionArtifactOperation =
  | "read"
  | "write"
  | "edit"
  | "delete"
  | "move"
  | "copy"
  | "upload"
  | "download"
  | "share"
  | "convert"
  | "render"
  | "deploy"
  | "backup"
  | "restore"
  | "unknown";

export type PantavionSensitiveArtifactClass =
  | "dwg_source_truth"
  | "cad_gis_derivative"
  | "secret_or_token"
  | "environment_config"
  | "production_config"
  | "legal_document"
  | "auth_user_data"
  | "billing_data"
  | "backup_archive"
  | "repo_ci_cd"
  | "general_internal"
  | "unknown";

export type PantavionSensitiveArtifactRule = {
  id: string;
  label: string;
  artifactClass: PantavionSensitiveArtifactClass;
  riskZone: PantavionArtifactRiskZone;
  pathHints: string[];
  extensionHints: string[];
  operationPolicy: {
    automaticReadAllowed: boolean;
    automaticWriteAllowed: boolean;
    automaticDeleteAllowed: boolean;
    automaticUploadAllowed: boolean;
    automaticDeployAllowed: boolean;
  };
  requiresFounderApproval: boolean;
  immutableSourceTruth: boolean;
  notes: string[];
  auditTags: string[];
};

export type PantavionSensitiveArtifactInput = {
  path?: string;
  filename?: string;
  extension?: string;
  artifactClass?: PantavionSensitiveArtifactClass;
  operation?: PantavionArtifactOperation;
  sourceTruth?: boolean;
  production?: boolean;
  containsSecret?: boolean;
  founderApproved?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionSensitiveArtifactAssessment = {
  ok: true;
  requestId: string;
  artifactClass: PantavionSensitiveArtifactClass;
  matchedRuleId: string | null;
  operation: PantavionArtifactOperation;
  riskZone: PantavionArtifactRiskZone;
  requiresFounderApproval: boolean;
  immutableSourceTruth: boolean;
  allowedForPlanning: boolean;
  allowedForAutomaticExecution: boolean;
  allowedForExecutionAfterApproval: boolean;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const normalize = (value: unknown): string =>
  String(value || "").trim().toLowerCase();

const normalizeExtension = (value: unknown): string =>
  normalize(value).replace(/^\./, "");

const getExtensionFromPath = (value: string): string => {
  const clean = normalize(value).split("?")[0] ?? "";
  const parts = clean.split(".");
  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
};

export const PANTAVION_SENSITIVE_ARTIFACT_RULES: PantavionSensitiveArtifactRule[] = [
  {
    id: "dwg_master_source_truth",
    label: "DWG Master Source Truth",
    artifactClass: "dwg_source_truth",
    riskZone: "Z4",
    pathHints: ["master", "master-dwg", "water", "source", "dwg"],
    extensionHints: ["dwg", "dxf", "dgn"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: true,
    notes: [
      "Original DWG/CAD source-truth artifacts are immutable and read-only by default.",
      "No edit, overwrite, filtering, simplification, reconstruction, sampling, deletion, public upload, or derivative-as-original use is allowed without explicit founder approval."
    ],
    auditTags: ["vault", "dwg", "cad", "source_truth", "immutable", "founder_approval"]
  },
  {
    id: "cad_gis_derivative_artifact",
    label: "CAD/GIS Derivative Artifact",
    artifactClass: "cad_gis_derivative",
    riskZone: "Z3",
    pathHints: ["geojson", "kml", "kmz", "shp", "gpkg", "processed", "derivative"],
    extensionHints: ["geojson", "kml", "kmz", "shp", "gpkg", "json"],
    operationPolicy: {
      automaticReadAllowed: true,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "CAD/GIS derivatives may be useful, but they must be labeled as derivatives and must never replace the original source truth."
    ],
    auditTags: ["vault", "cad", "gis", "derivative", "founder_approval"]
  },
  {
    id: "secret_or_token_artifact",
    label: "Secret, Token, Key, Credential",
    artifactClass: "secret_or_token",
    riskZone: "Z4",
    pathHints: [".env", "secret", "token", "key", "credential", "private"],
    extensionHints: ["env", "pem", "key", "p12", "pfx"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Secrets must never be exposed to AI agents, logs, prompts, public build output, GitHub issues, PR text, or browser-visible routes."
    ],
    auditTags: ["vault", "secret", "token", "credential", "z4", "founder_approval"]
  },
  {
    id: "environment_config_artifact",
    label: "Environment Configuration",
    artifactClass: "environment_config",
    riskZone: "Z3",
    pathHints: [".env", "vercel", "runtime", "config"],
    extensionHints: ["env", "json", "toml", "yaml", "yml"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Environment and runtime configuration can change production behavior and must be approval-gated."
    ],
    auditTags: ["vault", "environment", "config", "z3", "founder_approval"]
  },
  {
    id: "production_config_artifact",
    label: "Production Config / Deployment Guardrail",
    artifactClass: "production_config",
    riskZone: "Z4",
    pathHints: ["vercel", "production", "deploy", "workflow", ".github", "ci", "cd"],
    extensionHints: ["yml", "yaml", "json", "toml"],
    operationPolicy: {
      automaticReadAllowed: true,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Production deployment, CI/CD, and infrastructure behavior require founder approval before changes or execution."
    ],
    auditTags: ["vault", "production", "cicd", "deploy", "z4", "founder_approval"]
  },
  {
    id: "legal_document_artifact",
    label: "Legal / Contract / Compliance Document",
    artifactClass: "legal_document",
    riskZone: "Z3",
    pathHints: ["legal", "contract", "license", "terms", "privacy", "compliance"],
    extensionHints: ["pdf", "doc", "docx", "txt", "md"],
    operationPolicy: {
      automaticReadAllowed: true,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Legal/compliance artifacts may be summarized internally, but changes, publication, deletion, or external sharing require founder approval."
    ],
    auditTags: ["vault", "legal", "compliance", "founder_approval"]
  },
  {
    id: "auth_user_data_artifact",
    label: "Auth / User Access / Personal Data",
    artifactClass: "auth_user_data",
    riskZone: "Z4",
    pathHints: ["auth", "user", "identity", "session", "otp", "profile"],
    extensionHints: ["json", "csv", "db", "sqlite"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "User access, identity, auth, session, profile, and personal data artifacts require strict approval, audit, and privacy controls."
    ],
    auditTags: ["vault", "auth", "user_data", "privacy", "z4", "founder_approval"]
  },
  {
    id: "billing_data_artifact",
    label: "Billing / Payment / Finance Data",
    artifactClass: "billing_data",
    riskZone: "Z4",
    pathHints: ["billing", "payment", "stripe", "invoice", "finance"],
    extensionHints: ["json", "csv", "pdf"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Billing, payment, subscription, invoice, and finance artifacts are sensitive and require approval before action."
    ],
    auditTags: ["vault", "billing", "payment", "finance", "z4", "founder_approval"]
  },
  {
    id: "backup_restore_artifact",
    label: "Backup / Restore / Archive",
    artifactClass: "backup_archive",
    riskZone: "Z4",
    pathHints: ["backup", "restore", "archive", "snapshot", "dump"],
    extensionHints: ["zip", "tar", "gz", "7z", "bak", "dump", "sql"],
    operationPolicy: {
      automaticReadAllowed: false,
      automaticWriteAllowed: false,
      automaticDeleteAllowed: false,
      automaticUploadAllowed: false,
      automaticDeployAllowed: false
    },
    requiresFounderApproval: true,
    immutableSourceTruth: false,
    notes: [
      "Backup and restore artifacts can expose or overwrite large parts of the system and require founder approval."
    ],
    auditTags: ["vault", "backup", "restore", "archive", "z4", "founder_approval"]
  }
];

export function listPantavionSensitiveArtifactRules(): PantavionSensitiveArtifactRule[] {
  return PANTAVION_SENSITIVE_ARTIFACT_RULES.map((rule) => ({
    ...rule,
    pathHints: [...rule.pathHints],
    extensionHints: [...rule.extensionHints],
    operationPolicy: { ...rule.operationPolicy },
    notes: [...rule.notes],
    auditTags: [...rule.auditTags]
  }));
}

function matchRule(input: PantavionSensitiveArtifactInput): PantavionSensitiveArtifactRule | null {
  const explicitClass = input.artifactClass;
  if (explicitClass) {
    const explicit = PANTAVION_SENSITIVE_ARTIFACT_RULES.find(
      (rule) => rule.artifactClass === explicitClass
    );
    if (explicit) {
      return explicit;
    }
  }

  const pathValue = normalize(`${input.path ?? ""} ${input.filename ?? ""}`);
  const extension = normalizeExtension(input.extension || getExtensionFromPath(pathValue));

  const secretHint =
    Boolean(input.containsSecret) ||
    pathValue.includes(".env") ||
    pathValue.includes("secret") ||
    pathValue.includes("token") ||
    pathValue.includes("credential") ||
    pathValue.includes("private_key");

  if (secretHint) {
    return PANTAVION_SENSITIVE_ARTIFACT_RULES.find(
      (rule) => rule.id === "secret_or_token_artifact"
    ) ?? null;
  }

  return (
    PANTAVION_SENSITIVE_ARTIFACT_RULES.find((rule) => {
      const extensionMatched = rule.extensionHints.includes(extension);
      const pathMatched = rule.pathHints.some((hint) => pathValue.includes(hint));
      return extensionMatched || pathMatched;
    }) ?? null
  );
}

function operationAllowedByPolicy(
  rule: PantavionSensitiveArtifactRule | null,
  operation: PantavionArtifactOperation
): boolean {
  if (!rule) {
    return false;
  }

  if (operation === "read") {
    return rule.operationPolicy.automaticReadAllowed;
  }

  if (operation === "write" || operation === "edit" || operation === "move" || operation === "copy") {
    return rule.operationPolicy.automaticWriteAllowed;
  }

  if (operation === "delete" || operation === "restore") {
    return rule.operationPolicy.automaticDeleteAllowed;
  }

  if (operation === "upload" || operation === "share" || operation === "download") {
    return rule.operationPolicy.automaticUploadAllowed;
  }

  if (operation === "deploy") {
    return rule.operationPolicy.automaticDeployAllowed;
  }

  if (operation === "convert" || operation === "render" || operation === "backup") {
    return false;
  }

  return false;
}

export function assessPantavionSensitiveArtifact(
  input: PantavionSensitiveArtifactInput
): PantavionSensitiveArtifactAssessment {
  const operation = input.operation ?? "unknown";
  const matched = matchRule(input);
  const isSourceTruth = Boolean(input.sourceTruth) || matched?.immutableSourceTruth === true;
  const isProduction = Boolean(input.production);
  const containsSecret = Boolean(input.containsSecret);

  const artifactClass =
    matched?.artifactClass ??
    (containsSecret ? "secret_or_token" : isSourceTruth ? "dwg_source_truth" : "unknown");

  const riskZone: PantavionArtifactRiskZone =
    matched?.riskZone ?? (containsSecret || isSourceTruth || isProduction ? "Z4" : "Z3");

  const immutableSourceTruth = Boolean(matched?.immutableSourceTruth) || isSourceTruth;

  const requiresFounderApproval =
    Boolean(matched?.requiresFounderApproval) ||
    immutableSourceTruth ||
    containsSecret ||
    isProduction ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const highRiskMutation =
    operation === "write" ||
    operation === "edit" ||
    operation === "delete" ||
    operation === "move" ||
    operation === "upload" ||
    operation === "share" ||
    operation === "deploy" ||
    operation === "restore";

  const sourceTruthMutationBlocked = immutableSourceTruth && highRiskMutation;
  const automaticPolicyAllowed = operationAllowedByPolicy(matched, operation);

  const blocked =
    sourceTruthMutationBlocked ||
    (artifactClass === "secret_or_token" && operation !== "read") ||
    operation === "unknown";

  const founderApproved = Boolean(input.founderApproved);

  const allowedForPlanning = !blocked || requiresFounderApproval;
  const allowedForAutomaticExecution = !blocked && !requiresFounderApproval && automaticPolicyAllowed;
  const allowedForExecutionAfterApproval =
    !blocked && requiresFounderApproval && founderApproved && !sourceTruthMutationBlocked;

  const notes = matched
    ? [...matched.notes]
    : ["No exact sensitive artifact rule matched. Treat as review-required until classified."];

  if (immutableSourceTruth) {
    notes.push("Source-truth artifact detected. Preserve original and use read-only handling by default.");
  }

  if (requiresFounderApproval && !founderApproved) {
    notes.push("Founder approval is required before execution.");
  }

  if (sourceTruthMutationBlocked) {
    notes.push("Blocked: source-truth mutation is not allowed through automatic runtime.");
  }

  if (containsSecret) {
    notes.push("Secret/token handling detected. Do not expose content to prompts, logs, client routes, or public CI output.");
  }

  return {
    ok: true,
    requestId: `vault_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    artifactClass,
    matchedRuleId: matched?.id ?? null,
    operation,
    riskZone,
    requiresFounderApproval,
    immutableSourceTruth,
    allowedForPlanning,
    allowedForAutomaticExecution,
    allowedForExecutionAfterApproval,
    blocked,
    notes,
    auditTags: matched?.auditTags ?? ["vault", "unclassified", "review_required"],
    assessedAt: new Date().toISOString()
  };
}
