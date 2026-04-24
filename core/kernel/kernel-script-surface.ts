// core/kernel/kernel-script-surface.ts

import {
  executeKernelCommandSurface,
  type PantavionKernelCommandKey,
  type PantavionKernelCommandSurfaceResult,
} from './kernel-command-surface';

import {
  runPantavionKernelEntrypoint,
  type PantavionKernelEntrypointOutput,
} from './kernel-entrypoint';

import {
  runKernelArtifactGeneration,
  type PantavionKernelRunArtifact,
} from './kernel-run-artifact';

import {
  runKernelExportedRunner,
  type PantavionKernelExportedRunnerPayload,
} from './kernel-exported-runner';

import { renderKernelArtifactSummary } from './kernel-artifact-summary';

export type PantavionKernelScriptKey =
  | 'entrypoint-render'
  | 'artifact-summary'
  | 'export-json'
  | 'command-surface';

export interface PantavionKernelScriptSurfaceMetadata {
  [key: string]: unknown;
}

export interface PantavionKernelScriptSurfaceInput {
  script: PantavionKernelScriptKey;
  command?: PantavionKernelCommandKey;
  metadata?: PantavionKernelScriptSurfaceMetadata;
}

export interface PantavionKernelScriptSurfaceResult {
  script: PantavionKernelScriptKey;
  executedAt: string;
  ok: true;
  rendered: string;
  exportText?: string;
  payload:
    | PantavionKernelEntrypointOutput
    | PantavionKernelRunArtifact
    | PantavionKernelExportedRunnerPayload
    | PantavionKernelCommandSurfaceResult;
  metadata: PantavionKernelScriptSurfaceMetadata;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function runKernelScriptSurface(
  input: PantavionKernelScriptSurfaceInput,
): Promise<PantavionKernelScriptSurfaceResult> {
  const executedAt = nowIso();
  const metadata = input.metadata ?? {};

  if (input.script === 'entrypoint-render') {
    const payload = await runPantavionKernelEntrypoint();

    return {
      script: input.script,
      executedAt,
      ok: true,
      rendered: payload.rendered,
      payload,
      metadata,
    };
  }

  if (input.script === 'artifact-summary') {
    const payload = await runKernelArtifactGeneration();
    const rendered = renderKernelArtifactSummary(payload);

    return {
      script: input.script,
      executedAt,
      ok: true,
      rendered,
      exportText: rendered,
      payload,
      metadata,
    };
  }

  if (input.script === 'export-json') {
    const payload = await runKernelExportedRunner({
      command: input.command ?? 'run:entrypoint',
      metadata,
    });

    return {
      script: input.script,
      executedAt,
      ok: true,
      rendered: payload.rendered,
      exportText: payload.json,
      payload,
      metadata,
    };
  }

  const payload = await executeKernelCommandSurface({
    command: input.command ?? 'run:readiness',
    metadata,
  });

  return {
    script: 'command-surface',
    executedAt,
    ok: true,
    rendered: payload.rendered,
    payload,
    metadata,
  };
}

export default runKernelScriptSurface;
