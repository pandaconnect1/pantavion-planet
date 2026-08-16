import fs from "node:fs/promises";
import path from "node:path";

export type PantavionCapabilityStatus =
  | "supported"
  | "beta"
  | "internal"
  | "requires_adapter"
  | "restricted"
  | "blocked";

export type PantavionRiskClass =
  | "normal"
  | "repo"
  | "security"
  | "legal"
  | "infrastructure"
  | "production"
  | "auth"
  | "billing"
  | "user_data"
  | "dwg_source_truth";

export interface PantavionProviderAdapter {
  id: string;
  name: string;
  family: string;
  status: PantavionCapabilityStatus;
  allowedUses: string[];
  blockedUses: string[];
  approvalRequiredFor: PantavionRiskClass[];
}

export interface PantavionProtocolAdapter {
  id: string;
  name: string;
  status: PantavionCapabilityStatus;
  purpose: string;
  routeTarget: string;
  auditRequired: boolean;
  founderApprovalRequired: boolean;
}

export interface PantavionAgentRuntimeScanInput {
  title?: string;
  description?: string;
  files?: string[];
  routeTargets?: string[];
  requestedBy?: string;
}

export interface PantavionAgentAuditRecord {
  id: string;
  runtimeId: string;
  createdAt: string;
  action: string;
  riskClasses: PantavionRiskClass[];
  founderApprovalRequired: boolean;
  summary: string;
  touchedFiles: string[];
  routeTargets: string[];
  status: PantavionCapabilityStatus | "requires_founder_approval";
}

export const PANTAVION_AGENT_RUNTIME_ID =
  "pantavion_agent_runtime_guardrails_v1";

export const providerRegistry: PantavionProviderAdapter[] = [
  {
    id: "openai_frontier_router",
    name: "OpenAI Frontier Provider Router",
    family: "openai",
    status: "requires_adapter",
    allowedUses: [
      "reasoning",
      "code review",
      "summarization",
      "workflow drafting",
      "multimodal analysis after consent",
    ],
    blockedUses: [
      "unguarded repo write",
      "secret exposure",
      "security bypass",
      "DWG source-truth modification",
    ],
    approvalRequiredFor: [
      "repo",
      "security",
      "legal",
      "infrastructure",
      "production",
      "auth",
      "billing",
      "user_data",
      "dwg_source_truth",
    ],
  },
  {
    id: "anthropic_claude_router",
    name: "Anthropic Claude Provider Router",
    family: "anthropic",
    status: "requires_adapter",
    allowedUses: [
      "long-context review",
      "agent planning",
      "repository reasoning",
      "document analysis",
    ],
    blockedUses: [
      "untrusted PR instruction execution",
      "secret handling without boundary",
      "production deploy without founder approval",
    ],
    approvalRequiredFor: [
      "repo",
      "security",
      "legal",
      "infrastructure",
      "production",
      "auth",
      "billing",
      "user_data",
    ],
  },
  {
    id: "google_gemini_router",
    name: "Google Gemini / A2A Provider Router",
    family: "google",
    status: "requires_adapter",
    allowedUses: [
      "multimodal assistance",
      "enterprise agent interoperability",
      "translation support",
      "document understanding",
    ],
    blockedUses: [
      "external agent registration without approval",
      "private data exchange without consent",
      "authority/SOS claims without agreement",
    ],
    approvalRequiredFor: [
      "security",
      "legal",
      "infrastructure",
      "production",
      "auth",
      "user_data",
    ],
  },
];

export const protocolFabric: PantavionProtocolAdapter[] = [
  {
    id: "mcp_internal_tool_registry",
    name: "MCP Internal Tool Registry",
    status: "internal",
    purpose:
      "Register Pantavion-owned tools with scoped permissions and audit records before tool execution.",
    routeTarget: "/api/pantavion/agents/runtime/status",
    auditRequired: true,
    founderApprovalRequired: false,
  },
  {
    id: "a2a_external_agent_bridge",
    name: "A2A External Agent Bridge",
    status: "requires_adapter",
    purpose:
      "Allow external/enterprise agents only after registration, auth, scope checks, and founder/admin approval.",
    routeTarget: "/api/pantavion/agents/runtime/approval",
    auditRequired: true,
    founderApprovalRequired: true,
  },
  {
    id: "repo_agent_trace_audit",
    name: "Repository Agent Trace Audit",
    status: "internal",
    purpose:
      "Scan requested repo changes for prompt injection, unsafe commands, sensitive surfaces, and missing approval.",
    routeTarget: "/api/pantavion/agents/runtime/scan",
    auditRequired: true,
    founderApprovalRequired: true,
  },
];

export const sensitiveChangeClasses: Array<{
  risk: PantavionRiskClass;
  patterns: string[];
}> = [
  {
    risk: "auth",
    patterns: ["auth", "login", "session", "token", "oauth", "jwt", "otp"],
  },
  {
    risk: "billing",
    patterns: ["billing", "stripe", "payment", "invoice", "subscription"],
  },
  {
    risk: "production",
    patterns: ["vercel", "deploy", "production", "domain", "dns"],
  },
  {
    risk: "infrastructure",
    patterns: ["docker", "database", "queue", "cron", "storage", "provider"],
  },
  {
    risk: "security",
    patterns: ["secret", "key", "password", "permission", "admin", "policy"],
  },
  {
    risk: "legal",
    patterns: ["legal", "compliance", "gdpr", "terms", "privacy", "minor"],
  },
  {
    risk: "user_data",
    patterns: ["profile", "contact", "message", "location", "memory", "user"],
  },
  {
    risk: "dwg_source_truth",
    patterns: ["dwg", "cad", "water", "source-truth", "source_truth", "oda"],
  },
  {
    risk: "repo",
    patterns: ["git", "github", "commit", "merge", "pull request", "branch"],
  },
];

export const repoGuardrails = {
  forbiddenCommands: [
    "git add .",
    "git push --force",
    "git reset --hard",
    "rm -rf",
    "Remove-Item -Recurse -Force .",
  ],
  requiredChecks: [
    "npm run build",
    "npx tsc --noEmit --pretty false",
    "node scripts/pantavion-agent-runtime-guardrails-gate.cjs",
  ],
  requiredBeforeMerge: [
    "scoped git add only",
    "human-readable diff summary",
    "audit record",
    "founder approval for sensitive changes",
  ],
};

function normalizeText(input: PantavionAgentRuntimeScanInput) {
  return [
    input.title || "",
    input.description || "",
    ...(input.files || []),
    ...(input.routeTargets || []),
  ]
    .join(" ")
    .toLowerCase();
}

export function classifyPantavionChange(
  input: PantavionAgentRuntimeScanInput,
): PantavionRiskClass[] {
  const text = normalizeText(input);
  const detected = new Set<PantavionRiskClass>();

  for (const rule of sensitiveChangeClasses) {
    if (rule.patterns.some((pattern) => text.includes(pattern))) {
      detected.add(rule.risk);
    }
  }

  return Array.from(detected);
}

export function getPantavionAgentRuntimeStatus() {
  return {
    id: PANTAVION_AGENT_RUNTIME_ID,
    version: "1.0.0",
    status: "internal" as PantavionCapabilityStatus,
    productionClaim:
      "Internal runtime contract only. Production execution requires durable storage, auth, provider adapters, monitoring, and founder approval.",
    providerRegistry,
    protocolFabric,
    repoGuardrails,
    sensitiveChangeClasses,
    routes: [
      "/api/pantavion/agents/runtime/status",
      "/api/pantavion/agents/runtime/scan",
      "/api/pantavion/agents/runtime/approval",
    ],
  };
}

export async function appendPantavionAgentAuditRecord(
  record: PantavionAgentAuditRecord,
) {
  const auditDir = path.join(process.cwd(), ".pantavion", "agent-runtime");
  const auditPath = path.join(auditDir, "audit.jsonl");

  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditPath, JSON.stringify(record) + "\n", "utf8");

  return {
    ok: true,
    auditPath: ".pantavion/agent-runtime/audit.jsonl",
    record,
  };
}

export async function runPantavionRepoSafetyScan(
  input: PantavionAgentRuntimeScanInput,
) {
  const text = normalizeText(input);
  const riskClasses = classifyPantavionChange(input);

  const forbiddenMatches = repoGuardrails.forbiddenCommands.filter((command) =>
    text.includes(command.toLowerCase()),
  );

  const founderApprovalRequired =
    riskClasses.length > 0 || forbiddenMatches.length > 0;

  const status = founderApprovalRequired
    ? "requires_founder_approval"
    : "internal";

  const record: PantavionAgentAuditRecord = {
    id: "pantavion_agent_audit_" + Date.now(),
    runtimeId: PANTAVION_AGENT_RUNTIME_ID,
    createdAt: new Date().toISOString(),
    action: "repo_safety_scan",
    riskClasses,
    founderApprovalRequired,
    summary:
      input.title ||
      "Pantavion agent runtime scan completed without a supplied title.",
    touchedFiles: input.files || [],
    routeTargets: input.routeTargets || [],
    status,
  };

  const audit = await appendPantavionAgentAuditRecord(record);

  return {
    ok: true,
    runtimeId: PANTAVION_AGENT_RUNTIME_ID,
    status,
    founderApprovalRequired,
    riskClasses,
    forbiddenMatches,
    requiredChecks: repoGuardrails.requiredChecks,
    audit,
  };
}

export async function createPantavionFounderApprovalRequest(
  input: PantavionAgentRuntimeScanInput,
) {
  const riskClasses = classifyPantavionChange(input);

  const record: PantavionAgentAuditRecord = {
    id: "pantavion_founder_approval_" + Date.now(),
    runtimeId: PANTAVION_AGENT_RUNTIME_ID,
    createdAt: new Date().toISOString(),
    action: "founder_approval_request",
    riskClasses,
    founderApprovalRequired: true,
    summary:
      input.title ||
      "Founder approval requested for Pantavion sensitive runtime change.",
    touchedFiles: input.files || [],
    routeTargets: input.routeTargets || [],
    status: "requires_founder_approval",
  };

  const audit = await appendPantavionAgentAuditRecord(record);

  return {
    ok: true,
    status: "requires_founder_approval",
    founderApprovalRequired: true,
    approvalRecord: record,
    audit,
  };
}
