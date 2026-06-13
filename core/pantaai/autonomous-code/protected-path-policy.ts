export type ProtectedKernelDomain =
  | "water"
  | "users"
  | "access"
  | "secrets"
  | "payments"
  | "legal"
  | "identity"
  | "sos"
  | "minors"
  | "health"
  | "financial"
  | "production"
  | "deployment"
  | "private_data";

export type MutationOperation =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "deploy"
  | "approve"
  | "revoke"
  | "payment"
  | "identity_change";

export type AutonomousMutationRequest = {
  filePath: string;
  operation: MutationOperation;
  reason: string;
  requestedBy: "kernel" | "cron" | "founder" | "developer" | "unknown";
};

export type AutonomousPolicyDecision = {
  domain?: ProtectedKernelDomain;
  canObserve: boolean;
  canPlan: boolean;
  canDraftPatch: boolean;
  canWriteDirectly: boolean;
  canCreatePullRequest: boolean;
  requiresFounderApproval: boolean;
  requiredGates: string[];
  reasons: string[];
};

const DOMAIN_PATTERNS: Array<{
  domain: ProtectedKernelDomain;
  patterns: RegExp[];
}> = [
  { domain: "water", patterns: [/water/i, /infrastructure/i, /geojson/i, /kmz/i, /dwg/i, /dxf/i] },
  { domain: "users", patterns: [/user/i, /account/i, /profile/i] },
  { domain: "access", patterns: [/access/i, /approval/i, /permission/i, /admin/i, /role/i] },
  { domain: "secrets", patterns: [/secret/i, /\.env/i, /token/i, /key/i, /credential/i] },
  { domain: "payments", patterns: [/payment/i, /billing/i, /stripe/i, /revolut/i, /invoice/i] },
  { domain: "legal", patterns: [/legal/i, /terms/i, /privacy/i, /consent/i, /policy/i] },
  { domain: "identity", patterns: [/identity/i, /auth/i, /login/i, /signup/i, /session/i] },
  { domain: "sos", patterns: [/sos/i, /emergency/i, /alert/i] },
  { domain: "minors", patterns: [/minor/i, /child/i, /age/i, /guardian/i] },
  { domain: "health", patterns: [/health/i, /medical/i, /doctor/i, /wellness/i, /hormone/i] },
  { domain: "financial", patterns: [/finance/i, /trading/i, /investment/i, /stock/i] },
  { domain: "production", patterns: [/production/i, /vercel/i, /deploy/i] },
  { domain: "deployment", patterns: [/deploy/i, /workflow/i, /github/i, /vercel/i] },
  { domain: "private_data", patterns: [/private/i, /vault/i, /blob/i, /memory/i] },
];

export function detectProtectedDomain(filePath: string): ProtectedKernelDomain | undefined {
  const normalized = filePath.replace(/\\/g, "/");
  for (const rule of DOMAIN_PATTERNS) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.domain;
    }
  }

  return undefined;
}

export function evaluateAutonomousMutation(
  request: AutonomousMutationRequest
): AutonomousPolicyDecision {
  const domain = detectProtectedDomain(request.filePath);
  const isProtected = Boolean(domain);

  if (!isProtected) {
    return {
      domain,
      canObserve: true,
      canPlan: true,
      canDraftPatch: true,
      canWriteDirectly: request.operation !== "deploy" && request.operation !== "delete",
      canCreatePullRequest: true,
      requiresFounderApproval: false,
      requiredGates: ["typescript", "build", "autonomous_gate"],
      reasons: ["Non-protected path. Kernel may generate code after audits."],
    };
  }

  return {
    domain,
    canObserve: true,
    canPlan: true,
    canDraftPatch: true,
    canWriteDirectly: false,
    canCreatePullRequest: true,
    requiresFounderApproval: true,
    requiredGates: [
      "founder_approval",
      "typescript",
      "build",
      "autonomous_gate",
      "domain_kernel_policy",
      "rollback_plan",
    ],
    reasons: [
      "Protected domain is not a stop condition.",
      "Protected domain has its own kernel.",
      "Autonomous direct production mutation is blocked.",
      "Autonomous PR/draft/review execution is allowed with founder approval gate.",
    ],
  };
}

export const PANTAVION_PROTECTED_DOMAIN_KERNEL_RULES = [
  "Protected domains are executable kernel domains, not excuses.",
  "The kernel may observe, reason, plan, draft, test and create PRs for protected domains.",
  "Direct mutation of production water/users/access/secrets/payments/legal/identity/SOS requires founder approval.",
  "No raw water/DWG/DXF/KMZ/private geodata may be exposed publicly.",
  "No users/access/session records may be deleted by autonomous code.",
  "No payment/legal/identity/SOS claim may be silently changed without audit.",
];

export const pantavion_protected_path_policy_marker_v1 =
  "pantavion_protected_path_policy_c1_v1";
