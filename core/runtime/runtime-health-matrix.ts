// core/runtime/runtime-health-matrix.ts

import type { PantavionRuntimeTarget } from './runtime-scenario-registry';

export type PantavionRuntimeMatrixStatus =
  | 'pass'
  | 'watch'
  | 'degraded'
  | 'blocked';

export interface PantavionRuntimeMatrixRow {
  target: PantavionRuntimeTarget;
  status: PantavionRuntimeMatrixStatus;
  summary: string;
  evidence: string[];
  actions: string[];
}

export interface PantavionRuntimeHealthMatrix {
  generatedAt: string;
  rows: PantavionRuntimeMatrixRow[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildRuntimeHealthMatrix(
  rows: PantavionRuntimeMatrixRow[],
): PantavionRuntimeHealthMatrix {
  const rendered = [
    'PANTAVION RUNTIME HEALTH MATRIX',
    `generatedAt=${nowIso()}`,
    ...rows.flatMap((row) => [
      '',
      `${row.target.toUpperCase()} :: ${row.status.toUpperCase()}`,
      `summary=${row.summary}`,
      ...row.evidence.map((item) => `evidence=${item}`),
      ...row.actions.map((item) => `action=${item}`),
    ]),
  ].join('\n');

  return {
    generatedAt: nowIso(),
    rows,
    rendered,
  };
}

export default buildRuntimeHealthMatrix;
