// core/governance/founder-human-final-authority-policy.ts

import type {
  PantavionAuthorityDecisionDomain,
  PantavionAuthorityMode,
  PantavionAuthorityRiskTier,
} from './founder-human-final-authority-registry';
import { getFounderAuthorityRecord } from './founder-human-final-authority-registry';

export interface PantavionFounderAuthorityDecisionInput {
  domainKey: PantavionAuthorityDecisionDomain;
  requestedBy: string;
  requestedAction: string;
  founderApproved?: boolean;
  governorApproved?: boolean;
}

export interface PantavionFounderAuthorityDecisionOutput {
  domainKey: PantavionAuthorityDecisionDomain;
  authorityMode: PantavionAuthorityMode;
  riskTier: PantavionAuthorityRiskTier;
  allowed: boolean;
  requiredHumanFinalAuthority: boolean;
  requiredGovernorReview: boolean;
  reason: string;
}

export interface PantavionFounderAuthorityPolicySnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  founderRequiredCount: number;
  governorRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateFounderAuthorityDecision(
  input: PantavionFounderAuthorityDecisionInput,
): PantavionFounderAuthorityDecisionOutput {
  const record = getFounderAuthorityRecord(input.domainKey);

  if (!record) {
    return {
      domainKey: input.domainKey,
      authorityMode: 'proposal-only',
      riskTier: 'critical',
      allowed: false,
      requiredHumanFinalAuthority: true,
      requiredGovernorReview: true,
      reason: 'No authority record exists for this domain, so execution is blocked by default.',
    };
  }

  if (record.authorityMode === 'auto-executable') {
    return {
      domainKey: record.domainKey,
      authorityMode: record.authorityMode,
      riskTier: record.riskTier,
      allowed: true,
      requiredHumanFinalAuthority: false,
      requiredGovernorReview: false,
      reason: 'Domain is auto-executable by constitutional policy.',
    };
  }

  if (record.authorityMode === 'forbidden-without-founder' && !input.founderApproved) {
    return {
      domainKey: record.domainKey,
      authorityMode: record.authorityMode,
      riskTier: record.riskTier,
      allowed: false,
      requiredHumanFinalAuthority: true,
      requiredGovernorReview: record.governorReviewRequired,
      reason: 'Domain is forbidden unless founder final authority has explicitly approved it.',
    };
  }

  if (record.authorityMode === 'founder-final' && !input.founderApproved) {
    return {
      domainKey: record.domainKey,
      authorityMode: record.authorityMode,
      riskTier: record.riskTier,
      allowed: false,
      requiredHumanFinalAuthority: true,
      requiredGovernorReview: record.governorReviewRequired,
      reason: 'Founder final approval is required before execution.',
    };
  }

  if (record.governorReviewRequired && !input.governorApproved) {
    return {
      domainKey: record.domainKey,
      authorityMode: record.authorityMode,
      riskTier: record.riskTier,
      allowed: false,
      requiredHumanFinalAuthority: record.founderApprovalRequired,
      requiredGovernorReview: true,
      reason: 'Governor review is required before execution.',
    };
  }

  if (record.authorityMode === 'proposal-only') {
    return {
      domainKey: record.domainKey,
      authorityMode: record.authorityMode,
      riskTier: record.riskTier,
      allowed: false,
      requiredHumanFinalAuthority: record.founderApprovalRequired,
      requiredGovernorReview: record.governorReviewRequired,
      reason: 'Domain is proposal-only and may not auto-execute.',
    };
  }

  return {
    domainKey: record.domainKey,
    authorityMode: record.authorityMode,
    riskTier: record.riskTier,
    allowed: true,
    requiredHumanFinalAuthority: record.founderApprovalRequired,
    requiredGovernorReview: record.governorReviewRequired,
    reason: 'Authority conditions are satisfied for this domain.',
  };
}

export function getFounderAuthorityPolicySnapshot(
  evaluations: PantavionFounderAuthorityDecisionOutput[],
): PantavionFounderAuthorityPolicySnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: evaluations.length,
    allowedCount: evaluations.filter((item) => item.allowed).length,
    blockedCount: evaluations.filter((item) => !item.allowed).length,
    founderRequiredCount: evaluations.filter((item) => item.requiredHumanFinalAuthority).length,
    governorRequiredCount: evaluations.filter((item) => item.requiredGovernorReview).length,
  };
}

export default evaluateFounderAuthorityDecision;
