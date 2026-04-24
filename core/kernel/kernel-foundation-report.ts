// core/kernel/kernel-foundation-report.ts

import {
  runKernelOpsReport,
  type PantavionKernelOpsReport,
} from './kernel-ops-report';

import {
  runKernelReadinessReport,
  type PantavionKernelReadinessReport,
} from './kernel-readiness-report';

import {
  buildKernelBootstrapManifest,
  type PantavionKernelBootstrapManifest,
} from './kernel-bootstrap-manifest';

import { getKernelTaxonomySnapshot } from './kernel-taxonomy';
import { getKernelAdmissionHistory } from './kernel-admission';
import { getCapabilityFamilyRegistrySnapshot } from '../registry/capability-family-registry';

export type PantavionFoundationReportStatus =
  | 'foundation-incomplete'
  | 'foundation-hardening'
  | 'foundation-strong';

export interface PantavionFoundationReportSection {
  title: string;
  lines: string[];
}

export interface PantavionKernelFoundationReport {
  generatedAt: string;
  status: PantavionFoundationReportStatus;
  readiness: PantavionKernelReadinessReport;
  ops: PantavionKernelOpsReport;
  manifest: PantavionKernelBootstrapManifest;
  sections: PantavionFoundationReportSection[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deriveFoundationReportStatus(input: {
  readiness: PantavionKernelReadinessReport;
  ops: PantavionKernelOpsReport;
}): PantavionFoundationReportStatus {
  if (
    input.readiness.status === 'not-ready' ||
    input.ops.status === 'restricted'
  ) {
    return 'foundation-incomplete';
  }

  if (
    input.readiness.status === 'foundation-ready' ||
    input.readiness.status === 'integration-ready' ||
    input.ops.status === 'hardening' ||
    input.ops.status === 'watch'
  ) {
    return 'foundation-hardening';
  }

  return 'foundation-strong';
}

function renderFoundationReport(
  report: PantavionKernelFoundationReport,
): string {
  return [
    'PANTAVION KERNEL FOUNDATION REPORT',
    `generatedAt=${report.generatedAt}`,
    `status=${report.status}`,
    `readiness=${report.readiness.status}`,
    `score=${report.readiness.score.toFixed(2)}`,
    `ops=${report.ops.status}`,
    ...report.sections.flatMap((section) => [
      '',
      section.title.toUpperCase(),
      ...section.lines,
    ]),
  ].join('\n');
}

export function buildKernelFoundationReport(input: {
  readiness: PantavionKernelReadinessReport;
  ops: PantavionKernelOpsReport;
  manifest: PantavionKernelBootstrapManifest;
}): PantavionKernelFoundationReport {
  const taxonomy = getKernelTaxonomySnapshot();
  const admissions = getKernelAdmissionHistory();
  const registry = getCapabilityFamilyRegistrySnapshot();

  const status = deriveFoundationReportStatus({
    readiness: input.readiness,
    ops: input.ops,
  });

  const sections: PantavionFoundationReportSection[] = [
    {
      title: 'Executive Status',
      lines: [
        `Readiness status=${input.readiness.status}`,
        `Readiness score=${input.readiness.score.toFixed(2)}`,
        `Ops status=${input.ops.status}`,
        `Ops headline=${input.ops.headline}`,
      ],
    },
    {
      title: 'Foundation Inventory',
      lines: [
        `Manifest sections=${input.manifest.sections.length}`,
        `Taxonomy nodes=${taxonomy.nodeCount}`,
        `Capability registry entries=${registry.entryCount}`,
        `Admission history=${admissions.length}`,
      ],
    },
    {
      title: 'Top Hardening Actions',
      lines: input.ops.topActions.length > 0
        ? input.ops.topActions.map((action) => `- ${action}`)
        : ['- No top actions recorded.'],
    },
    {
      title: 'Manifest Summary',
      lines: input.manifest.sections.flatMap((section) => [
        `- ${section.title}: ${section.entries.length} entries`,
      ]),
    },
  ];

  const report: PantavionKernelFoundationReport = {
    generatedAt: nowIso(),
    status,
    readiness: input.readiness,
    ops: input.ops,
    manifest: input.manifest,
    sections,
    rendered: '',
  };

  report.rendered = renderFoundationReport(report);

  return report;
}

export async function runKernelFoundationReport(): Promise<PantavionKernelFoundationReport> {
  const readiness = await runKernelReadinessReport();
  const ops = await runKernelOpsReport();
  const manifest = buildKernelBootstrapManifest();

  return buildKernelFoundationReport({
    readiness,
    ops,
    manifest,
  });
}

export default runKernelFoundationReport;
