import type {
  PantavionBuildRecommendation,
  PantavionGap,
  PantavionPriority,
  PantavionSensitivity,
  PantavionTruthZone,
} from '../../types/pantavion';

export type PolicyPriority =
  | 'legal-safety-hard-rules'
  | 'identity-role-entitlement'
  | 'privacy-memory-sovereignty'
  | 'truth-provenance'
  | 'capability-health-scope'
  | 'resilience-fallback-degradation'
  | 'cost-latency-optimization'
  | 'style-presentation';

export interface PolicyRuleResult {
  priority: PolicyPriority;
  allowed: boolean;
  reviewRequired: boolean;
  reasons: string[];
  blockers: string[];
}

export interface PolicyEvaluation {
  allowed: boolean;
  reviewRequired: boolean;
  reviewType: 'none' | 'admin' | 'security' | 'identity' | 'legal';
  policyVersion: string;
  rules: PolicyRuleResult[];
  finalReasons: string[];
  blockers: string[];
}

const DANGEROUS_KEYWORDS = [
  'delete',
  'erase',
  'purge',
  'exfiltrate',
  'disable safety',
  'admin override',
  'bypass',
];

export function evaluatePolicy(input: {
  content: string;
  truthZone: PantavionTruthZone;
  sensitivity: PantavionSensitivity;
  priority: PantavionPriority;
  identityApproved: boolean;
  identityDenials: string[];
  hasAllowedCapability: boolean;
  runtimeGaps: PantavionGap[];
  buildRecommendation?: PantavionBuildRecommendation;
}): PolicyEvaluation {
  const text = input.content.toLowerCase();
  const dangerousHits = DANGEROUS_KEYWORDS.filter((keyword) => text.includes(keyword));

  const rules: PolicyRuleResult[] = [
    {
      priority: 'legal-safety-hard-rules',
      allowed: dangerousHits.length === 0,
      reviewRequired: dangerousHits.length > 0,
      reasons: dangerousHits.length ? dangerousHits.map((hit) => `dangerous-keyword:${hit}`) : ['no-hard-safety-hit'],
      blockers: dangerousHits,
    },
    {
      priority: 'identity-role-entitlement',
      allowed: input.identityApproved,
      reviewRequired: !input.identityApproved,
      reasons: input.identityApproved ? ['identity-approved'] : input.identityDenials,
      blockers: input.identityApproved ? [] : input.identityDenials,
    },
    {
      priority: 'privacy-memory-sovereignty',
      allowed: !(input.sensitivity === 'critical' && !input.identityApproved),
      reviewRequired: input.sensitivity === 'critical',
      reasons: input.sensitivity === 'critical' ? ['critical-sensitivity-demands-governed-review'] : ['privacy-boundary-clear'],
      blockers: input.sensitivity === 'critical' && !input.identityApproved ? ['critical-sensitivity-with-unapproved-identity'] : [],
    },
    {
      priority: 'truth-provenance',
      allowed: !(input.truthZone === 'verified' && input.content.trim().length < 4),
      reviewRequired: input.truthZone === 'verified',
      reasons: input.truthZone === 'verified' ? ['verified-zone-needs-anchored-evidence'] : ['truth-zone-clear'],
      blockers: input.truthZone === 'verified' && input.content.trim().length < 4 ? ['verified-zone-thin-evidence'] : [],
    },
    {
      priority: 'capability-health-scope',
      allowed: input.hasAllowedCapability,
      reviewRequired: !input.hasAllowedCapability,
      reasons: input.hasAllowedCapability ? ['allowed-capability-present'] : ['no-allowed-capability'],
      blockers: input.hasAllowedCapability ? [] : ['no-allowed-capability'],
    },
    {
      priority: 'resilience-fallback-degradation',
      allowed: input.runtimeGaps.filter((gap) => gap.severity === 'critical').length === 0,
      reviewRequired: input.runtimeGaps.length > 0,
      reasons: input.runtimeGaps.length ? input.runtimeGaps.map((gap) => gap.id) : ['resilience-clear'],
      blockers: input.runtimeGaps.filter((gap) => gap.severity === 'critical').map((gap) => gap.id),
    },
    {
      priority: 'cost-latency-optimization',
      allowed: true,
      reviewRequired: false,
      reasons: ['not-a-hard-blocker-at-foundation-v1'],
      blockers: [],
    },
    {
      priority: 'style-presentation',
      allowed: true,
      reviewRequired: false,
      reasons: ['style-is-never-a-hard-blocker'],
      blockers: [],
    },
  ];

  const blockers = [...new Set(rules.flatMap((rule) => rule.blockers))];
  const allowed = rules.every((rule) => rule.allowed);
  const reviewRequired = rules.some((rule) => rule.reviewRequired);
  const reviewType: PolicyEvaluation['reviewType'] =
    !allowed ? 'security' :
    !input.identityApproved ? 'identity' :
    dangerousHits.length ? 'legal' :
    reviewRequired ? 'admin' :
    'none';

  return {
    allowed,
    reviewRequired,
    reviewType,
    policyVersion: 'pantavion-policy-v1',
    rules,
    finalReasons: [...new Set(rules.flatMap((rule) => rule.reasons))],
    blockers,
  };
}