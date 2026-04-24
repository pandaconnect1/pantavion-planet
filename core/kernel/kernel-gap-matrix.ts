// core/kernel/kernel-gap-matrix.ts

import {
  runKernelFinalAudit,
  type PantavionKernelFinalAudit,
} from './kernel-final-audit';

export type PantavionKernelGapMatrixArea =
  | 'kernel'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'resilience'
  | 'admission'
  | 'export'
  | 'ops';

export type PantavionKernelGapMatrixSeverity =
  | 'critical'
  | 'material'
  | 'minor'
  | 'closed';

export interface PantavionKernelGapMatrixRow {
  area: PantavionKernelGapMatrixArea;
  title: string;
  severity: PantavionKernelGapMatrixSeverity;
  currentState: string;
  requiredAction: string;
}

export interface PantavionKernelGapMatrix {
  generatedAt: string;
  rows: PantavionKernelGapMatrixRow[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderGapMatrix(matrix: PantavionKernelGapMatrix): string {
  return [
    'PANTAVION KERNEL GAP MATRIX',
    `generatedAt=${matrix.generatedAt}`,
    ...matrix.rows.flatMap((row) => [
      '',
      `${row.area.toUpperCase()} :: ${row.title}`,
      `severity=${row.severity}`,
      `currentState=${row.currentState}`,
      `requiredAction=${row.requiredAction}`,
    ]),
  ].join('\n');
}

function buildRowsFromAudit(
  audit: PantavionKernelFinalAudit,
): PantavionKernelGapMatrixRow[] {
  const rows: PantavionKernelGapMatrixRow[] = [];

  rows.push({
    area: 'kernel',
    title: 'Kernel coordinator baseline',
    severity:
      audit.foundationReport.readiness.status === 'not-ready'
        ? 'critical'
        : audit.foundationReport.readiness.status === 'foundation-ready'
          ? 'material'
          : 'closed',
    currentState: `readiness=${audit.foundationReport.readiness.status}`,
    requiredAction:
      audit.foundationReport.readiness.status === 'operational-ready'
        ? 'Foundation kernel baseline is closed for this stage.'
        : 'Continue kernel hardening until readiness becomes operational-ready.',
  });

  rows.push({
    area: 'identity',
    title: 'Identity and delegation foundation',
    severity: 'closed',
    currentState: 'identity-model.ts and delegation-model.ts are present and compile-safe.',
    requiredAction: 'Move later to stronger persistence and richer role packs.',
  });

  rows.push({
    area: 'protocol',
    title: 'Protocol gateway baseline',
    severity:
      audit.oneShot.entrypoint.artifact.controlPlaneMode === 'operational'
        ? 'minor'
        : 'material',
    currentState: `controlPlaneMode=${audit.oneShot.entrypoint.artifact.controlPlaneMode}`,
    requiredAction: 'Add stronger real provider adapters and external binding paths.',
  });

  rows.push({
    area: 'runtime',
    title: 'Durable / workspace / voice runtime wave',
    severity:
      audit.oneShot.entrypoint.artifact.opsStatus === 'stable'
        ? 'minor'
        : 'material',
    currentState: `ops=${audit.oneShot.entrypoint.artifact.opsStatus}`,
    requiredAction: 'Expand scenario coverage and runtime hardening.',
  });

  rows.push({
    area: 'resilience',
    title: 'Resilience continuity posture',
    severity:
      audit.oneShot.entrypoint.artifact.resilienceMode === 'normal'
        ? 'minor'
        : audit.oneShot.entrypoint.artifact.resilienceMode === 'degraded' ||
            audit.oneShot.entrypoint.artifact.resilienceMode === 'offline-buffered'
          ? 'material'
          : 'critical',
    currentState: `resilience=${audit.oneShot.entrypoint.artifact.resilienceMode}`,
    requiredAction: 'Enrich degraded/offline/failover logic and continuity guarantees.',
  });

  rows.push({
    area: 'admission',
    title: 'Admission and taxonomy governance',
    severity: 'minor',
    currentState: `lockedPath=${audit.foundationLock.authoritativeBuildPath.length} files`,
    requiredAction: 'Continue controlled candidate admission and registry family growth.',
  });

  rows.push({
    area: 'export',
    title: 'Export / artifact / entrypoint pack',
    severity: 'closed',
    currentState: 'Entrypoint, JSON export, artifact and saved export surfaces are present.',
    requiredAction: 'Later connect these to file persistence or real CLI outputs.',
  });

  rows.push({
    area: 'ops',
    title: 'Control plane / ops / final report path',
    severity:
      audit.foundationReport.ops.status === 'stable'
        ? 'minor'
        : audit.foundationReport.ops.status === 'restricted'
          ? 'critical'
          : 'material',
    currentState: `ops=${audit.foundationReport.ops.status}`,
    requiredAction: 'Promote the ops path into stronger daily validation and observability discipline.',
  });

  return rows;
}

export async function runKernelGapMatrix(): Promise<PantavionKernelGapMatrix> {
  const audit = await runKernelFinalAudit();
  const rows = buildRowsFromAudit(audit);

  const matrix: PantavionKernelGapMatrix = {
    generatedAt: nowIso(),
    rows,
    rendered: '',
  };

  matrix.rendered = renderGapMatrix(matrix);

  return matrix;
}

export default runKernelGapMatrix;
