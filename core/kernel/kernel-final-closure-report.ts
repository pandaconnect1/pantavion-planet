// core/kernel/kernel-final-closure-report.ts

import {
  runKernelFinalAudit,
  type PantavionKernelFinalAudit,
} from './kernel-final-audit';

import {
  runKernelGapMatrix,
  type PantavionKernelGapMatrix,
} from './kernel-gap-matrix';

import {
  buildKernelFoundationLock,
  type PantavionKernelFoundationLock,
} from './kernel-foundation-lock';

export interface PantavionKernelFinalClosureReport {
  generatedAt: string;
  audit: PantavionKernelFinalAudit;
  gapMatrix: PantavionKernelGapMatrix;
  foundationLock: PantavionKernelFoundationLock;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderClosureReport(
  report: PantavionKernelFinalClosureReport,
): string {
  return [
    'PANTAVION KERNEL FINAL CLOSURE REPORT',
    `generatedAt=${report.generatedAt}`,
    '',
    'AUDIT',
    report.audit.rendered,
    '',
    'GAP MATRIX',
    report.gapMatrix.rendered,
    '',
    'FOUNDATION LOCK',
    report.foundationLock.rendered,
  ].join('\n');
}

export async function runKernelFinalClosureReport(): Promise<PantavionKernelFinalClosureReport> {
  const audit = await runKernelFinalAudit();
  const gapMatrix = await runKernelGapMatrix();
  const foundationLock = buildKernelFoundationLock();

  const report: PantavionKernelFinalClosureReport = {
    generatedAt: nowIso(),
    audit,
    gapMatrix,
    foundationLock,
    rendered: '',
  };

  report.rendered = renderClosureReport(report);

  return report;
}

export default runKernelFinalClosureReport;
