import type {
  PantavionApprovalMode,
  PantavionPermissionLevel,
  PantavionSensitivity,
} from "../kernel/capability-broker-contract";

export type PantavionMcpServerTrust = "untrusted" | "reviewed" | "trusted_internal";

export interface PantavionMcpToolPolicy {
  readonly serverId: string;
  readonly serverTrust: PantavionMcpServerTrust;
  readonly manifestHash?: string;
  readonly allowedTools: readonly string[];
  readonly deniedTools: readonly string[];
  readonly maxToolCalls: number;
  readonly timeoutMs: number;
  readonly maxCostEur: number;
  readonly permissions: readonly PantavionPermissionLevel[];
  readonly sensitivity: PantavionSensitivity;
  readonly approvalMode: PantavionApprovalMode;
  readonly auditRequired: boolean;
  readonly structuredErrorsRequired: boolean;
  readonly promptInjectionBoundary: "sanitize_metadata" | "block_untrusted_metadata";
  readonly notes: string;
}

export interface PantavionMcpToolDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly auditRequired: boolean;
  readonly founderActionRequired: boolean;
}

export const PANTAVION_DEFAULT_MCP_POLICY: PantavionMcpToolPolicy = {
  serverId: "mcp.default_untrusted",
  serverTrust: "untrusted",
  allowedTools: [],
  deniedTools: ["*"],
  maxToolCalls: 0,
  timeoutMs: 0,
  maxCostEur: 0,
  permissions: ["read"],
  sensitivity: "normal",
  approvalMode: "founder_approval_required",
  auditRequired: true,
  structuredErrorsRequired: true,
  promptInjectionBoundary: "block_untrusted_metadata",
  notes:
    "MCP servers are untrusted by default. No direct MCP execution without allowlist, manifest review, scoped permission, timeout/cost budget and audit trace.",
};

export function evaluateMcpToolRequest(
  policy: PantavionMcpToolPolicy,
  toolName: string,
  permission: PantavionPermissionLevel,
): PantavionMcpToolDecision {
  if (policy.serverTrust === "untrusted") {
    return {
      allowed: false,
      reason: "MCP server is untrusted by default.",
      auditRequired: true,
      founderActionRequired: true,
    };
  }

  if (policy.deniedTools.includes("*") || policy.deniedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: "MCP tool is denied by policy.",
      auditRequired: policy.auditRequired,
      founderActionRequired: true,
    };
  }

  if (!policy.allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: "MCP tool is not explicitly allowlisted.",
      auditRequired: policy.auditRequired,
      founderActionRequired: true,
    };
  }

  if (!policy.permissions.includes(permission)) {
    return {
      allowed: false,
      reason: "Requested permission is outside MCP policy scope.",
      auditRequired: policy.auditRequired,
      founderActionRequired: true,
    };
  }

  if (policy.approvalMode === "founder_approval_required") {
    return {
      allowed: false,
      reason: "Founder approval is required before MCP execution.",
      auditRequired: policy.auditRequired,
      founderActionRequired: true,
    };
  }

  return {
    allowed: true,
    reason: "MCP request is allowed by policy.",
    auditRequired: policy.auditRequired,
    founderActionRequired: false,
  };
}
