// core/kernel/kernel-entrypoint.ts

import {
  runPantavionKernelTerminalRunner,
  type PantavionKernelTerminalRunnerOutput,
} from './kernel-terminal-runner';

import {
  buildKernelRunArtifact,
  type PantavionKernelRunArtifact,
} from './kernel-run-artifact';

export interface PantavionKernelEntrypointOutput {
  completedAt: string;
  exitCode: 0;
  artifact: PantavionKernelRunArtifact;
  terminal: PantavionKernelTerminalRunnerOutput;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderEntrypointHeader(
  artifact: PantavionKernelRunArtifact,
): string {
  return [
    'PANTAVION KERNEL ENTRYPOINT',
    `artifactId=${artifact.artifactId}`,
    `readiness=${artifact.readinessStatus}`,
    `score=${artifact.readinessScore.toFixed(2)}`,
    `controlPlaneMode=${artifact.controlPlaneMode}`,
    `opsStatus=${artifact.opsStatus}`,
    `resilience=${artifact.resilienceMode}`,
    `priorityCount=${artifact.priorityCount}`,
  ].join('\n');
}

export function renderKernelEntrypointOutput(
  output: PantavionKernelEntrypointOutput,
): string {
  return [
    renderEntrypointHeader(output.artifact),
    '',
    output.terminal.rendered,
    '',
    'ARTIFACT SUMMARY',
    output.artifact.summary,
    '',
    'TOP ACTIONS',
    ...output.artifact.topActions.map((action) => `- ${action}`),
  ].join('\n');
}

export async function runPantavionKernelEntrypoint(): Promise<PantavionKernelEntrypointOutput> {
  const terminal = await runPantavionKernelTerminalRunner();
  const artifact = buildKernelRunArtifact(terminal);

  const output: PantavionKernelEntrypointOutput = {
    completedAt: nowIso(),
    exitCode: 0,
    artifact,
    terminal,
    rendered: '',
  };

  output.rendered = renderKernelEntrypointOutput(output);

  return output;
}

export default runPantavionKernelEntrypoint;
