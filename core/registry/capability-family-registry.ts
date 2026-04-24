// core/registry/capability-family-registry.ts

import type {
  PantavionApprovalTier,
  PantavionTrustTier,
} from '../identity/identity-model';

export type PantavionCapabilityFamilyKind =
  | 'foundation'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'workspace'
  | 'voice'
  | 'resilience'
  | 'memory'
  | 'business'
  | 'crisis'
  | 'utility'
  | 'learning'
  | 'admin'
  | 'research';

export type PantavionCapabilityEntryKind =
  | 'capability'
  | 'adapter'
  | 'runtime'
  | 'module'
  | 'workspace'
  | 'service'
  | 'surface'
  | 'governed-surface';

export type PantavionCapabilityLifecycle =
  | 'candidate'
  | 'foundation'
  | 'active'
  | 'degraded'
  | 'archived';

export type PantavionCapabilityRiskClass =
  | 'low'
  | 'medium'
  | 'high'
  | 'restricted';

export type PantavionCapabilityRegistryDisposition =
  | 'allow'
  | 'review'
  | 'reject';

export interface PantavionCapabilityRegistryMetadata {
  [key: string]: unknown;
}

export interface PantavionCapabilityFamilyRecord {
  familyKey: string;
  title: string;
  kind: PantavionCapabilityFamilyKind;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  metadata: PantavionCapabilityRegistryMetadata;
}

export interface PantavionCapabilityEntryRecord {
  entryKey: string;
  familyKey: string;
  kind: PantavionCapabilityEntryKind;
  title: string;
  description: string;
  lifecycle: PantavionCapabilityLifecycle;
  trustFloor: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  riskClass: PantavionCapabilityRiskClass;
  tags: string[];
  canonicalPaths: string[];
  protocolFamilies: string[];
  runtimeFamilies: string[];
  createdAt: string;
  updatedAt: string;
  metadata: PantavionCapabilityRegistryMetadata;
}

export interface PantavionCapabilityFamilyEvaluationInput {
  title: string;
  description?: string;
  entryKind?: PantavionCapabilityEntryKind;
  familyKeyHint?: string;
  tags?: string[];
  targetPath?: string;
  targetModule?: string;
  riskHint?: PantavionCapabilityRiskClass;
  protocolFamilies?: string[];
  runtimeFamilies?: string[];
}

export interface PantavionCapabilityFamilyEvaluation {
  disposition: PantavionCapabilityRegistryDisposition;
  matchedFamilies: PantavionCapabilityFamilyRecord[];
  duplicateEntries: PantavionCapabilityEntryRecord[];
  recommendedFamilyKey?: string;
  reasons: string[];
  nextActions: string[];
}

export interface PantavionCapabilityRegistrySnapshot {
  generatedAt: string;
  familyCount: number;
  entryCount: number;
  families: PantavionCapabilityFamilyRecord[];
  entries: PantavionCapabilityEntryRecord[];
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

function normalizeApprovalTier(value: unknown): PantavionApprovalTier {
  switch (value) {
    case 'none':
    case 'review':
    case 'admin':
    case 'security':
    case 'executive':
      return value;
    default:
      return 'review';
  }
}

function normalizeTrustTier(value: unknown): PantavionTrustTier {
  switch (value) {
    case 'untrusted':
    case 'basic':
    case 'trusted':
    case 'high-trust':
    case 'system':
      return value;
    default:
      return 'basic';
  }
}

function normalizeRiskClass(value: unknown): PantavionCapabilityRiskClass {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'restricted':
      return value;
    default:
      return 'medium';
  }
}

function searchText(parts: unknown[]): string {
  return parts
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
    .join(' ');
}

export class PantavionCapabilityFamilyRegistry {
  private readonly families = new Map<string, PantavionCapabilityFamilyRecord>();
  private readonly entries = new Map<string, PantavionCapabilityEntryRecord>();

  constructor() {
    this.seedFoundationFamilies();
    this.seedFoundationEntries();
  }

  registerFamily(input: {
    familyKey: string;
    title: string;
    kind: PantavionCapabilityFamilyKind;
    description: string;
    tags?: string[];
    metadata?: PantavionCapabilityRegistryMetadata;
  }): PantavionCapabilityFamilyRecord {
    const timestamp = nowIso();
    const existing = this.families.get(input.familyKey);

    const record: PantavionCapabilityFamilyRecord = {
      familyKey: safeText(input.familyKey),
      title: safeText(input.title, safeText(input.familyKey)),
      kind: input.kind,
      description: safeText(input.description),
      tags: uniqStrings((input.tags ?? []).map(String)),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: input.metadata ?? {},
    };

    this.families.set(record.familyKey, record);
    return record;
  }

  registerEntry(input: {
    entryKey: string;
    familyKey: string;
    kind: PantavionCapabilityEntryKind;
    title: string;
    description: string;
    lifecycle?: PantavionCapabilityLifecycle;
    trustFloor?: PantavionTrustTier;
    approvalTier?: PantavionApprovalTier;
    riskClass?: PantavionCapabilityRiskClass;
    tags?: string[];
    canonicalPaths?: string[];
    protocolFamilies?: string[];
    runtimeFamilies?: string[];
    metadata?: PantavionCapabilityRegistryMetadata;
  }): PantavionCapabilityEntryRecord {
    const timestamp = nowIso();
    const existing = this.entries.get(input.entryKey);

    const record: PantavionCapabilityEntryRecord = {
      entryKey: safeText(input.entryKey),
      familyKey: safeText(input.familyKey),
      kind: input.kind,
      title: safeText(input.title, safeText(input.entryKey)),
      description: safeText(input.description),
      lifecycle: input.lifecycle ?? 'candidate',
      trustFloor: normalizeTrustTier(input.trustFloor),
      approvalTier: normalizeApprovalTier(input.approvalTier),
      riskClass: normalizeRiskClass(input.riskClass),
      tags: uniqStrings((input.tags ?? []).map(String)),
      canonicalPaths: uniqStrings((input.canonicalPaths ?? []).map(String)),
      protocolFamilies: uniqStrings((input.protocolFamilies ?? []).map(String)),
      runtimeFamilies: uniqStrings((input.runtimeFamilies ?? []).map(String)),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: input.metadata ?? {},
    };

    this.entries.set(record.entryKey, record);
    return record;
  }

  getFamily(familyKey: string): PantavionCapabilityFamilyRecord | null {
    return this.families.get(familyKey) ?? null;
  }

  getEntry(entryKey: string): PantavionCapabilityEntryRecord | null {
    return this.entries.get(entryKey) ?? null;
  }

  listFamilies(): PantavionCapabilityFamilyRecord[] {
    return [...this.families.values()].sort((a, b) =>
      a.familyKey.localeCompare(b.familyKey),
    );
  }

  listEntries(): PantavionCapabilityEntryRecord[] {
    return [...this.entries.values()].sort((a, b) =>
      a.entryKey.localeCompare(b.entryKey),
    );
  }

  evaluateCandidate(
    input: PantavionCapabilityFamilyEvaluationInput,
  ): PantavionCapabilityFamilyEvaluation {
    const text = searchText([
      input.title,
      input.description,
      input.familyKeyHint,
      input.targetPath,
      input.targetModule,
      ...(input.tags ?? []),
      ...(input.protocolFamilies ?? []),
      ...(input.runtimeFamilies ?? []),
    ]);

    const matchedFamilies = this.listFamilies().filter((family) => {
      if (safeText(input.familyKeyHint) && family.familyKey === input.familyKeyHint) {
        return true;
      }

      return searchText([family.familyKey, family.title, family.description, ...family.tags])
        .split(' ')
        .some((token) => token.length > 3 && text.includes(token));
    });

    const duplicateEntries = this.listEntries().filter((entry) => {
      const haystack = searchText([
        entry.entryKey,
        entry.title,
        entry.description,
        ...entry.tags,
        ...entry.canonicalPaths,
      ]);

      return (
        haystack.includes(safeText(input.title).toLowerCase()) ||
        (safeText(input.targetPath) && entry.canonicalPaths.includes(safeText(input.targetPath)))
      );
    });

    const recommendedFamily =
      (safeText(input.familyKeyHint) && this.getFamily(safeText(input.familyKeyHint))) ||
      matchedFamilies[0] ||
      this.recommendFamilyBySignals(text, input);

    const reasons: string[] = [];
    const nextActions: string[] = [];
    let disposition: PantavionCapabilityRegistryDisposition = 'allow';

    if (duplicateEntries.length > 0) {
      disposition = 'review';
      reasons.push(
        `Potential duplicate entries detected: ${duplicateEntries
          .map((entry) => entry.entryKey)
          .join(', ')}.`,
      );
      nextActions.push('Deduplicate before admitting new capability object.');
    }

    if (!recommendedFamily) {
      disposition = 'review';
      reasons.push('No clear capability family match found.');
      nextActions.push('Choose canonical family before admission.');
    } else {
      reasons.push(`Recommended family resolved as ${recommendedFamily.familyKey}.`);
    }

    if (input.riskHint === 'restricted') {
      disposition = 'review';
      reasons.push('Restricted risk hint requires stronger governance review.');
      nextActions.push('Route through security/admin approval path.');
    }

    if (
      input.entryKind === 'governed-surface' ||
      input.entryKind === 'service'
    ) {
      reasons.push('Governed/runtime-oriented candidate detected.');
      nextActions.push('Validate lifecycle, observability and fallback posture.');
    }

    if (reasons.length === 0) {
      reasons.push('Candidate appears compatible with current registry baseline.');
    }

    if (nextActions.length === 0) {
      nextActions.push('Admit candidate into canonical family registry.');
    }

    return {
      disposition,
      matchedFamilies,
      duplicateEntries,
      recommendedFamilyKey: recommendedFamily?.familyKey,
      reasons: uniqStrings(reasons),
      nextActions: uniqStrings(nextActions),
    };
  }

  getSnapshot(): PantavionCapabilityRegistrySnapshot {
    const families = this.listFamilies();
    const entries = this.listEntries();

    return {
      generatedAt: nowIso(),
      familyCount: families.length,
      entryCount: entries.length,
      families,
      entries,
    };
  }

  private recommendFamilyBySignals(
    text: string,
    input: PantavionCapabilityFamilyEvaluationInput,
  ): PantavionCapabilityFamilyRecord | undefined {
    const path = safeText(input.targetPath).toLowerCase();

    if (path.includes('core/kernel')) return this.getFamily('kernel') ?? undefined;
    if (path.includes('core/identity')) return this.getFamily('identity') ?? undefined;
    if (path.includes('core/protocol')) return this.getFamily('protocol') ?? undefined;
    if (path.includes('core/runtime')) return this.getFamily('runtime') ?? undefined;
    if (text.includes('voice')) return this.getFamily('voice') ?? undefined;
    if (text.includes('workspace')) return this.getFamily('workspace') ?? undefined;
    if (text.includes('resilien')) return this.getFamily('resilience') ?? undefined;
    if (text.includes('memory')) return this.getFamily('memory') ?? undefined;
    if (text.includes('admin')) return this.getFamily('admin') ?? undefined;
    if (text.includes('crisis') || text.includes('sos')) return this.getFamily('crisis') ?? undefined;
    if (text.includes('business') || text.includes('billing')) return this.getFamily('business') ?? undefined;
    if (text.includes('utility') || text.includes('map')) return this.getFamily('utility') ?? undefined;
    if (text.includes('learn')) return this.getFamily('learning') ?? undefined;
    return undefined;
  }

  private seedFoundationFamilies(): void {
    const seed: Array<{
      familyKey: string;
      title: string;
      kind: PantavionCapabilityFamilyKind;
      description: string;
      tags: string[];
    }> = [
      {
        familyKey: 'kernel',
        title: 'Kernel Foundation',
        kind: 'foundation',
        description: 'Kernel 0 governance, intake, placement and admission.',
        tags: ['kernel', 'governance', 'intake', 'placement'],
      },
      {
        familyKey: 'identity',
        title: 'Identity Foundation',
        kind: 'identity',
        description: 'Identity, trust, scopes, entitlements and delegation.',
        tags: ['identity', 'trust', 'delegation'],
      },
      {
        familyKey: 'protocol',
        title: 'Protocol Foundation',
        kind: 'protocol',
        description: 'Protocol types, adapters and governed gateway routing.',
        tags: ['protocol', 'gateway', 'adapter', 'mcp', 'a2a'],
      },
      {
        familyKey: 'runtime',
        title: 'Runtime Foundation',
        kind: 'runtime',
        description: 'Durable execution and shared runtime coordination.',
        tags: ['runtime', 'execution', 'durable'],
      },
      {
        familyKey: 'workspace',
        title: 'Workspace Runtime',
        kind: 'workspace',
        description: 'Workspace continuity, sessions, tasks and governed execution.',
        tags: ['workspace', 'tasks', 'sessions'],
      },
      {
        familyKey: 'voice',
        title: 'Voice Runtime',
        kind: 'voice',
        description: 'Voice processing, interpreter mode and multimodal continuity.',
        tags: ['voice', 'interpreter', 'translation'],
      },
      {
        familyKey: 'resilience',
        title: 'Resilience Runtime',
        kind: 'resilience',
        description: 'Degradation control, fallback planning and continuity under stress.',
        tags: ['resilience', 'fallback', 'degraded', 'continuity'],
      },
      {
        familyKey: 'memory',
        title: 'Memory Foundation',
        kind: 'memory',
        description: 'Memory classes, promotion and continuity logic.',
        tags: ['memory', 'continuity', 'promotion'],
      },
      {
        familyKey: 'admin',
        title: 'Admin and Ops',
        kind: 'admin',
        description: 'Admin alerts, reviews and operations visibility.',
        tags: ['admin', 'ops', 'alerts'],
      },
    ];

    for (const family of seed) {
      this.registerFamily(family);
    }
  }

  private seedFoundationEntries(): void {
    const seed: Array<{
      entryKey: string;
      familyKey: string;
      kind: PantavionCapabilityEntryKind;
      title: string;
      description: string;
      lifecycle: PantavionCapabilityLifecycle;
      trustFloor: PantavionTrustTier;
      approvalTier: PantavionApprovalTier;
      riskClass: PantavionCapabilityRiskClass;
      tags: string[];
      canonicalPaths: string[];
      protocolFamilies?: string[];
      runtimeFamilies?: string[];
    }> = [
      {
        entryKey: 'kernel-0-coordinator',
        familyKey: 'kernel',
        kind: 'service',
        title: 'Kernel 0 Coordinator',
        description: 'Canonical intake, classification and build recommendation surface.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['kernel', 'intake', 'coordination'],
        canonicalPaths: ['core/kernel/kernel.ts'],
      },
      {
        entryKey: 'identity-model',
        familyKey: 'identity',
        kind: 'service',
        title: 'Identity Model',
        description: 'Identity posture resolution and scope enforcement baseline.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['identity', 'posture', 'scope'],
        canonicalPaths: ['core/identity/identity-model.ts'],
      },
      {
        entryKey: 'delegation-model',
        familyKey: 'identity',
        kind: 'service',
        title: 'Delegation Model',
        description: 'Delegated authority, scopes and approval-aware delegation.',
        lifecycle: 'foundation',
        trustFloor: 'trusted',
        approvalTier: 'review',
        riskClass: 'high',
        tags: ['delegation', 'authority', 'approval'],
        canonicalPaths: ['core/identity/delegation-model.ts'],
      },
      {
        entryKey: 'protocol-gateway',
        familyKey: 'protocol',
        kind: 'service',
        title: 'Protocol Gateway',
        description: 'Governed adapter selection and protocol dispatch.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['protocol', 'gateway', 'dispatch'],
        canonicalPaths: ['core/protocol/protocol-gateway.ts'],
        protocolFamilies: ['internal', 'mcp', 'a2a'],
      },
      {
        entryKey: 'durable-execution-runtime',
        familyKey: 'runtime',
        kind: 'runtime',
        title: 'Durable Execution Runtime',
        description: 'Step-based resilient execution with retry and approval pauses.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['durable', 'execution', 'retry'],
        canonicalPaths: ['core/runtime/durable-execution.ts'],
        runtimeFamilies: ['durable-execution'],
      },
      {
        entryKey: 'workspace-runtime',
        familyKey: 'workspace',
        kind: 'runtime',
        title: 'Workspace Runtime',
        description: 'Workspace sessions, tasks and governed runtime flow.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['workspace', 'runtime', 'tasks'],
        canonicalPaths: ['core/runtime/workspace-runtime.ts'],
        runtimeFamilies: ['workspace-runtime'],
      },
      {
        entryKey: 'voice-runtime',
        familyKey: 'voice',
        kind: 'runtime',
        title: 'Voice Runtime',
        description: 'Voice session and turn processing baseline.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['voice', 'translation', 'interpreter'],
        canonicalPaths: ['core/runtime/voice-runtime.ts'],
        runtimeFamilies: ['voice-runtime'],
      },
      {
        entryKey: 'resilience-runtime',
        familyKey: 'resilience',
        kind: 'runtime',
        title: 'Resilience Runtime',
        description: 'Fallback planning and degraded-mode continuity.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'high',
        tags: ['resilience', 'fallback', 'continuity'],
        canonicalPaths: ['core/runtime/resilience-runtime.ts'],
        runtimeFamilies: ['resilience-runtime'],
      },
      {
        entryKey: 'kernel-bootstrap',
        familyKey: 'kernel',
        kind: 'service',
        title: 'Kernel Bootstrap',
        description: 'Foundation bootstrap and integrated smoke alignment.',
        lifecycle: 'foundation',
        trustFloor: 'basic',
        approvalTier: 'review',
        riskClass: 'medium',
        tags: ['bootstrap', 'smoke', 'integration'],
        canonicalPaths: ['core/kernel/kernel-bootstrap.ts', 'core/kernel/kernel-foundation-smoke.ts'],
      },
    ];

    for (const entry of seed) {
      this.registerEntry(entry);
    }
  }
}

export function createCapabilityFamilyRegistry(): PantavionCapabilityFamilyRegistry {
  return new PantavionCapabilityFamilyRegistry();
}

export const capabilityFamilyRegistry = createCapabilityFamilyRegistry();

export function evaluateCapabilityFamilyCandidate(
  input: PantavionCapabilityFamilyEvaluationInput,
): PantavionCapabilityFamilyEvaluation {
  return capabilityFamilyRegistry.evaluateCandidate(input);
}

export function registerCapabilityFamily(input: {
  familyKey: string;
  title: string;
  kind: PantavionCapabilityFamilyKind;
  description: string;
  tags?: string[];
  metadata?: PantavionCapabilityRegistryMetadata;
}): PantavionCapabilityFamilyRecord {
  return capabilityFamilyRegistry.registerFamily(input);
}

export function registerCapabilityFamilyEntry(input: {
  entryKey: string;
  familyKey: string;
  kind: PantavionCapabilityEntryKind;
  title: string;
  description: string;
  lifecycle?: PantavionCapabilityLifecycle;
  trustFloor?: PantavionTrustTier;
  approvalTier?: PantavionApprovalTier;
  riskClass?: PantavionCapabilityRiskClass;
  tags?: string[];
  canonicalPaths?: string[];
  protocolFamilies?: string[];
  runtimeFamilies?: string[];
  metadata?: PantavionCapabilityRegistryMetadata;
}): PantavionCapabilityEntryRecord {
  return capabilityFamilyRegistry.registerEntry(input);
}

export function getCapabilityFamilyRegistrySnapshot(): PantavionCapabilityRegistrySnapshot {
  return capabilityFamilyRegistry.getSnapshot();
}
