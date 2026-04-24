// core/kernel/kernel-one-shot-runner.ts

import {
  runPantavionKernelEntrypoint,
  type PantavionKernelEntrypointOutput,
} from './kernel-entrypoint';

import {
  runKernelFoundationReport,
  type PantavionKernelFoundationReport,
} from './kernel-foundation-report';

import {
  createKernelSavedExport,
  type PantavionKernelSavedExport,
} from './kernel-saved-export';

import {
  buildKernelBootstrapManifest,
  type PantavionKernelBootstrapManifest,
} from './kernel-bootstrap-manifest';

export interface PantavionKernelOneShotRunnerOutput {
  generatedAt: string;
  entrypoint: PantavionKernelEntrypointOutput;
  foundationReport: PantavionKernelFoundationReport;
  manifest: PantavionKernelBootstrapManifest;
  savedJson: PantavionKernelSavedExport;
  savedSummary: PantavionKernelSavedExport;
  savedCombined: PantavionKernelSavedExport;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderOneShotOutput(
  output: PantavionKernelOneShotRunnerOutput,
): string {
  return [
    'PANTAVION KERNEL ONE-SHOT RUNNER',
    `generatedAt=${output.generatedAt}`,
    `readiness=${output.entrypoint.artifact.readinessStatus}`,
    `score=${output.entrypoint.artifact.readinessScore.toFixed(2)}`,
    `ops=${output.entrypoint.artifact.opsStatus}`,
    `controlPlaneMode=${output.entrypoint.artifact.controlPlaneMode}`,
    `resilience=${output.entrypoint.artifact.resilienceMode}`,
    '',
    'SAVED EXPORTS',
    `json=${output.savedJson.filenameHint} (${output.savedJson.byteLength} bytes)`,
    `summary=${output.savedSummary.filenameHint} (${output.savedSummary.byteLength} bytes)`,
    `combined=${output.savedCombined.filenameHint} (${output.savedCombined.byteLength} bytes)`,
    '',
    'MANIFEST',
    `sections=${output.manifest.sections.length}`,
    `taxonomyNodeCount=${output.manifest.taxonomyNodeCount}`,
    `capabilityRegistryEntryCount=${output.manifest.capabilityRegistryEntryCount}`,
    '',
    'FOUNDATION REPORT',
    `status=${output.foundationReport.status}`,
    `readiness=${output.foundationReport.readiness.status}`,
    `ops=${output.foundationReport.ops.status}`,
  ].join('\n');
}

export async function runPantavionKernelOneShotRunner(): Promise<PantavionKernelOneShotRunnerOutput> {
  const entrypoint = await runPantavionKernelEntrypoint();
  const foundationReport = await runKernelFoundationReport();
  const manifest = buildKernelBootstrapManifest();

  const savedJson = await createKernelSavedExport({
    kind: 'json',
    command: 'run:entrypoint',
    metadata: {
      oneShot: true,
    },
  });

  const savedSummary = await createKernelSavedExport({
    kind: 'summary',
    metadata: {
      oneShot: true,
    },
  });

  const savedCombined = await createKernelSavedExport({
    kind: 'combined',
    command: 'run:entrypoint',
    metadata: {
      oneShot: true,
    },
  });

  const output: PantavionKernelOneShotRunnerOutput = {
    generatedAt: nowIso(),
    entrypoint,
    foundationReport,
    manifest,
    savedJson,
    savedSummary,
    savedCombined,
    rendered: '',
  };

  output.rendered = renderOneShotOutput(output);

  return output;
}

export default runPantavionKernelOneShotRunner;
