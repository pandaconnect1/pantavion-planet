// core/kernel/kernel-admission.ts

import type { KernelGap, KernelInput, KernelOutput } from './kernel';
import { pantavionFoundation } from './kernel-bootstrap';

import {
  evaluateCapabilityFamilyCandidate,
  registerCapabilityFamilyEntry,
  type PantavionCapabilityEntryKind,
  type PantavionCapabilityRegistryDisposition,
  type PantavionCapabilityRiskClass,
} from '../registry/capability-family-registry';

export type PantavionAdmissionObjectKind =
  | 'capability'
  | 'module'
  | 'runtime'
  | 'workspace'
  | 'protocol-adapter'
  | 'service'
  | 'governed-surface'
  | 'registry-family';

export type PantavionAdmissionDecision =
  | 'admit'
  | 'review'
  | 'defer'
  | 'reject';

export interface PantavionAdmissionMetadata {
  [key: string]: unknown;
}

export interface PantavionAdmissionCandidateInput {
  title: string;
  description: string;
  objectKind: PantavionAdmissionObjectKind;
  familyKeyHint?: string;
  entryKind?: PantavionCapabilityEntryKind;
  targetPath?: string;
  targetModule?: string;
  requestedCapabilities?: string[];
  tags?: string[];
  protocolFamilies?: string[];
  runtimeFamilies?: string[];
  riskHint?: PantavionCapabilityRiskClass;
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  truthPreference?: 'deterministic' | 'verified' | 'generative';
  actorId?: string;
  actorRole?: string;
  actorScopes?: string[];
  metadata?: PantavionAdmissionMetadata;
}

export interface PantavionAdmissionDecisionRecord {
  id: string;
  createdAt: string;
  candidate: PantavionAdmissionCandidateInput;
  decision: PantavionAdmissionDecision;
  registryDisposition: PantavionCapabilityRegistryDisposition;
  recommendedFamilyKey?: string;
  admittedEntryKey?: string;
  reasons: string[];
  nextActions: string[];
  kernelRecommendationStatus: KernelOutput['recommendation']['status'];
  kernelGapSummary: {
    total: number;
    critical: number;
    material: number;
  };
  kernelDecisionId: string;
  metadata: PantavionAdmissionMetadata;
}

export interface PantavionAdmissionRunOutput {
  record: PantavionAdmissionDecisionRecord;
  kernel: KernelOutput;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function summarizeKernelGaps(gaps: KernelGap[]): {
  total: number;
  critical: number;
  material: number;
} {
  return {
    total: gaps.length,
    critical: gaps.filter((gap) => gap.severity === 'critical').length,
    material: gaps.filter((gap) => gap.severity === 'material').length,
  };
}

function mapObjectKindToEntryKind(
  objectKind: PantavionAdmissionObjectKind,
): PantavionCapabilityEntryKind {
  switch (objectKind) {
    case 'module':
      return 'module';
    case 'runtime':
      return 'runtime';
    case 'workspace':
      return 'workspace';
    case 'protocol-adapter':
      return 'adapter';
    case 'service':
      return 'service';
    case 'governed-surface':
      return 'governed-surface';
    case 'registry-family':
      return 'surface';
    default:
      return 'capability';
  }
}

function deriveDecision(input: {
  registryDisposition: PantavionCapabilityRegistryDisposition;
  kernel: KernelOutput;
  gapSummary: { total: number; critical: number; material: number };
  candidate: PantavionAdmissionCandidateInput;
}): PantavionAdmissionDecision {
  if (input.kernel.policy.disposition === 'deny') {
    return 'reject';
  }

  if (
    input.registryDisposition === 'review' ||
    input.kernel.policy.disposition === 'review' ||
    input.gapSummary.critical > 0
  ) {
    return 'review';
  }

  if (
    input.kernel.recommendation.status === 'gap-close-first' ||
    input.gapSummary.material > 0
  ) {
    return 'defer';
  }

  if (input.registryDisposition === 'reject') {
    return 'reject';
  }

  if (
    input.kernel.recommendation.status === 'ready-to-build' ||
    input.kernel.recommendation.status === 'ready-to-route'
  ) {
    return 'admit';
  }

  return 'review';
}

export class PantavionKernelAdmission {
  private readonly history: PantavionAdmissionDecisionRecord[] = [];

  async evaluateCandidate(
    candidate: PantavionAdmissionCandidateInput,
  ): Promise<PantavionAdmissionRunOutput> {
    const actorId = safeText(candidate.actorId, pantavionFoundation.actors.adminRoot.id);

    const identity = pantavionFoundation.resolveIdentity({
      actorId,
      actorType: 'human',
      role: safeText(candidate.actorRole, 'admin-operator'),
      scopes: candidate.actorScopes ?? ['global'],
      requestedOperation: 'kernel admission',
      requestedSensitivity: candidate.sensitivity ?? 'internal',
    });

    const kernelInput: KernelInput = {
      title: candidate.title,
      description: candidate.description,
      inputText: [
        candidate.objectKind,
        candidate.familyKeyHint,
        candidate.targetPath,
        candidate.targetModule,
        ...(candidate.tags ?? []),
      ]
        .filter(Boolean)
        .join(' '),
      requestedOperation: 'build',
      requestedCapabilities: uniqStrings([
        'capability-lookup',
        'policy-evaluation',
        'gap-detection',
        'build-recommendation',
        ...(candidate.requestedCapabilities ?? []),
      ]),
      targetPath: safeText(candidate.targetPath) || undefined,
      targetModule: safeText(candidate.targetModule) || undefined,
      truthPreference: candidate.truthPreference ?? 'deterministic',
      memoryClass: 'session',
      sensitivity: candidate.sensitivity ?? 'internal',
      actor: {
        actorId: identity.actorId,
        actorType: identity.actorType,
        role: identity.effectiveRoles[0],
        scopes: identity.effectiveScopes,
        delegatedBy: identity.delegatedBy,
        trustTierHint: identity.trustTier,
      },
      metadata: {
        admission: true,
        objectKind: candidate.objectKind,
        ...(candidate.metadata ?? {}),
      },
    };

    const kernel = await pantavionFoundation.process(kernelInput);

    const registryEvaluation = evaluateCapabilityFamilyCandidate({
      title: candidate.title,
      description: candidate.description,
      entryKind: candidate.entryKind ?? mapObjectKindToEntryKind(candidate.objectKind),
      familyKeyHint: candidate.familyKeyHint,
      tags: candidate.tags,
      targetPath: candidate.targetPath,
      targetModule: candidate.targetModule,
      riskHint: candidate.riskHint,
      protocolFamilies: candidate.protocolFamilies,
      runtimeFamilies: candidate.runtimeFamilies,
    });

    const gapSummary = summarizeKernelGaps(kernel.gaps);
    const decision = deriveDecision({
      registryDisposition: registryEvaluation.disposition,
      kernel,
      gapSummary,
      candidate,
    });

    let admittedEntryKey: string | undefined;

    if (decision === 'admit' && registryEvaluation.recommendedFamilyKey) {
      admittedEntryKey = createAdmissionEntryKey(candidate.title, candidate.objectKind);

      registerCapabilityFamilyEntry({
        entryKey: admittedEntryKey,
        familyKey: registryEvaluation.recommendedFamilyKey,
        kind: candidate.entryKind ?? mapObjectKindToEntryKind(candidate.objectKind),
        title: candidate.title,
        description: candidate.description,
        lifecycle: 'candidate',
        trustFloor:
          kernel.identity.trustTier === 'system' ? 'system' : kernel.identity.trustTier,
        approvalTier: kernel.identity.approvalTier,
        riskClass: candidate.riskHint ?? deriveRiskFromKernel(kernel),
        tags: candidate.tags ?? [],
        canonicalPaths: candidate.targetPath ? [candidate.targetPath] : [],
        protocolFamilies: candidate.protocolFamilies ?? [],
        runtimeFamilies: candidate.runtimeFamilies ?? [],
        metadata: {
          admission: true,
          kernelDecisionId: kernel.decision.id,
          candidateKind: candidate.objectKind,
          ...(candidate.metadata ?? {}),
        },
      });
    }

    const reasons = uniqStrings([
      ...registryEvaluation.reasons,
      ...kernel.explainability.recommendationWhy,
      ...(kernel.policy.reasons ?? []),
    ]);

    const nextActions = uniqStrings([
      ...registryEvaluation.nextActions,
      ...kernel.recommendation.nextSteps,
      ...(decision === 'admit'
        ? ['Promote candidate into active lifecycle after real validation.']
        : []),
    ]);

    const record: PantavionAdmissionDecisionRecord = {
      id: createId('adm'),
      createdAt: nowIso(),
      candidate,
      decision,
      registryDisposition: registryEvaluation.disposition,
      recommendedFamilyKey: registryEvaluation.recommendedFamilyKey,
      admittedEntryKey,
      reasons,
      nextActions,
      kernelRecommendationStatus: kernel.recommendation.status,
      kernelGapSummary: gapSummary,
      kernelDecisionId: kernel.decision.id,
      metadata: candidate.metadata ?? {},
    };

    this.history.unshift(record);

    return {
      record,
      kernel,
    };
  }

  getHistory(): PantavionAdmissionDecisionRecord[] {
    return [...this.history];
  }
}

function deriveRiskFromKernel(kernel: KernelOutput): PantavionCapabilityRiskClass {
  if (kernel.policy.riskPosture === 'admin-only' || kernel.policy.riskPosture === 'restricted') {
    return 'restricted';
  }
  if (kernel.policy.riskPosture === 'high-stakes') {
    return 'high';
  }
  if (kernel.classification.severity === 'high' || kernel.classification.severity === 'critical') {
    return 'high';
  }
  if (kernel.classification.severity === 'medium') {
    return 'medium';
  }
  return 'low';
}

function createAdmissionEntryKey(
  title: string,
  objectKind: PantavionAdmissionObjectKind,
): string {
  const normalized = safeText(title, 'candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${objectKind}:${normalized}`;
}

export function createKernelAdmission(): PantavionKernelAdmission {
  return new PantavionKernelAdmission();
}

export const kernelAdmission = createKernelAdmission();

export async function evaluateKernelAdmission(
  candidate: PantavionAdmissionCandidateInput,
): Promise<PantavionAdmissionRunOutput> {
  return kernelAdmission.evaluateCandidate(candidate);
}

export function getKernelAdmissionHistory(): PantavionAdmissionDecisionRecord[] {
  return kernelAdmission.getHistory();
}
