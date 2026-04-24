// core/kernel/kernel-run-artifact.ts

import {
  runPantavionKernelTerminalRunner,
  type PantavionKernelTerminalRunnerOutput,
} from './kernel-terminal-runner';

import {
  buildKernelJsonExportFromTerminalRunner,
  renderKernelJsonExport,
  type PantavionKernelJsonExportEnvelope,
} from './kernel-json-export';

export interface PantavionKernelRunArtifact {
  artifactId: string;
  generatedAt: string;
  summary: string;
  terminalSummary: string;
  readinessStatus: string;
  readinessScore: number;
  controlPlaneMode: string;
  opsStatus: string;
  resilienceMode: string;
  priorityCount: number;
  topActions: string[];
  jsonExport: PantavionKernelJsonExportEnvelope;
  jsonText: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function buildKernelRunArtifact(
  output: PantavionKernelTerminalRunnerOutput,
): PantavionKernelRunArtifact {
  const jsonExport = buildKernelJsonExportFromTerminalRunner(output, {
    artifactKind: 'kernel-run-artifact',
  });

  const jsonText = renderKernelJsonExport(jsonExport);

  return {
    artifactId: createId('art'),
    generatedAt: nowIso(),
    summary: `artifact:${output.realRunner.readiness.status} / ops:${output.opsReport.status} / mode:${output.realRunner.controlPlane.mode}`,
    terminalSummary: output.rendered,
    readinessStatus: output.realRunner.readiness.status,
    readinessScore: output.realRunner.readiness.score,
    controlPlaneMode: output.realRunner.controlPlane.mode,
    opsStatus: output.opsReport.status,
    resilienceMode: output.realRunner.controlPlane.resilienceMode,
    priorityCount: output.opsReport.priorities.items.length,
    topActions: uniqStrings(output.opsReport.topActions),
    jsonExport,
    jsonText,
  };
}

export async function runKernelArtifactGeneration(): Promise<PantavionKernelRunArtifact> {
  const output = await runPantavionKernelTerminalRunner();
  return buildKernelRunArtifact(output);
}

export default runKernelArtifactGeneration;
