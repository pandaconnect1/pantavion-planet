// core/kernel/kernel-priority-queue.ts

import type {
  PantavionKernelReadinessReport,
  PantavionReadinessArea,
  PantavionReadinessCheck,
  PantavionReadinessCheckStatus,
} from './kernel-readiness-report';

export type PantavionKernelPrioritySeverity =
  | 'p0'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4';

export type PantavionKernelPriorityCategory =
  | 'foundation'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'taxonomy'
  | 'admission'
  | 'resilience'
  | 'operationalization';

export interface PantavionKernelPriorityItem {
  id: string;
  severity: PantavionKernelPrioritySeverity;
  category: PantavionKernelPriorityCategory;
  title: string;
  summary: string;
  source: 'readiness-check' | 'next-wave';
  actions: string[];
}

export interface PantavionKernelPriorityQueue {
  generatedAt: string;
  items: PantavionKernelPriorityItem[];
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

function mapAreaToCategory(
  area: PantavionReadinessArea,
): PantavionKernelPriorityCategory {
  switch (area) {
    case 'kernel':
      return 'foundation';
    case 'identity':
      return 'identity';
    case 'protocol':
      return 'protocol';
    case 'runtime':
      return 'runtime';
    case 'taxonomy':
      return 'taxonomy';
    case 'admission':
      return 'admission';
    case 'resilience':
      return 'resilience';
    default:
      return 'operationalization';
  }
}

function mapCheckStatusToSeverity(
  status: PantavionReadinessCheckStatus,
  area: PantavionReadinessArea,
): PantavionKernelPrioritySeverity {
  if (status === 'fail') {
    return area === 'resilience' || area === 'kernel' ? 'p0' : 'p1';
  }

  if (status === 'warn') {
    return area === 'runtime' || area === 'protocol' ? 'p1' : 'p2';
  }

  return 'p4';
}

function mapNextWaveTextToCategory(
  text: string,
): PantavionKernelPriorityCategory {
  const normalized = text.toLowerCase();

  if (normalized.includes('protocol')) return 'protocol';
  if (normalized.includes('runtime')) return 'runtime';
  if (normalized.includes('taxonomy')) return 'taxonomy';
  if (normalized.includes('admission')) return 'admission';
  if (normalized.includes('resilience') || normalized.includes('failover')) {
    return 'resilience';
  }
  if (normalized.includes('audit') || normalized.includes('dashboard')) {
    return 'operationalization';
  }

  return 'foundation';
}

function sortWeight(severity: PantavionKernelPrioritySeverity): number {
  switch (severity) {
    case 'p0':
      return 0;
    case 'p1':
      return 1;
    case 'p2':
      return 2;
    case 'p3':
      return 3;
    default:
      return 4;
  }
}

function buildFromReadinessCheck(
  check: PantavionReadinessCheck,
): PantavionKernelPriorityItem {
  return {
    id: createId('kpi'),
    severity: mapCheckStatusToSeverity(check.status, check.area),
    category: mapAreaToCategory(check.area),
    title: `${check.area} readiness`,
    summary: check.summary,
    source: 'readiness-check',
    actions:
      check.actions.length > 0
        ? [...check.actions]
        : ['Observe and maintain current readiness posture.'],
  };
}

function buildFromNextWaveText(
  text: string,
): PantavionKernelPriorityItem {
  return {
    id: createId('kpi'),
    severity: 'p2',
    category: mapNextWaveTextToCategory(text),
    title: text,
    summary: text,
    source: 'next-wave',
    actions: [text],
  };
}

export function buildKernelPriorityQueue(
  readiness: PantavionKernelReadinessReport,
): PantavionKernelPriorityQueue {
  const items: PantavionKernelPriorityItem[] = [
    ...readiness.checks.map(buildFromReadinessCheck),
    ...readiness.nextWave.map(buildFromNextWaveText),
  ]
    .map((item) => ({
      ...item,
      actions: uniqStrings(item.actions),
    }))
    .sort((left, right) => {
      const severityDelta =
        sortWeight(left.severity) - sortWeight(right.severity);

      if (severityDelta !== 0) {
        return severityDelta;
      }

      return left.title.localeCompare(right.title);
    });

  return {
    generatedAt: nowIso(),
    items,
  };
}

export default buildKernelPriorityQueue;
