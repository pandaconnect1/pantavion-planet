// core/kernel/derivative-kernel-registry.ts

import type { PantavionConstitutionalKernelKey } from './kernel-constitution-registry';

export type PantavionDerivativeKernelStatus =
  | 'planned'
  | 'seeded'
  | 'active'
  | 'retired';

export type PantavionDerivativeKernelRolloutStage =
  | 'seed'
  | 'wave'
  | 'operational'
  | 'retired';

export interface PantavionDerivativeKernelRecord {
  derivativeKey: string;
  parentKernelKey: PantavionConstitutionalKernelKey;
  title: string;
  purpose: string;
  status: PantavionDerivativeKernelStatus;
  rolloutStage: PantavionDerivativeKernelRolloutStage;
  lightweightProfile: 'light' | 'medium';
  regenerativeEligible: boolean;
}

export interface PantavionDerivativeKernelSnapshot {
  generatedAt: string;
  derivativeKernelCount: number;
  seededCount: number;
  activeCount: number;
  plannedCount: number;
  retiredCount: number;
  parentCoverageCount: number;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

const DERIVATIVE_KERNELS: PantavionDerivativeKernelRecord[] = [
  {
    derivativeKey: 'memory-event-log',
    parentKernelKey: 'memory-thread',
    title: 'Memory Event Log Sub-Kernel',
    purpose: 'Persist timestamped diary-style memory events per user and thread.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'thread-continuity',
    parentKernelKey: 'memory-thread',
    title: 'Thread Continuity Sub-Kernel',
    purpose: 'Preserve thread identity, lineage, continuity and unresolved state.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'commitment-reminder',
    parentKernelKey: 'memory-thread',
    title: 'Commitment / Reminder Sub-Kernel',
    purpose: 'Preserve user obligations, due dates, reminder events and follow-up.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'fact-canonicalization',
    parentKernelKey: 'truth-identity',
    title: 'Fact Canonicalization Sub-Kernel',
    purpose: 'Lift durable facts from threads into canonical truth with timestamps.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'route-authority',
    parentKernelKey: 'intelligence-authority',
    title: 'Route Authority Sub-Kernel',
    purpose: 'Declare which lanes are primary, backup, forbidden or promoted.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'decision-trace',
    parentKernelKey: 'governance-audit-observability',
    title: 'Decision Trace Sub-Kernel',
    purpose: 'Explain why routing, locale and policy decisions were taken.',
    status: 'active',
    rolloutStage: 'operational',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'background-preparation',
    parentKernelKey: 'execution-runtime',
    title: 'Background Preparation Sub-Kernel',
    purpose: 'Queue future preparation jobs for follow-up continuity work.',
    status: 'active',
    rolloutStage: 'wave',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'dormant-thread-reactivation',
    parentKernelKey: 'memory-thread',
    title: 'Dormant Thread Reactivation Sub-Kernel',
    purpose: 'Wake sleeping threads when time or events make them relevant again.',
    status: 'seeded',
    rolloutStage: 'seed',
    lightweightProfile: 'light',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'intelligence-locale-authority',
    parentKernelKey: 'intelligence-authority',
    title: 'Intelligence Locale Authority Sub-Kernel',
    purpose: 'Map intelligence authority by locale, dialect and support strength.',
    status: 'planned',
    rolloutStage: 'seed',
    lightweightProfile: 'medium',
    regenerativeEligible: true,
  },
  {
    derivativeKey: 'commercial-billing-rail',
    parentKernelKey: 'execution-runtime',
    title: 'Commercial / Billing Rail Sub-Kernel',
    purpose: 'Handle subscriptions, payment events, revenue ledger and payout readiness.',
    status: 'planned',
    rolloutStage: 'seed',
    lightweightProfile: 'medium',
    regenerativeEligible: true,
  },
];

export function listDerivativeKernels(): PantavionDerivativeKernelRecord[] {
  return DERIVATIVE_KERNELS.map((item) => cloneValue(item));
}

export function getDerivativeKernel(
  derivativeKey: string,
): PantavionDerivativeKernelRecord | null {
  const item = DERIVATIVE_KERNELS.find((entry) => entry.derivativeKey === derivativeKey);
  return item ? cloneValue(item) : null;
}

export function getDerivativeKernelSnapshot(): PantavionDerivativeKernelSnapshot {
  const list = listDerivativeKernels();
  const parents = new Set(list.map((item) => item.parentKernelKey));

  return {
    generatedAt: nowIso(),
    derivativeKernelCount: list.length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    activeCount: list.filter((item) => item.status === 'active').length,
    plannedCount: list.filter((item) => item.status === 'planned').length,
    retiredCount: list.filter((item) => item.status === 'retired').length,
    parentCoverageCount: parents.size,
  };
}

export default listDerivativeKernels;
