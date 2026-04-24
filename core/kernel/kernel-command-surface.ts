// core/kernel/kernel-command-surface.ts

import {
  runPantavionKernelTerminalRunner,
  type PantavionKernelTerminalRunnerOutput,
} from './kernel-terminal-runner';

import {
  runPantavionKernelEntrypoint,
  type PantavionKernelEntrypointOutput,
} from './kernel-entrypoint';

import {
  runKernelArtifactGeneration,
  type PantavionKernelRunArtifact,
} from './kernel-run-artifact';

import {
  runKernelOpsReport,
  type PantavionKernelOpsReport,
} from './kernel-ops-report';

import {
  runKernelReadinessReport,
  type PantavionKernelReadinessReport,
} from './kernel-readiness-report';

export type PantavionKernelCommandKey =
  | 'run:terminal'
  | 'run:entrypoint'
  | 'run:artifact'
  | 'run:ops'
  | 'run:readiness';

export interface PantavionKernelCommandMetadata {
  [key: string]: unknown;
}

export interface PantavionKernelCommandInput {
  command: PantavionKernelCommandKey;
  metadata?: PantavionKernelCommandMetadata;
}

export interface PantavionKernelCommandSurfaceResult {
  command: PantavionKernelCommandKey;
  executedAt: string;
  ok: true;
  rendered: string;
  payload:
    | PantavionKernelTerminalRunnerOutput
    | PantavionKernelEntrypointOutput
    | PantavionKernelRunArtifact
    | PantavionKernelOpsReport
    | PantavionKernelReadinessReport;
  metadata: PantavionKernelCommandMetadata;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function renderOpsReport(report: PantavionKernelOpsReport): string {
  const lines: string[] = [];

  lines.push('PANTAVION OPS COMMAND');
  lines.push(`status=${report.status}`);
  lines.push(`headline=${report.headline}`);
  lines.push('topActions:');

  for (const action of report.topActions) {
    lines.push(`- ${action}`);
  }

  return lines.join('\n');
}

function renderReadinessReport(report: PantavionKernelReadinessReport): string {
  const lines: string[] = [];

  lines.push('PANTAVION READINESS COMMAND');
  lines.push(`status=${report.status}`);
  lines.push(`score=${report.score.toFixed(2)}`);
  lines.push(`summary=${report.summary}`);
  lines.push('checks:');

  for (const check of report.checks) {
    lines.push(`- [${check.status.toUpperCase()}] ${check.area}: ${check.summary}`);
  }

  return lines.join('\n');
}

function renderArtifact(artifact: PantavionKernelRunArtifact): string {
  const lines: string[] = [];

  lines.push('PANTAVION ARTIFACT COMMAND');
  lines.push(`artifactId=${artifact.artifactId}`);
  lines.push(`summary=${artifact.summary}`);
  lines.push(`readiness=${artifact.readinessStatus}`);
  lines.push(`ops=${artifact.opsStatus}`);
  lines.push(`mode=${artifact.controlPlaneMode}`);
  lines.push(`resilience=${artifact.resilienceMode}`);
  lines.push(`priorityCount=${artifact.priorityCount}`);

  return lines.join('\n');
}

export async function executeKernelCommandSurface(
  input: PantavionKernelCommandInput,
): Promise<PantavionKernelCommandSurfaceResult> {
  const command = input.command;
  const executedAt = nowIso();
  const metadata = input.metadata ?? {};

  if (command === 'run:terminal') {
    const payload = await runPantavionKernelTerminalRunner();
    return {
      command,
      executedAt,
      ok: true,
      rendered: payload.rendered,
      payload,
      metadata,
    };
  }

  if (command === 'run:entrypoint') {
    const payload = await runPantavionKernelEntrypoint();
    return {
      command,
      executedAt,
      ok: true,
      rendered: payload.rendered,
      payload,
      metadata,
    };
  }

  if (command === 'run:artifact') {
    const payload = await runKernelArtifactGeneration();
    return {
      command,
      executedAt,
      ok: true,
      rendered: renderArtifact(payload),
      payload,
      metadata,
    };
  }

  if (command === 'run:ops') {
    const payload = await runKernelOpsReport();
    return {
      command,
      executedAt,
      ok: true,
      rendered: renderOpsReport(payload),
      payload,
      metadata,
    };
  }

  const payload = await runKernelReadinessReport();
  return {
    command: 'run:readiness',
    executedAt,
    ok: true,
    rendered: renderReadinessReport(payload),
    payload,
    metadata,
  };
}

export function parseKernelCommandKey(
  value: string,
): PantavionKernelCommandKey {
  switch (safeText(value)) {
    case 'run:terminal':
    case 'run:entrypoint':
    case 'run:artifact':
    case 'run:ops':
      return value as PantavionKernelCommandKey;
    default:
      return 'run:readiness';
  }
}

export default executeKernelCommandSurface;
