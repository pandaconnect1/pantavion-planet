// core/kernel/kernel-exported-runner.ts

import {
  executeKernelCommandSurface,
  type PantavionKernelCommandInput,
  type PantavionKernelCommandKey,
  type PantavionKernelCommandSurfaceResult,
} from './kernel-command-surface';

import {
  buildKernelJsonExportFromTerminalRunner,
  renderKernelJsonExport,
  type PantavionKernelJsonExportEnvelope,
} from './kernel-json-export';

import type { PantavionKernelTerminalRunnerOutput } from './kernel-terminal-runner';
import type { PantavionKernelEntrypointOutput } from './kernel-entrypoint';
import type { PantavionKernelRunArtifact } from './kernel-run-artifact';

export interface PantavionKernelExportedRunnerPayload {
  command: PantavionKernelCommandKey;
  exportedAt: string;
  rendered: string;
  json?: string;
  envelope?: PantavionKernelJsonExportEnvelope;
  metadata: Record<string, unknown>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isTerminalRunnerPayload(
  value: unknown,
): value is PantavionKernelTerminalRunnerOutput {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'realRunner' in value &&
      'opsReport' in value &&
      'rendered' in value,
  );
}

function isEntrypointPayload(
  value: unknown,
): value is PantavionKernelEntrypointOutput {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'artifact' in value &&
      'terminal' in value &&
      'rendered' in value,
  );
}

function isArtifactPayload(
  value: unknown,
): value is PantavionKernelRunArtifact {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'artifactId' in value &&
      'jsonText' in value,
  );
}

function buildEnvelopeFromResult(
  result: PantavionKernelCommandSurfaceResult,
): PantavionKernelJsonExportEnvelope | undefined {
  if (isTerminalRunnerPayload(result.payload)) {
    return buildKernelJsonExportFromTerminalRunner(result.payload, {
      exportedRunner: true,
      command: result.command,
    });
  }

  if (isEntrypointPayload(result.payload)) {
    return result.payload.artifact.jsonExport;
  }

  if (isArtifactPayload(result.payload)) {
    return result.payload.jsonExport;
  }

  return undefined;
}

export async function runKernelExportedRunner(
  input: PantavionKernelCommandInput,
): Promise<PantavionKernelExportedRunnerPayload> {
  const result = await executeKernelCommandSurface(input);
  const envelope = buildEnvelopeFromResult(result);

  return {
    command: result.command,
    exportedAt: nowIso(),
    rendered: result.rendered,
    json: envelope ? renderKernelJsonExport(envelope) : undefined,
    envelope,
    metadata: result.metadata,
  };
}

export default runKernelExportedRunner;
