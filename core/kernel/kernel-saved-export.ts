// core/kernel/kernel-saved-export.ts

import type { PantavionKernelCommandKey } from './kernel-command-surface';

import {
  runKernelExportedRunner,
  type PantavionKernelExportedRunnerPayload,
} from './kernel-exported-runner';

import {
  runKernelArtifactGeneration,
  type PantavionKernelRunArtifact,
} from './kernel-run-artifact';

import {
  buildKernelArtifactSummary,
  type PantavionKernelArtifactSummary,
} from './kernel-artifact-summary';

export type PantavionKernelSavedExportKind =
  | 'json'
  | 'summary'
  | 'combined';

export interface PantavionKernelSavedExportMetadata {
  [key: string]: unknown;
}

export interface PantavionKernelSavedExportInput {
  kind: PantavionKernelSavedExportKind;
  command?: PantavionKernelCommandKey;
  metadata?: PantavionKernelSavedExportMetadata;
}

export interface PantavionKernelSavedExport {
  generatedAt: string;
  kind: PantavionKernelSavedExportKind;
  filenameHint: string;
  mimeType: 'text/plain' | 'application/json';
  text: string;
  byteLength: number;
  metadata: PantavionKernelSavedExportMetadata;
}

function nowIso(): string {
  return new Date().toISOString();
}

function compactTimestamp(): string {
  return nowIso().replace(/[:.]/g, '-');
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function renderCombinedText(input: {
  artifact: PantavionKernelRunArtifact;
  summary: PantavionKernelArtifactSummary;
  exported: PantavionKernelExportedRunnerPayload;
}): string {
  return [
    'PANTAVION KERNEL SAVED EXPORT',
    '',
    'ARTIFACT SUMMARY',
    input.summary.rendered,
    '',
    'TERMINAL SUMMARY',
    input.artifact.terminalSummary,
    '',
    'EXPORTED JSON',
    input.exported.json ?? '{}',
  ].join('\n');
}

export async function createKernelSavedExport(
  input: PantavionKernelSavedExportInput,
): Promise<PantavionKernelSavedExport> {
  const metadata = input.metadata ?? {};

  if (input.kind === 'json') {
    const exported = await runKernelExportedRunner({
      command: input.command ?? 'run:entrypoint',
      metadata,
    });

    const text = exported.json ?? '{}';

    return {
      generatedAt: nowIso(),
      kind: input.kind,
      filenameHint: `pantavion-kernel-export-${compactTimestamp()}.json`,
      mimeType: 'application/json',
      text,
      byteLength: byteLength(text),
      metadata,
    };
  }

  if (input.kind === 'summary') {
    const artifact = await runKernelArtifactGeneration();
    const summary = buildKernelArtifactSummary(artifact);
    const text = summary.rendered;

    return {
      generatedAt: nowIso(),
      kind: input.kind,
      filenameHint: `pantavion-kernel-summary-${compactTimestamp()}.txt`,
      mimeType: 'text/plain',
      text,
      byteLength: byteLength(text),
      metadata,
    };
  }

  const artifact = await runKernelArtifactGeneration();
  const summary = buildKernelArtifactSummary(artifact);
  const exported = await runKernelExportedRunner({
    command: input.command ?? 'run:entrypoint',
    metadata,
  });

  const text = renderCombinedText({
    artifact,
    summary,
    exported,
  });

  return {
    generatedAt: nowIso(),
    kind: 'combined',
    filenameHint: `pantavion-kernel-combined-${compactTimestamp()}.txt`,
    mimeType: 'text/plain',
    text,
    byteLength: byteLength(text),
    metadata,
  };
}

export default createKernelSavedExport;
