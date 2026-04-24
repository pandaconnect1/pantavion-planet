// core/security/prompt-tool-security-policy.ts

export interface PantavionPromptToolSecurityRecord {
  policyKey: string;
  title: string;
  untrustedPromptBlockedFromPrivilegeGain: boolean;
  toolAllowlistRequired: boolean;
  crossThreadIsolationRequired: boolean;
  memoryPoisoningDefenseRequired: boolean;
  notes: string[];
}

export interface PantavionPromptToolSecuritySnapshot {
  generatedAt: string;
  policyCount: number;
  toolAllowlistRequiredCount: number;
  crossThreadIsolationRequiredCount: number;
  memoryPoisoningDefenseRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const PROMPT_TOOL_POLICIES: PantavionPromptToolSecurityRecord[] = [
  {
    policyKey: 'no-prompt-privilege-escalation',
    title: 'No Prompt Privilege Escalation',
    untrustedPromptBlockedFromPrivilegeGain: true,
    toolAllowlistRequired: true,
    crossThreadIsolationRequired: true,
    memoryPoisoningDefenseRequired: true,
    notes: ['Prompts must never directly gain higher tool privileges.'],
  },
  {
    policyKey: 'tool-allowlist-per-capability',
    title: 'Tool Allowlist Per Capability',
    untrustedPromptBlockedFromPrivilegeGain: true,
    toolAllowlistRequired: true,
    crossThreadIsolationRequired: true,
    memoryPoisoningDefenseRequired: false,
    notes: ['Each capability must have explicit tool boundaries.'],
  },
  {
    policyKey: 'canonical-memory-write-guard',
    title: 'Canonical Memory Write Guard',
    untrustedPromptBlockedFromPrivilegeGain: true,
    toolAllowlistRequired: true,
    crossThreadIsolationRequired: true,
    memoryPoisoningDefenseRequired: true,
    notes: ['Canonical writes require guarded paths and trust weighting.'],
  },
];

export function listPromptToolSecurityPolicies(): PantavionPromptToolSecurityRecord[] {
  return PROMPT_TOOL_POLICIES.map((item) => cloneValue(item));
}

export function getPromptToolSecuritySnapshot(): PantavionPromptToolSecuritySnapshot {
  const list = listPromptToolSecurityPolicies();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    toolAllowlistRequiredCount: list.filter((item) => item.toolAllowlistRequired).length,
    crossThreadIsolationRequiredCount: list.filter((item) => item.crossThreadIsolationRequired).length,
    memoryPoisoningDefenseRequiredCount: list.filter((item) => item.memoryPoisoningDefenseRequired).length,
  };
}

export default listPromptToolSecurityPolicies;
