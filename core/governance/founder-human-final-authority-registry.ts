// core/governance/founder-human-final-authority-registry.ts

export type PantavionAuthorityDecisionDomain =
  | 'constitutional-mutation'
  | 'constitutional-kernel-promotion'
  | 'constitutional-kernel-retirement'
  | 'derivative-kernel-promotion'
  | 'derivative-kernel-retirement'
  | 'ai-root-provider-admission'
  | 'ai-provider-promotion'
  | 'global-locale-sovereignty-change'
  | 'global-commercial-policy'
  | 'sovereign-deployment-mode'
  | 'irreversible-memory-deletion'
  | 'regulatory-override'
  | 'high-risk-runtime-execution'
  | 'canonical-fact-finalization'
  | 'thread-reminder-continuity';

export type PantavionAuthorityMode =
  | 'founder-final'
  | 'governor-gated'
  | 'proposal-only'
  | 'auto-executable'
  | 'forbidden-without-founder';

export type PantavionAuthorityRiskTier =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface PantavionFounderAuthorityRecord {
  domainKey: PantavionAuthorityDecisionDomain;
  title: string;
  authorityMode: PantavionAuthorityMode;
  riskTier: PantavionAuthorityRiskTier;
  founderApprovalRequired: boolean;
  governorReviewRequired: boolean;
  autoExecutionAllowed: boolean;
  rationale: string;
}

export interface PantavionFounderAuthorityRegistrySnapshot {
  generatedAt: string;
  domainCount: number;
  founderFinalCount: number;
  governorGatedCount: number;
  proposalOnlyCount: number;
  autoExecutableCount: number;
  forbiddenWithoutFounderCount: number;
  criticalCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const FOUNDER_AUTHORITY_REGISTRY: PantavionFounderAuthorityRecord[] = [
  {
    domainKey: 'constitutional-mutation',
    title: 'Constitutional Mutation',
    authorityMode: 'forbidden-without-founder',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'No constitutional mutation may happen without founder final authority.',
  },
  {
    domainKey: 'constitutional-kernel-promotion',
    title: 'Constitutional Kernel Promotion',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Root kernel promotion changes the civilization structure and must remain founder-final.',
  },
  {
    domainKey: 'constitutional-kernel-retirement',
    title: 'Constitutional Kernel Retirement',
    authorityMode: 'forbidden-without-founder',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Root kernel retirement is irreversible at civilization level and must never occur without founder approval.',
  },
  {
    domainKey: 'derivative-kernel-promotion',
    title: 'Derivative Kernel Promotion',
    authorityMode: 'governor-gated',
    riskTier: 'high',
    founderApprovalRequired: false,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Derivative kernels may evolve under governor review, but not as blind auto-promotion.',
  },
  {
    domainKey: 'derivative-kernel-retirement',
    title: 'Derivative Kernel Retirement',
    authorityMode: 'governor-gated',
    riskTier: 'high',
    founderApprovalRequired: false,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Derivative retirement requires migration safety and governor review.',
  },
  {
    domainKey: 'ai-root-provider-admission',
    title: 'AI Root Provider Admission',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Admission of a root intelligence provider changes sovereign architecture and must remain founder-final.',
  },
  {
    domainKey: 'ai-provider-promotion',
    title: 'AI Provider Promotion',
    authorityMode: 'governor-gated',
    riskTier: 'high',
    founderApprovalRequired: false,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Provider promotion requires controlled trust, latency and compliance review.',
  },
  {
    domainKey: 'global-locale-sovereignty-change',
    title: 'Global Locale Sovereignty Change',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Locale sovereignty rules affect all humans globally and must remain founder-final.',
  },
  {
    domainKey: 'global-commercial-policy',
    title: 'Global Commercial Policy',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Global commercial policy determines pricing power and platform economics.',
  },
  {
    domainKey: 'sovereign-deployment-mode',
    title: 'Sovereign Deployment Mode',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Sovereign deployment modes affect global trust and infrastructure posture.',
  },
  {
    domainKey: 'irreversible-memory-deletion',
    title: 'Irreversible Memory Deletion',
    authorityMode: 'forbidden-without-founder',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Irreversible destruction of deep memory requires the strictest human authority.',
  },
  {
    domainKey: 'regulatory-override',
    title: 'Regulatory Override',
    authorityMode: 'founder-final',
    riskTier: 'critical',
    founderApprovalRequired: true,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Regulatory override can affect lawful operation across jurisdictions and must remain founder-final.',
  },
  {
    domainKey: 'high-risk-runtime-execution',
    title: 'High Risk Runtime Execution',
    authorityMode: 'governor-gated',
    riskTier: 'high',
    founderApprovalRequired: false,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'High-risk runtime actions require governor review before execution.',
  },
  {
    domainKey: 'canonical-fact-finalization',
    title: 'Canonical Fact Finalization',
    authorityMode: 'governor-gated',
    riskTier: 'medium',
    founderApprovalRequired: false,
    governorReviewRequired: true,
    autoExecutionAllowed: false,
    rationale: 'Canonical facts require governance review before they become authoritative truth.',
  },
  {
    domainKey: 'thread-reminder-continuity',
    title: 'Thread Reminder Continuity',
    authorityMode: 'auto-executable',
    riskTier: 'low',
    founderApprovalRequired: false,
    governorReviewRequired: false,
    autoExecutionAllowed: true,
    rationale: 'Reminder and thread continuity actions should flow automatically for user benefit.',
  },
];

export function listFounderAuthorityRecords(): PantavionFounderAuthorityRecord[] {
  return FOUNDER_AUTHORITY_REGISTRY.map((item) => cloneValue(item));
}

export function getFounderAuthorityRecord(
  domainKey: PantavionAuthorityDecisionDomain,
): PantavionFounderAuthorityRecord | null {
  const item = FOUNDER_AUTHORITY_REGISTRY.find((entry) => entry.domainKey === domainKey);
  return item ? cloneValue(item) : null;
}

export function getFounderAuthorityRegistrySnapshot(): PantavionFounderAuthorityRegistrySnapshot {
  const list = listFounderAuthorityRecords();

  return {
    generatedAt: nowIso(),
    domainCount: list.length,
    founderFinalCount: list.filter((item) => item.authorityMode === 'founder-final').length,
    governorGatedCount: list.filter((item) => item.authorityMode === 'governor-gated').length,
    proposalOnlyCount: list.filter((item) => item.authorityMode === 'proposal-only').length,
    autoExecutableCount: list.filter((item) => item.authorityMode === 'auto-executable').length,
    forbiddenWithoutFounderCount: list.filter((item) => item.authorityMode === 'forbidden-without-founder').length,
    criticalCount: list.filter((item) => item.riskTier === 'critical').length,
  };
}

export default listFounderAuthorityRecords;
