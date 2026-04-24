// core/kernel/kernel-constitution-registry.ts

export type PantavionConstitutionalKernelKey =
  | 'truth-identity'
  | 'memory-thread'
  | 'intelligence-authority'
  | 'execution-runtime'
  | 'governance-audit-observability';

export interface PantavionConstitutionalKernelRecord {
  kernelKey: PantavionConstitutionalKernelKey;
  title: string;
  domain: string;
  mandate: string;
  authorityBoundaries: string[];
  canGenerateDerivativeKernels: boolean;
  lightweight: boolean;
  regenerative: boolean;
  selfImprovementMode: 'proposal-governed';
  status: 'constitutional-active';
}

export interface PantavionKernelConstitutionSnapshot {
  generatedAt: string;
  constitutionalKernelCount: number;
  regenerativeKernelCount: number;
  lightweightKernelCount: number;
  keys: PantavionConstitutionalKernelKey[];
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

const CONSTITUTIONAL_KERNELS: PantavionConstitutionalKernelRecord[] = [
  {
    kernelKey: 'truth-identity',
    title: 'Truth / Identity Kernel',
    domain: 'canonical truth, identity, authority, entitlement',
    mandate:
      'Preserve who the user is, what the system knows as canonical truth, and what authority is valid.',
    authorityBoundaries: [
      'identity posture',
      'canonical facts',
      'truth validation',
      'authority assertions',
    ],
    canGenerateDerivativeKernels: true,
    lightweight: true,
    regenerative: true,
    selfImprovementMode: 'proposal-governed',
    status: 'constitutional-active',
  },
  {
    kernelKey: 'memory-thread',
    title: 'Memory / Thread Kernel',
    domain: 'memory events, threads, commitments, reminders, continuity',
    mandate:
      'Preserve continuity across time with timestamped memory, thread identity, and user follow-up obligations.',
    authorityBoundaries: [
      'memory logs',
      'thread continuity',
      'facts and commitments',
      'reminders and background preparation',
    ],
    canGenerateDerivativeKernels: true,
    lightweight: true,
    regenerative: true,
    selfImprovementMode: 'proposal-governed',
    status: 'constitutional-active',
  },
  {
    kernelKey: 'intelligence-authority',
    title: 'Intelligence Authority Kernel',
    domain: 'AI provider authority, intelligence selection, locale and trust orchestration',
    mandate:
      'Govern which intelligences may act, where they may act, and under what cost, trust, locale and policy conditions.',
    authorityBoundaries: [
      'provider authority',
      'model admission',
      'locale intelligence mapping',
      'promotion and demotion',
    ],
    canGenerateDerivativeKernels: true,
    lightweight: true,
    regenerative: true,
    selfImprovementMode: 'proposal-governed',
    status: 'constitutional-active',
  },
  {
    kernelKey: 'execution-runtime',
    title: 'Execution / Runtime Kernel',
    domain: 'routing, runtime execution, workflows, voice, exports, jobs',
    mandate:
      'Execute real actions across runtime surfaces while preserving resilience, throughput and deterministic control.',
    authorityBoundaries: [
      'runtime execution',
      'routing and jobs',
      'voice and export flows',
      'retries and failover',
    ],
    canGenerateDerivativeKernels: true,
    lightweight: true,
    regenerative: true,
    selfImprovementMode: 'proposal-governed',
    status: 'constitutional-active',
  },
  {
    kernelKey: 'governance-audit-observability',
    title: 'Governance / Audit / Observability Kernel',
    domain: 'decision traces, audits, lineage, compliance, explainability',
    mandate:
      'Preserve why the system acted, how it evolved, and what lineage or audit trail proves its behavior.',
    authorityBoundaries: [
      'audit artifacts',
      'decision traces',
      'lineage snapshots',
      'rollout and rollback records',
    ],
    canGenerateDerivativeKernels: true,
    lightweight: true,
    regenerative: true,
    selfImprovementMode: 'proposal-governed',
    status: 'constitutional-active',
  },
];

export function listConstitutionalKernels(): PantavionConstitutionalKernelRecord[] {
  return CONSTITUTIONAL_KERNELS.map((item) => cloneValue(item));
}

export function getConstitutionalKernel(
  kernelKey: PantavionConstitutionalKernelKey,
): PantavionConstitutionalKernelRecord | null {
  const item = CONSTITUTIONAL_KERNELS.find((entry) => entry.kernelKey === kernelKey);
  return item ? cloneValue(item) : null;
}

export function getKernelConstitutionSnapshot(): PantavionKernelConstitutionSnapshot {
  const list = listConstitutionalKernels();

  return {
    generatedAt: nowIso(),
    constitutionalKernelCount: list.length,
    regenerativeKernelCount: list.filter((item) => item.regenerative).length,
    lightweightKernelCount: list.filter((item) => item.lightweight).length,
    keys: list.map((item) => item.kernelKey),
  };
}

export default listConstitutionalKernels;
