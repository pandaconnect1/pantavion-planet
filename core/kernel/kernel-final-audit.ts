// core/kernel/kernel-final-audit.ts

import {
  runKernelFoundationReport,
  type PantavionKernelFoundationReport,
} from './kernel-foundation-report';

import {
  buildKernelFoundationLock,
  type PantavionKernelFoundationLock,
} from './kernel-foundation-lock';

import {
  runPantavionKernelOneShotRunner,
  type PantavionKernelOneShotRunnerOutput,
} from './kernel-one-shot-runner';

export type PantavionKernelFinalAuditStatus =
  | 'blocked'
  | 'hardening'
  | 'foundation-complete';

export type PantavionKernelFinalAuditFindingSeverity =
  | 'critical'
  | 'material'
  | 'minor';

export interface PantavionKernelFinalAuditFinding {
  key: string;
  severity: PantavionKernelFinalAuditFindingSeverity;
  title: string;
  summary: string;
  actions: string[];
}

export interface PantavionKernelFinalAudit {
  generatedAt: string;
  status: PantavionKernelFinalAuditStatus;
  foundationReport: PantavionKernelFoundationReport;
  foundationLock: PantavionKernelFoundationLock;
  oneShot: PantavionKernelOneShotRunnerOutput;
  findings: PantavionKernelFinalAuditFinding[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function deriveAuditStatus(input: {
  foundationReport: PantavionKernelFoundationReport;
  oneShot: PantavionKernelOneShotRunnerOutput;
}): PantavionKernelFinalAuditStatus {
  if (
    input.foundationReport.status === 'foundation-incomplete' ||
    input.oneShot.entrypoint.artifact.readinessStatus === 'not-ready'
  ) {
    return 'blocked';
  }

  if (
    input.foundationReport.status === 'foundation-hardening' ||
    input.oneShot.entrypoint.artifact.opsStatus === 'hardening' ||
    input.oneShot.entrypoint.artifact.opsStatus === 'watch'
  ) {
    return 'hardening';
  }

  return 'foundation-complete';
}

function buildFindings(input: {
  foundationReport: PantavionKernelFoundationReport;
  foundationLock: PantavionKernelFoundationLock;
  oneShot: PantavionKernelOneShotRunnerOutput;
}): PantavionKernelFinalAuditFinding[] {
  const findings: PantavionKernelFinalAuditFinding[] = [];

  const readiness = input.foundationReport.readiness;
  const ops = input.foundationReport.ops;
  const artifact = input.oneShot.entrypoint.artifact;

  if (readiness.status === 'not-ready') {
    findings.push({
      key: 'readiness-not-ready',
      severity: 'critical',
      title: 'Readiness is not ready',
      summary: 'Το foundation δεν είναι ακόμη αρκετά σταθερό για trusted lift.',
      actions: [
        'Κλείσε πρώτα όλα τα fail checks του readiness report.',
        'Μην ανοίξεις production-like execution χωρίς hardening.',
      ],
    });
  }

  if (
    readiness.status === 'foundation-ready' ||
    readiness.status === 'integration-ready'
  ) {
    findings.push({
      key: 'readiness-hardening-needed',
      severity: 'material',
      title: 'Readiness hardening still required',
      summary: `Το readiness παραμένει στο επίπεδο "${readiness.status}".`,
      actions: [
        ...ops.topActions.slice(0, 5),
      ],
    });
  }

  if (
    artifact.controlPlaneMode === 'degraded' ||
    artifact.controlPlaneMode === 'restricted'
  ) {
    findings.push({
      key: 'control-plane-not-operational',
      severity:
        artifact.controlPlaneMode === 'restricted' ? 'critical' : 'material',
      title: 'Control plane is not yet fully operational',
      summary: `Το control plane mode είναι "${artifact.controlPlaneMode}".`,
      actions: [
        'Ενίσχυσε fallback orchestration.',
        'Βάλε πιο ισχυρά provider/runtime failover paths.',
      ],
    });
  }

  if (
    artifact.resilienceMode === 'degraded' ||
    artifact.resilienceMode === 'offline-buffered' ||
    artifact.resilienceMode === 'critical' ||
    artifact.resilienceMode === 'emergency'
  ) {
    findings.push({
      key: 'resilience-hardening',
      severity:
        artifact.resilienceMode === 'critical' || artifact.resilienceMode === 'emergency'
          ? 'critical'
          : 'material',
      title: 'Resilience hardening is still open',
      summary: `Η resilience posture είναι "${artifact.resilienceMode}".`,
      actions: [
        'Κλείσε degraded continuity paths.',
        'Εμπλούτισε το resilience runtime με stronger fallback state handling.',
      ],
    });
  }

  if (input.foundationLock.authoritativeBuildPath.length < 14) {
    findings.push({
      key: 'foundation-path-incomplete',
      severity: 'material',
      title: 'Authoritative foundation path looks incomplete',
      summary: 'Το locked foundation path φαίνεται μικρότερο από το αναμενόμενο baseline.',
      actions: [
        'Επανέλεγξε το authoritative build path.',
      ],
    });
  }

  if (findings.length === 0) {
    findings.push({
      key: 'foundation-strong',
      severity: 'minor',
      title: 'Foundation wave is internally coherent',
      summary: 'Το foundation compile-safe baseline δείχνει ενιαίο και δεμένο.',
      actions: [
        'Προχώρησε στο επόμενο product/runtime hardening stage.',
      ],
    });
  }

  return findings.map((finding) => ({
    ...finding,
    actions: uniqStrings(finding.actions),
  }));
}

function renderFinalAudit(audit: PantavionKernelFinalAudit): string {
  return [
    'PANTAVION KERNEL FINAL AUDIT',
    `generatedAt=${audit.generatedAt}`,
    `status=${audit.status}`,
    `foundationStatus=${audit.foundationReport.status}`,
    `readiness=${audit.foundationReport.readiness.status}`,
    `ops=${audit.foundationReport.ops.status}`,
    `controlPlaneMode=${audit.oneShot.entrypoint.artifact.controlPlaneMode}`,
    `resilience=${audit.oneShot.entrypoint.artifact.resilienceMode}`,
    '',
    'FINDINGS',
    ...audit.findings.flatMap((finding) => [
      `- [${finding.severity.toUpperCase()}] ${finding.title}`,
      `  key=${finding.key}`,
      `  summary=${finding.summary}`,
      ...finding.actions.map((action) => `  action=${action}`),
    ]),
  ].join('\n');
}

export async function runKernelFinalAudit(): Promise<PantavionKernelFinalAudit> {
  const foundationReport = await runKernelFoundationReport();
  const foundationLock = buildKernelFoundationLock();
  const oneShot = await runPantavionKernelOneShotRunner();

  const audit: PantavionKernelFinalAudit = {
    generatedAt: nowIso(),
    status: 'hardening',
    foundationReport,
    foundationLock,
    oneShot,
    findings: [],
    rendered: '',
  };

  audit.status = deriveAuditStatus({
    foundationReport,
    oneShot,
  });

  audit.findings = buildFindings({
    foundationReport,
    foundationLock,
    oneShot,
  });

  audit.rendered = renderFinalAudit(audit);

  return audit;
}

export default runKernelFinalAudit;
