export type PantavionStartupRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionStartupCapabilityStatus =
  | "supported"
  | "beta"
  | "internal"
  | "provider_required"
  | "requires_adapter"
  | "requires_approval"
  | "blocked";

export type PantavionStartupDomain =
  | "ideation"
  | "market_research"
  | "business_model"
  | "product_planning"
  | "coding"
  | "deployment"
  | "legal"
  | "finance"
  | "brand_content"
  | "sales_outreach"
  | "ops_support"
  | "analytics_growth"
  | "workspace_agents"
  | "unknown";

export type PantavionStartupActionClass =
  | "plan_only"
  | "research"
  | "generate_document"
  | "write_code"
  | "change_repo"
  | "deploy"
  | "send_external_message"
  | "legal_review"
  | "billing_finance"
  | "auth_user_access"
  | "provider_integration"
  | "unknown";

export type PantavionStartupBuilderCapability = {
  id: string;
  label: string;
  domain: PantavionStartupDomain;
  status: PantavionStartupCapabilityStatus;
  riskZone: PantavionStartupRiskZone;
  providerStatus:
    | "native"
    | "provider_required"
    | "requires_adapter"
    | "requires_repo_safety_gate"
    | "requires_founder_approval"
    | "not_allowed";
  requiresFounderApproval: boolean;
  requiresRepoSafetyGate: boolean;
  requiresSensitiveVaultCheck: boolean;
  requiresExternalProvider: boolean;
  allowedForAutomaticExecution: boolean;
  notes: string[];
  auditTags: string[];
};

export type PantavionStartupBuilderRequestInput = {
  capabilityId?: string;
  domain?: PantavionStartupDomain;
  actionClass?: PantavionStartupActionClass;
  target?: string;
  useCase?: string;
  production?: boolean;
  touchesRepo?: boolean;
  touchesAuth?: boolean;
  touchesBilling?: boolean;
  touchesLegal?: boolean;
  touchesSecrets?: boolean;
  sendsExternalMessage?: boolean;
  providerName?: string;
  founderApproved?: boolean;
  actor?: string;
};

export type PantavionStartupBuilderAssessment = {
  ok: true;
  requestId: string;
  capabilityId: string | null;
  domain: PantavionStartupDomain;
  actionClass: PantavionStartupActionClass;
  status: PantavionStartupCapabilityStatus;
  riskZone: PantavionStartupRiskZone;
  providerStatus: PantavionStartupBuilderCapability["providerStatus"];
  requiresFounderApproval: boolean;
  requiresRepoSafetyGate: boolean;
  requiresSensitiveVaultCheck: boolean;
  requiresExternalProvider: boolean;
  blocked: boolean;
  allowedForPlanning: boolean;
  allowedForAutomaticExecution: boolean;
  allowedForExecutionAfterApproval: boolean;
  requiredChecks: string[];
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export const PANTAVION_STARTUP_BUILDER_STACK: PantavionStartupBuilderCapability[] = [
  {
    id: "startup_ideation_engine",
    label: "Startup Ideation Engine",
    domain: "ideation",
    status: "internal",
    riskZone: "Z1",
    providerStatus: "native",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: true,
    notes: [
      "Generates structured startup ideas, problem statements, personas, and opportunity maps.",
      "Planning only. No external action."
    ],
    auditTags: ["startup_builder", "ideation", "internal"]
  },
  {
    id: "market_research_intake",
    label: "Market Research Intake",
    domain: "market_research",
    status: "provider_required",
    riskZone: "Z2",
    providerStatus: "provider_required",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Requires real data sources or provider adapters. Must not invent market facts.",
      "Outputs must include source/provider status."
    ],
    auditTags: ["startup_builder", "market_research", "provider_required"]
  },
  {
    id: "business_model_canvas",
    label: "Business Model Canvas",
    domain: "business_model",
    status: "internal",
    riskZone: "Z1",
    providerStatus: "native",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: true,
    notes: [
      "Creates structured business model drafts, pricing hypotheses, and operating assumptions.",
      "No billing or contract action allowed without approval."
    ],
    auditTags: ["startup_builder", "business_model", "internal"]
  },
  {
    id: "product_plan_builder",
    label: "Product Plan Builder",
    domain: "product_planning",
    status: "internal",
    riskZone: "Z2",
    providerStatus: "native",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: true,
    notes: [
      "Creates product specs, milestones, acceptance criteria, and implementation plans.",
      "Execution still requires repo safety gate when code or files change."
    ],
    auditTags: ["startup_builder", "product_planning", "internal"]
  },
  {
    id: "code_writer_runtime",
    label: "Code Writer Runtime",
    domain: "coding",
    status: "internal",
    riskZone: "Z3",
    providerStatus: "requires_repo_safety_gate",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: true,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: false,
    notes: [
      "Can propose code patches only through repo safety gate, scoped git add, audit, and green checks.",
      "No automatic production deploy."
    ],
    auditTags: ["startup_builder", "coding", "repo_safety_gate", "founder_approval"]
  },
  {
    id: "deployment_planner",
    label: "Deployment Planner",
    domain: "deployment",
    status: "requires_approval",
    riskZone: "Z4",
    providerStatus: "requires_founder_approval",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: true,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: false,
    notes: [
      "Production deploy, Vercel changes, CI/CD changes, environment changes, and infrastructure actions require founder approval.",
      "Approval does not bypass build, typecheck, kernel, audit, or scoped git add."
    ],
    auditTags: ["startup_builder", "deployment", "z4", "founder_approval"]
  },
  {
    id: "legal_checklist_builder",
    label: "Legal Checklist Builder",
    domain: "legal",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "requires_adapter",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Can prepare legal checklists, but cannot provide binding legal approval.",
      "Contracts, terms, privacy, compliance, publication, and external legal actions require founder approval."
    ],
    auditTags: ["startup_builder", "legal", "requires_adapter", "founder_approval"]
  },
  {
    id: "finance_checklist_builder",
    label: "Finance Checklist Builder",
    domain: "finance",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "requires_adapter",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Can structure finance checklists and assumptions.",
      "Billing, payment, invoices, subscriptions, tax, and bank/provider actions require founder approval."
    ],
    auditTags: ["startup_builder", "finance", "billing", "founder_approval"]
  },
  {
    id: "brand_content_studio",
    label: "Brand Content Studio",
    domain: "brand_content",
    status: "beta",
    riskZone: "Z2",
    providerStatus: "provider_required",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Can draft brand copy, landing page text, social content, and campaign ideas.",
      "External publication or paid campaign execution requires approval."
    ],
    auditTags: ["startup_builder", "brand_content", "beta"]
  },
  {
    id: "sales_outreach_assistant",
    label: "Sales Outreach Assistant",
    domain: "sales_outreach",
    status: "requires_approval",
    riskZone: "Z3",
    providerStatus: "requires_founder_approval",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Can draft outreach, but must not send external messages automatically.",
      "Email, CRM, ads, or public posting actions require approval and audit."
    ],
    auditTags: ["startup_builder", "sales_outreach", "external_message", "founder_approval"]
  },
  {
    id: "ops_support_builder",
    label: "Ops and Support Builder",
    domain: "ops_support",
    status: "internal",
    riskZone: "Z2",
    providerStatus: "native",
    requiresFounderApproval: false,
    requiresRepoSafetyGate: false,
    requiresSensitiveVaultCheck: false,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: true,
    notes: [
      "Creates SOPs, support flows, issue triage structures, and operating checklists.",
      "Customer/user data access requires vault and approval gates."
    ],
    auditTags: ["startup_builder", "ops_support", "internal"]
  },
  {
    id: "analytics_growth_registry",
    label: "Analytics and Growth Registry",
    domain: "analytics_growth",
    status: "provider_required",
    riskZone: "Z3",
    providerStatus: "provider_required",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: true,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: true,
    allowedForAutomaticExecution: false,
    notes: [
      "Analytics, tracking, attribution, and growth integrations require provider adapters and privacy review.",
      "No tracking, cookies, or user-data processing without approval."
    ],
    auditTags: ["startup_builder", "analytics_growth", "privacy", "founder_approval"]
  },
  {
    id: "company_workspace_agents",
    label: "Company Workspace Agents",
    domain: "workspace_agents",
    status: "internal",
    riskZone: "Z3",
    providerStatus: "requires_repo_safety_gate",
    requiresFounderApproval: true,
    requiresRepoSafetyGate: true,
    requiresSensitiveVaultCheck: true,
    requiresExternalProvider: false,
    allowedForAutomaticExecution: false,
    notes: [
      "Agent employees must have identity, scope, command/file permissions, audit, checkpoints, and approval gates.",
      "No hidden autonomous production actions."
    ],
    auditTags: ["startup_builder", "workspace_agents", "agent_runtime", "founder_approval"]
  }
];

const normalize = (value: unknown): string => String(value || "").trim().toLowerCase();

export function listPantavionStartupBuilderStack(): PantavionStartupBuilderCapability[] {
  return PANTAVION_STARTUP_BUILDER_STACK.map((entry) => ({
    ...entry,
    notes: [...entry.notes],
    auditTags: [...entry.auditTags]
  }));
}

export function assessPantavionStartupBuilderRequest(
  input: PantavionStartupBuilderRequestInput
): PantavionStartupBuilderAssessment {
  const capabilityId = normalize(input.capabilityId);
  const capability =
    PANTAVION_STARTUP_BUILDER_STACK.find((entry) => entry.id === capabilityId) ?? null;

  const domain = capability?.domain ?? input.domain ?? "unknown";
  const actionClass = input.actionClass ?? "unknown";

  const touchesSensitive =
    Boolean(input.touchesAuth) ||
    Boolean(input.touchesBilling) ||
    Boolean(input.touchesLegal) ||
    Boolean(input.touchesSecrets);

  const repoSensitive =
    Boolean(input.touchesRepo) ||
    actionClass === "write_code" ||
    actionClass === "change_repo";

  const externalAction =
    Boolean(input.sendsExternalMessage) ||
    actionClass === "send_external_message" ||
    actionClass === "provider_integration";

  const productionAction =
    Boolean(input.production) ||
    actionClass === "deploy";

  const fallbackStatus: PantavionStartupCapabilityStatus = "requires_adapter";
  const status = capability?.status ?? fallbackStatus;

  const riskZone: PantavionStartupRiskZone =
    capability?.riskZone ??
    (productionAction || touchesSensitive ? "Z4" : repoSensitive || externalAction ? "Z3" : "Z2");

  const providerStatus =
    capability?.providerStatus ??
    (externalAction ? "provider_required" : repoSensitive ? "requires_repo_safety_gate" : "requires_adapter");

  const blocked = status === "blocked" || providerStatus === "not_allowed";

  const requiresRepoSafetyGate =
    Boolean(capability?.requiresRepoSafetyGate) || repoSensitive || productionAction;

  const requiresSensitiveVaultCheck =
    Boolean(capability?.requiresSensitiveVaultCheck) ||
    touchesSensitive ||
    productionAction ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const requiresExternalProvider =
    Boolean(capability?.requiresExternalProvider) ||
    Boolean(input.providerName) ||
    externalAction ||
    status === "provider_required" ||
    status === "requires_adapter";

  const requiresFounderApproval =
    Boolean(capability?.requiresFounderApproval) ||
    productionAction ||
    touchesSensitive ||
    repoSensitive ||
    externalAction ||
    riskZone === "Z3" ||
    riskZone === "Z4" ||
    status === "requires_approval";

  const founderApproved = Boolean(input.founderApproved);

  const requiredChecks = requiresRepoSafetyGate
    ? ["npm run build", "npx tsc --noEmit --pretty false", "npm run kernel"]
    : [];

  const allowedForAutomaticExecution =
    !blocked &&
    !requiresFounderApproval &&
    Boolean(capability?.allowedForAutomaticExecution) &&
    (status === "supported" || status === "beta" || status === "internal");

  const allowedForExecutionAfterApproval =
    !blocked &&
    requiresFounderApproval &&
    founderApproved;

  const notes = capability
    ? [...capability.notes]
    : ["No exact startup builder capability matched. Treat as requires_adapter until reviewed."];

  if (requiresFounderApproval && !founderApproved) {
    notes.push("Founder approval is required before execution.");
  }

  if (requiresRepoSafetyGate) {
    notes.push("Repo safety gate is required before code, git, CI/CD, or deploy actions.");
  }

  if (requiresSensitiveVaultCheck) {
    notes.push("Sensitive artifact vault check is required for legal, auth, billing, secrets, source-truth, production, or infrastructure impact.");
  }

  if (requiresExternalProvider) {
    notes.push("External provider or adapter status must be explicit. Do not fake provider capability.");
  }

  if (requiredChecks.length > 0) {
    notes.push("Green build, typecheck, and kernel checks are required before merge or deployment.");
  }

  return {
    ok: true,
    requestId: `startup_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    capabilityId: capability?.id ?? null,
    domain,
    actionClass,
    status,
    riskZone,
    providerStatus,
    requiresFounderApproval,
    requiresRepoSafetyGate,
    requiresSensitiveVaultCheck,
    requiresExternalProvider,
    blocked,
    allowedForPlanning: true,
    allowedForAutomaticExecution,
    allowedForExecutionAfterApproval,
    requiredChecks,
    notes,
    auditTags: capability?.auditTags ?? ["startup_builder", "unregistered", "review_required"],
    assessedAt: new Date().toISOString()
  };
}
