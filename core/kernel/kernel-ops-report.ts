// core/kernel/kernel-ops-report.ts

import {
  runKernelControlPlane,
  type PantavionKernelControlPlaneRun,
} from './kernel-control-plane';

import {
  buildKernelReadinessReport,
  type PantavionKernelReadinessReport,
} from './kernel-readiness-report';

import {
  buildKernelPriorityQueue,
  type PantavionKernelPriorityQueue,
} from './kernel-priority-queue';

export type PantavionKernelOpsStatus =
  | 'stable'
  | 'watch'
  | 'hardening'
  | 'restricted';

export interface PantavionKernelOpsReport {
  generatedAt: string;
  status: PantavionKernelOpsStatus;
  headline: string;
  controlPlane: PantavionKernelControlPlaneRun;
  readiness: PantavionKernelReadinessReport;
  priorities: PantavionKernelPriorityQueue;
  topActions: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function deriveOpsStatus(input: {
  readiness: PantavionKernelReadinessReport;
  controlPlane: PantavionKernelControlPlaneRun;
}): PantavionKernelOpsStatus {
  if (
    input.readiness.status === 'not-ready' ||
    input.controlPlane.mode === 'restricted'
  ) {
    return 'restricted';
  }

  if (
    input.readiness.status === 'foundation-ready' ||
    input.controlPlane.mode === 'degraded'
  ) {
    return 'hardening';
  }

  if (input.readiness.status === 'integration-ready') {
    return 'watch';
  }

  return 'stable';
}

export function buildKernelOpsReport(
  controlPlane: PantavionKernelControlPlaneRun,
): PantavionKernelOpsReport {
  const readiness = buildKernelReadinessReport(controlPlane);
  const priorities = buildKernelPriorityQueue(readiness);
  const status = deriveOpsStatus({
    readiness,
    controlPlane,
  });

  const topActions = uniqStrings(
    priorities.items
      .slice(0, 8)
      .flatMap((item) => item.actions)
      .slice(0, 8),
  );

  return {
    generatedAt: nowIso(),
    status,
    headline: `KernelOps status=${status}, readiness=${readiness.status}, controlPlane=${controlPlane.mode}, score=${readiness.score.toFixed(2)}.`,
    controlPlane,
    readiness,
    priorities,
    topActions,
  };
}

export async function runKernelOpsReport(): Promise<PantavionKernelOpsReport> {
  const controlPlane = await runKernelControlPlane({
    opsReport: true,
  });

  return buildKernelOpsReport(controlPlane);
}

export default runKernelOpsReport;
