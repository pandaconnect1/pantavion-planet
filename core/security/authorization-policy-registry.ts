// core/security/authorization-policy-registry.ts

export type PantavionAuthorizationScope =
  | 'self-only'
  | 'tenant-bounded'
  | 'governor-bounded'
  | 'founder-only';

export interface PantavionAuthorizationPolicyRecord {
  policyKey: string;
  title: string;
  scope: PantavionAuthorizationScope;
  leastPrivilegeRequired: boolean;
  writeRestricted: boolean;
  humanApprovalRequired: boolean;
  notes: string[];
}

export interface PantavionAuthorizationPolicySnapshot {
  generatedAt: string;
  policyCount: number;
  selfOnlyCount: number;
  tenantBoundedCount: number;
  governorBoundedCount: number;
  founderOnlyCount: number;
  humanApprovalRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AUTHORIZATION_POLICIES: PantavionAuthorizationPolicyRecord[] = [
  {
    policyKey: 'memory-self-access',
    title: 'Memory Self Access',
    scope: 'self-only',
    leastPrivilegeRequired: true,
    writeRestricted: false,
    humanApprovalRequired: false,
    notes: ['Users may access only their own personal memory domain.'],
  },
  {
    policyKey: 'thread-cross-tenant-block',
    title: 'Thread Cross Tenant Block',
    scope: 'tenant-bounded',
    leastPrivilegeRequired: true,
    writeRestricted: true,
    humanApprovalRequired: false,
    notes: ['Cross-tenant thread access is blocked by default.'],
  },
  {
    policyKey: 'canonical-fact-finalization',
    title: 'Canonical Fact Finalization',
    scope: 'governor-bounded',
    leastPrivilegeRequired: true,
    writeRestricted: true,
    humanApprovalRequired: false,
    notes: ['Canonical memory writes require elevated governance.'],
  },
  {
    policyKey: 'global-governance-mutation',
    title: 'Global Governance Mutation',
    scope: 'founder-only',
    leastPrivilegeRequired: true,
    writeRestricted: true,
    humanApprovalRequired: true,
    notes: ['Global governance mutation remains founder-only.'],
  },
  {
    policyKey: 'commercial-pricing-change',
    title: 'Commercial Pricing Change',
    scope: 'founder-only',
    leastPrivilegeRequired: true,
    writeRestricted: true,
    humanApprovalRequired: true,
    notes: ['Global pricing policy changes require founder approval.'],
  },
];

export function listAuthorizationPolicyRecords(): PantavionAuthorizationPolicyRecord[] {
  return AUTHORIZATION_POLICIES.map((item) => cloneValue(item));
}

export function getAuthorizationPolicySnapshot(): PantavionAuthorizationPolicySnapshot {
  const list = listAuthorizationPolicyRecords();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    selfOnlyCount: list.filter((item) => item.scope === 'self-only').length,
    tenantBoundedCount: list.filter((item) => item.scope === 'tenant-bounded').length,
    governorBoundedCount: list.filter((item) => item.scope === 'governor-bounded').length,
    founderOnlyCount: list.filter((item) => item.scope === 'founder-only').length,
    humanApprovalRequiredCount: list.filter((item) => item.humanApprovalRequired).length,
  };
}

export default listAuthorizationPolicyRecords;
