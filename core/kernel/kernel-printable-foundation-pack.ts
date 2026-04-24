// core/kernel/kernel-printable-foundation-pack.ts

import {
  runKernelFoundationReport,
  type PantavionKernelFoundationReport,
} from './kernel-foundation-report';

import {
  buildKernelBootstrapManifest,
  type PantavionKernelBootstrapManifest,
} from './kernel-bootstrap-manifest';

import {
  buildKernelBootstrapCommandPack,
  type PantavionKernelBootstrapCommandPack,
} from './kernel-bootstrap-command-pack';

import {
  runKernelArtifactGeneration,
  type PantavionKernelRunArtifact,
} from './kernel-run-artifact';

import { buildKernelArtifactSummary } from './kernel-artifact-summary';

export interface PantavionPrintableFoundationPack {
  generatedAt: string;
  foundationReport: PantavionKernelFoundationReport;
  manifest: PantavionKernelBootstrapManifest;
  commandPack: PantavionKernelBootstrapCommandPack;
  artifact: PantavionKernelRunArtifact;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderPrintableFoundationPack(
  pack: PantavionPrintableFoundationPack,
): string {
  const artifactSummary = buildKernelArtifactSummary(pack.artifact);

  return [
    'PANTAVION PRINTABLE FOUNDATION PACK',
    `generatedAt=${pack.generatedAt}`,
    '',
    'FOUNDATION REPORT',
    pack.foundationReport.rendered,
    '',
    'BOOTSTRAP MANIFEST',
    pack.manifest.rendered,
    '',
    'BOOTSTRAP COMMAND PACK',
    pack.commandPack.rendered,
    '',
    'ARTIFACT SUMMARY',
    artifactSummary.rendered,
  ].join('\n');
}

export async function runPrintableFoundationPack(): Promise<PantavionPrintableFoundationPack> {
  const foundationReport = await runKernelFoundationReport();
  const manifest = buildKernelBootstrapManifest();
  const commandPack = buildKernelBootstrapCommandPack();
  const artifact = await runKernelArtifactGeneration();

  const pack: PantavionPrintableFoundationPack = {
    generatedAt: nowIso(),
    foundationReport,
    manifest,
    commandPack,
    artifact,
    rendered: '',
  };

  pack.rendered = renderPrintableFoundationPack(pack);

  return pack;
}

export default runPrintableFoundationPack;
