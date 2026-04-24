// core/kernel/kernel-json-export.ts

import type { PantavionKernelTerminalRunnerOutput } from './kernel-terminal-runner';
import type { PantavionKernelOpsReport } from './kernel-ops-report';
import type { PantavionKernelRealRunnerOutput } from './kernel-real-runner';

export interface PantavionKernelJsonExportMetadata {
  [key: string]: unknown;
}

export interface PantavionKernelJsonExportCheck {
  area: string;
  status: string;
  summary: string;
  actions: string[];
}

export interface PantavionKernelJsonExportPriority {
  severity: string;
  category: string;
  title: string;
  summary: string;
  actions: string[];
}

export interface PantavionKernelJsonExportEnvelope {
  generatedAt: string;
  version: string;
  terminalSummary: string;
  controlPlane: {
    runId: string;
    mode: string;
    resilienceMode: string;
    protocolAdapters: number;
    dispatchCount: number;
  };
  readiness: {
    status: string;
    score: number;
    summary: string;
    checks: PantavionKernelJsonExportCheck[];
    nextWave: string[];
  };
  ops: {
    status: string;
    headline: string;
    topActions: string[];
    priorities: PantavionKernelJsonExportPriority[];
  };
  metadata: PantavionKernelJsonExportMetadata;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function buildKernelJsonExportFromTerminalRunner(
  output: PantavionKernelTerminalRunnerOutput,
  metadata: PantavionKernelJsonExportMetadata = {},
): PantavionKernelJsonExportEnvelope {
  const controlPlane = output.realRunner.controlPlane;
  const readiness = output.realRunner.readiness;
  const ops = output.opsReport;

  return {
    generatedAt: nowIso(),
    version: 'pantavion-kernel-foundation-v1',
    terminalSummary: output.rendered,
    controlPlane: {
      runId: controlPlane.runId,
      mode: controlPlane.mode,
      resilienceMode: controlPlane.resilienceMode,
      protocolAdapters: controlPlane.gatewayStats.adapterCount,
      dispatchCount: controlPlane.gatewayStats.dispatchCount,
    },
    readiness: {
      status: readiness.status,
      score: readiness.score,
      summary: readiness.summary,
      checks: readiness.checks.map((check) => ({
        area: check.area,
        status: check.status,
        summary: check.summary,
        actions: [...check.actions],
      })),
      nextWave: [...readiness.nextWave],
    },
    ops: {
      status: ops.status,
      headline: ops.headline,
      topActions: [...ops.topActions],
      priorities: ops.priorities.items.map((item) => ({
        severity: item.severity,
        category: item.category,
        title: item.title,
        summary: item.summary,
        actions: [...item.actions],
      })),
    },
    metadata,
  };
}

export function buildKernelJsonExportFromOpsReport(
  ops: PantavionKernelOpsReport,
  realRunner: PantavionKernelRealRunnerOutput,
  metadata: PantavionKernelJsonExportMetadata = {},
): PantavionKernelJsonExportEnvelope {
  return buildKernelJsonExportFromTerminalRunner(
    {
      realRunner,
      opsReport: ops,
      rendered: realRunner.terminalSummary,
    },
    metadata,
  );
}

export function renderKernelJsonExport(
  exportObject: PantavionKernelJsonExportEnvelope,
): string {
  return JSON.stringify(exportObject, null, 2);
}

export function parseKernelJsonExport(
  json: string,
): PantavionKernelJsonExportEnvelope {
  const parsed = JSON.parse(json) as PantavionKernelJsonExportEnvelope;

  return {
    generatedAt: safeText(parsed.generatedAt, nowIso()),
    version: safeText(parsed.version, 'pantavion-kernel-foundation-v1'),
    terminalSummary: safeText(parsed.terminalSummary),
    controlPlane: {
      runId: safeText(parsed.controlPlane?.runId),
      mode: safeText(parsed.controlPlane?.mode),
      resilienceMode: safeText(parsed.controlPlane?.resilienceMode),
      protocolAdapters:
        typeof parsed.controlPlane?.protocolAdapters === 'number'
          ? parsed.controlPlane.protocolAdapters
          : 0,
      dispatchCount:
        typeof parsed.controlPlane?.dispatchCount === 'number'
          ? parsed.controlPlane.dispatchCount
          : 0,
    },
    readiness: {
      status: safeText(parsed.readiness?.status),
      score:
        typeof parsed.readiness?.score === 'number'
          ? parsed.readiness.score
          : 0,
      summary: safeText(parsed.readiness?.summary),
      checks: Array.isArray(parsed.readiness?.checks)
        ? parsed.readiness.checks.map((check) => ({
            area: safeText(check.area),
            status: safeText(check.status),
            summary: safeText(check.summary),
            actions: uniqStrings(Array.isArray(check.actions) ? check.actions : []),
          }))
        : [],
      nextWave: uniqStrings(
        Array.isArray(parsed.readiness?.nextWave) ? parsed.readiness.nextWave : [],
      ),
    },
    ops: {
      status: safeText(parsed.ops?.status),
      headline: safeText(parsed.ops?.headline),
      topActions: uniqStrings(
        Array.isArray(parsed.ops?.topActions) ? parsed.ops.topActions : [],
      ),
      priorities: Array.isArray(parsed.ops?.priorities)
        ? parsed.ops.priorities.map((priority) => ({
            severity: safeText(priority.severity),
            category: safeText(priority.category),
            title: safeText(priority.title),
            summary: safeText(priority.summary),
            actions: uniqStrings(
              Array.isArray(priority.actions) ? priority.actions : [],
            ),
          }))
        : [],
    },
    metadata:
      parsed.metadata && typeof parsed.metadata === 'object'
        ? parsed.metadata
        : {},
  };
}

export default renderKernelJsonExport;
