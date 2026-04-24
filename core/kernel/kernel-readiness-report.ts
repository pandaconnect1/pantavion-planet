// core/kernel/kernel-readiness-report.ts

import {
  runKernelControlPlane,
  type PantavionKernelControlPlaneRun,
} from './kernel-control-plane';
import { getKernelTaxonomySnapshot } from './kernel-taxonomy';
import { getKernelAdmissionHistory } from './kernel-admission';
import { getCapabilityFamilyRegistrySnapshot } from '../registry/capability-family-registry';

export type PantavionReadinessStatus =
  | 'not-ready'
  | 'foundation-ready'
  | 'integration-ready'
  | 'operational-ready';

export type PantavionReadinessCheckStatus = 'pass' | 'warn' | 'fail';

export type PantavionReadinessArea =
  | 'kernel'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'taxonomy'
  | 'admission'
  | 'resilience';

export interface PantavionReadinessCheck {
  area: PantavionReadinessArea;
  status: PantavionReadinessCheckStatus;
  summary: string;
  actions: string[];
}

export interface PantavionKernelReadinessReport {
  generatedAt: string;
  status: PantavionReadinessStatus;
  score: number;
  summary: string;
  checks: PantavionReadinessCheck[];
  nextWave: string[];
  controlPlaneMode: PantavionKernelControlPlaneRun['mode'];
}

function nowIso(): string {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createCheck(
  area: PantavionReadinessArea,
  status: PantavionReadinessCheckStatus,
  summary: string,
  actions: string[] = [],
): PantavionReadinessCheck {
  return {
    area,
    status,
    summary,
    actions: unique(actions),
  };
}

function computeStatus(
  checks: PantavionReadinessCheck[],
  controlPlaneMode: PantavionKernelControlPlaneRun['mode'],
  score: number,
): PantavionReadinessStatus {
  const failCount = checks.filter((check) => check.status === 'fail').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length;

  if (failCount > 0) {
    return 'not-ready';
  }

  if (score < 0.68) {
    return 'foundation-ready';
  }

  if (controlPlaneMode === 'degraded' || controlPlaneMode === 'restricted') {
    return 'integration-ready';
  }

  if (warnCount > 2) {
    return 'integration-ready';
  }

  return 'operational-ready';
}

export function buildKernelReadinessReport(
  run: PantavionKernelControlPlaneRun,
): PantavionKernelReadinessReport {
  const taxonomy = getKernelTaxonomySnapshot();
  const admissionHistory = getKernelAdmissionHistory();
  const registrySnapshot = getCapabilityFamilyRegistrySnapshot();

  const checks: PantavionReadinessCheck[] = [];

  checks.push(
    createCheck(
      'kernel',
      run.smoke.kernel.gapCount === 0 ? 'pass' : run.smoke.kernel.gapCount <= 2 ? 'warn' : 'fail',
      `Kernel smoke recommendation=${run.smoke.kernel.recommendationStatus}, gaps=${run.smoke.kernel.gapCount}, alerts=${run.smoke.kernel.alertCount}.`,
      run.smoke.kernel.gapCount > 0
        ? ['Close remaining kernel smoke gaps before production hardening.']
        : [],
    ),
  );

  checks.push(
    createCheck(
      'identity',
      run.bootSnapshot.actorIds.length >= 4 ? 'pass' : 'warn',
      `Foundation actors registered=${run.bootSnapshot.actorIds.length}.`,
      run.bootSnapshot.actorIds.length >= 4
        ? []
        : ['Register full identity foundation actors before widening execution scope.'],
    ),
  );

  checks.push(
    createCheck(
      'protocol',
      run.gatewayStats.adapterCount >= 4 ? 'pass' : 'warn',
      `Protocol adapters=${run.gatewayStats.adapterCount}, handlers=${run.gatewayStats.handlerCount}, dispatches=${run.gatewayStats.dispatchCount}.`,
      run.gatewayStats.adapterCount >= 4
        ? []
        : ['Expand protocol adapter coverage before real external integration.'],
    ),
  );

  checks.push(
    createCheck(
      'runtime',
      run.smoke.workspace.taskStatus === 'completed' &&
        run.smoke.voice.turnStatus === 'completed'
        ? 'pass'
        : 'warn',
      `Workspace=${run.smoke.workspace.taskStatus}, Voice=${run.smoke.voice.turnStatus}.`,
      [
        'Add stronger runtime scenario coverage.',
        'Validate degraded-path behavior under control-plane orchestration.',
      ],
    ),
  );

  checks.push(
    createCheck(
      'taxonomy',
      taxonomy.nodeCount >= 10 ? 'pass' : 'warn',
      `Taxonomy nodes=${taxonomy.nodeCount}, families=${taxonomy.families.length}.`,
      taxonomy.nodeCount >= 10
        ? []
        : ['Expand canonical taxonomy before broader admission growth.'],
    ),
  );

  const rejectedAdmissions = admissionHistory.filter(
    (item) => item.decision === 'reject',
  ).length;

  checks.push(
    createCheck(
      'admission',
      admissionHistory.length >= 1 && rejectedAdmissions === 0 ? 'pass' : 'warn',
      `Admission decisions=${admissionHistory.length}, rejected=${rejectedAdmissions}, registryEntries=${registrySnapshot.entryCount}.`,
      [
        'Continue admission history growth with richer controlled candidates.',
        'Attach stronger observability and smoke controls per candidate.',
      ],
    ),
  );

  checks.push(
    createCheck(
      'resilience',
      run.resilienceMode === 'normal'
        ? 'pass'
        : run.resilienceMode === 'degraded' || run.resilienceMode === 'offline-buffered'
          ? 'warn'
          : 'fail',
      `Resilience mode=${run.resilienceMode}.`,
      run.resilienceMode === 'normal'
        ? []
        : [
            'Strengthen fallback orchestration and degraded-mode readiness.',
            'Add more provider/runtime failover paths.',
          ],
    ),
  );

  const scoreMap: Record<PantavionReadinessCheckStatus, number> = {
    pass: 1,
    warn: 0.6,
    fail: 0,
  };

  const score =
    checks.length === 0
      ? 0
      : clamp(
          checks.reduce((sum, check) => sum + scoreMap[check.status], 0) / checks.length,
          0,
          1,
        );

  const status = computeStatus(checks, run.mode, score);

  const nextWave = unique([
    'Add real provider adapters behind protocol gateway.',
    'Add structured persistence / audit serialization.',
    'Add stronger readiness and incident dashboards.',
    'Expand capability family registry with real operational families.',
    'Introduce executable scripted smoke/test runner for daily validation.',
  ]);

  return {
    generatedAt: nowIso(),
    status,
    score,
    summary: `Readiness=${status}, score=${score.toFixed(2)}, controlPlaneMode=${run.mode}.`,
    checks,
    nextWave,
    controlPlaneMode: run.mode,
  };
}

export async function runKernelReadinessReport(): Promise<PantavionKernelReadinessReport> {
  const run = await runKernelControlPlane({
    readinessReport: true,
  });

  return buildKernelReadinessReport(run);
}

export default runKernelReadinessReport;

