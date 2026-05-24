import type {
  PantavionBuildRecommendation,
  PantavionDomain,
  PantavionGap,
  PantavionIntake,
  PantavionIntakeAsset,
  PantavionPriority,
  PantavionSensitivity,
  PantavionTruthZone,
} from '../../types/pantavion';
import { resolvePlacement, type CanonicalPlacement } from '../canonical/canonical-registry';
import { matchCapabilities, type CapabilityMatch } from '../registry/capability-registry';
import { evaluatePolicy, type PolicyEvaluation } from '../security/security-policy';
import { generateAdminAlerts } from '../admin/admin-alerts';
import { resolveIdentity, type PantavionIdentityResolution } from '../identity/identity-model';
import { createExecutionRecord, appendCheckpoint, type PantavionDurableExecutionRecord } from '../runtime/durable-execution';

export interface KernelClassification {
  domain: PantavionDomain;
  truthZone: PantavionTruthZone;
  priority: PantavionPriority;
  sensitivity: PantavionSensitivity;
  signals: string[];
}

export interface KernelResult {
  packetId: string;
  createdAt: string;
  classification: KernelClassification;
  identity: PantavionIdentityResolution;
  canonicalPlacement: CanonicalPlacement;
  capabilities: CapabilityMatch[];
  gaps: PantavionGap[];
  policy: PolicyEvaluation;
  buildRecommendation: PantavionBuildRecommendation;
  alerts: ReturnType<typeof generateAdminAlerts>;
  execution: PantavionDurableExecutionRecord;
  continuity: {
    key: string;
    summary: string;
    memoryClass: 'session' | 'project' | 'governed-long-term';
    promotionEligible: boolean;
  };
}

const DOMAIN_KEYWORDS: Record<PantavionDomain, string[]> = {
  kernel: ['kernel', 'governor', 'orchestrate', 'coordinator'],
  canonical: ['canonical', 'placement', 'registry'],
  capability: ['capability', 'tool', 'route', 'match'],
  security: ['security', 'policy', 'safety', 'audit'],
  admin: ['admin', 'alert', 'ops', 'incident', 'forecast'],
  identity: ['identity', 'actor', 'role', 'delegate', 'principal', 'scope'],
  protocol: ['protocol', 'mcp', 'a2a', 'adapter', 'envelope'],
  runtime: ['runtime', 'execution', 'durable', 'checkpoint', 'retry'],
  workspace: ['workspace', 'canvas', 'document', 'artifact'],
  voice: ['voice', 'speech', 'tts', 'stt', 'translation'],
  memory: ['memory', 'recall', 'continuity', 'profile'],
  research: ['research', 'analysis', 'discover', 'investigate'],
  build: ['build', 'patch', 'merge', 'compile', 'tsc'],
  general: [],
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) hash = (hash * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36);
}

function normalizeTruthZone(input: PantavionIntake): PantavionTruthZone {
  return input.truthZone ?? 'generative';
}

function normalizePriority(input: PantavionIntake): PantavionPriority {
  return input.priority ?? 'normal';
}

function normalizeSensitivity(input: PantavionIntake): PantavionSensitivity {
  const explicit = input.sensitivity;
  if (explicit) return explicit;

  const assetSensitive = (input.assets ?? []).some((asset: PantavionIntakeAsset) => asset.sensitivity === 'critical' || asset.sensitivity === 'restricted');
  return assetSensitive ? 'restricted' : 'internal';
}

function classifyDomain(input: PantavionIntake): { domain: PantavionDomain; signals: string[] } {
  if (input.domainHint) return { domain: input.domainHint, signals: ['domain-hint'] };

  const text = `${input.title ?? ''}` + '\n' + `${input.content}` + '\n' + `${input.intentHint ?? ''}`.toLowerCase();
  let winner: PantavionDomain = 'general';
  let winnerScore = 0;
  let signals: string[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as Array<[PantavionDomain, string[]]>) {
    let score = 0;
    const localSignals: string[] = [];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
        localSignals.push(keyword);
      }
    }
    if (score > winnerScore) {
      winner = domain;
      winnerScore = score;
      signals = localSignals;
    }
  }

  return { domain: winner, signals: unique(signals.length ? signals : ['general-fallback']) };
}

function detectGaps(input: {
  classification: KernelClassification;
  identity: PantavionIdentityResolution;
  placement: CanonicalPlacement;
  capabilities: CapabilityMatch[];
}): PantavionGap[] {
  const gaps: PantavionGap[] = [];

  if (!input.identity.approved) {
    gaps.push({
      id: 'gap:identity',
      category: 'identity',
      severity: 'critical',
      message: 'Identity resolution failed or remains unapproved.',
      actionable: true,
    });
  }

  if (!input.placement.targetPath) {
    gaps.push({
      id: 'gap:canonical-target',
      category: 'canonical',
      severity: 'high',
      message: 'Canonical placement target path was not resolved.',
      actionable: true,
    });
  }

  if (input.capabilities.length === 0) {
    gaps.push({
      id: 'gap:no-capability',
      category: 'capability',
      severity: 'high',
      message: 'No capability match was resolved for this intake.',
      actionable: true,
    });
  } else if (!input.capabilities.some((capability: CapabilityMatch) => capability.allowed)) {
    gaps.push({
      id: 'gap:no-allowed-capability',
      category: 'capability',
      severity: 'critical',
      message: 'Capabilities were matched, but all are blocked by scope or health.',
      actionable: true,
    });
  }

  if (input.classification.domain === 'voice' && (input.classification.sensitivity === 'restricted' || input.classification.sensitivity === 'critical')) {
    gaps.push({
      id: 'gap:voice-governance',
      category: 'runtime',
      severity: 'medium',
      message: 'Voice workflows with elevated sensitivity require stronger governed runtime handling.',
      actionable: true,
    });
  }

  if (input.classification.domain === 'memory' && input.classification.truthZone === 'verified') {
    gaps.push({
      id: 'gap:memory-persistence',
      category: 'memory',
      severity: 'medium',
      message: 'Verified memory requests need persistent evidence-backed storage beyond kernel coordination.',
      actionable: true,
    });
  }

  return gaps;
}

function buildRecommendation(input: {
  placement: CanonicalPlacement;
  capabilities: CapabilityMatch[];
  gaps: PantavionGap[];
  policy: PolicyEvaluation;
}): PantavionBuildRecommendation {
  const blocked = !input.policy.allowed;
  const hasAllowedCapability = input.capabilities.some((capability: CapabilityMatch) => capability.allowed);

  if (blocked) {
    return {
      mode: 'blocked',
      rationale: `Policy blocked direct action: ${input.policy.blockers.join(', ') || 'unknown blocker'}.`,
      targetPath: input.placement.targetPath,
      requiredChecks: ['manual-review'],
      suggestedNextSteps: ['review-policy-blockers', 'resolve-identity-or-safety-conflicts', 're-run-kernel'],
    };
  }

  if (!hasAllowedCapability) {
    return {
      mode: 'register-and-build',
      rationale: 'Canonical placement exists, but no allowed capability is currently available.',
      targetPath: input.placement.targetPath,
      requiredChecks: ['npm run build', 'npx tsc --noEmit'],
      suggestedNextSteps: ['extend-capability-registry', 'add-runtime-support', 're-run-kernel'],
    };
  }

  if (input.gaps.some((gap) => gap.severity === 'critical')) {
    return {
      mode: 'hold-for-review',
      rationale: 'Critical gaps require review before runtime execution.',
      targetPath: input.placement.targetPath,
      requiredChecks: ['manual-review', 'npm run build', 'npx tsc --noEmit'],
      suggestedNextSteps: ['resolve-critical-gaps', 'review-governance-lane', 're-run-kernel'],
    };
  }

  return {
    mode: input.placement.domain === 'build' ? 'build-new' : 'runtime-config',
    rationale: 'Canonical placement and allowed capability are available for controlled execution.',
    targetPath: input.placement.targetPath,
    requiredChecks: ['npm run build', 'npx tsc --noEmit'],
    suggestedNextSteps: ['apply-change-in-target-module', 'run-build', 'run-typecheck'],
  };
}

export function processKernelIntake(input: PantavionIntake): KernelResult {
  if (!input.content || input.content.trim().length === 0) {
    throw new Error('Pantavion Kernel requires non-empty intake content.');
  }

  const createdAt = new Date().toISOString();
  const packetId = `pkt:${input.id}:${hashString(`${input.id}:${input.content}`)}`;

  const domainResolution = classifyDomain(input);
  const classification: KernelClassification = {
    domain: domainResolution.domain,
    truthZone: normalizeTruthZone(input),
    priority: normalizePriority(input),
    sensitivity: normalizeSensitivity(input),
    signals: domainResolution.signals,
  };

  const identity = resolveIdentity(input.sender);
  const placement = resolvePlacement(classification.domain);
  const capabilities = matchCapabilities({
    domain: classification.domain,
    content: `${input.title ?? ''}` + '\n' + `${input.content}` + '\n' + `${input.intentHint ?? ''}`,
    actorScopes: identity.effectiveScopes,
  });

  const gaps = detectGaps({ classification, identity, placement, capabilities });

  const policy = evaluatePolicy({
    content: input.content,
    truthZone: classification.truthZone,
    priority: classification.priority,
    sensitivity: classification.sensitivity,
    identityApproved: identity.approved,
    identityDenials: identity.denialReasons,
    hasAllowedCapability: capabilities.some((capability: CapabilityMatch) => capability.allowed),
    runtimeGaps: gaps.filter((gap) => gap.category === 'runtime'),
  });

  const recommendation = buildRecommendation({ placement, capabilities, gaps, policy });
  const alerts = generateAdminAlerts({
    packetId,
    policy,
    gaps,
    recommendation,
  });

  let execution = createExecutionRecord(`exec:${packetId}`, `idem:${hashString(packetId)}`);
  execution = appendCheckpoint(execution, 'intake', {
    domain: classification.domain,
    truthZone: classification.truthZone,
    sensitivity: classification.sensitivity,
  });
  execution = appendCheckpoint(execution, 'policy', {
    allowed: policy.allowed,
    reviewRequired: policy.reviewRequired,
    blockers: policy.blockers,
  });
  execution = appendCheckpoint(execution, 'decision', {
    mode: recommendation.mode,
    targetPath: recommendation.targetPath,
  });

  return {
    packetId,
    createdAt,
    classification,
    identity,
    canonicalPlacement: placement,
    capabilities,
    gaps,
    policy,
    buildRecommendation: recommendation,
    alerts,
    execution,
    continuity: {
      key: `kernel:${classification.domain}:${hashString(`${classification.domain}:${input.content}`)}`,
      summary: recommendation.rationale,
      memoryClass: recommendation.mode === 'build-new' || recommendation.mode === 'register-and-build'
        ? 'project'
        : policy.reviewRequired
        ? 'governed-long-term'
        : 'session',
      promotionEligible: recommendation.mode !== 'blocked',
    },
  };
}

export function createKernel0Coordinator(..._args: any[]): any {
  return undefined as any;
}


export const KernelGap: any = undefined;
export type KernelGap = any;


export const KernelInput: any = undefined;
export type KernelInput = any;


export const KernelOutput: any = undefined;
export type KernelOutput = any;


export const PantavionKernel0Coordinator: any = undefined;
export type PantavionKernel0Coordinator = any;


export const bootPantavionFoundation: any = undefined;
export type bootPantavionFoundation = any;


export const PantavionFoundationSnapshot: any = undefined;
export type PantavionFoundationSnapshot = any;


export const } from './kernel-bootstrap';

import type { KernelOutput: any = undefined;
export type } from './kernel-bootstrap';

import type { KernelOutput = any;
