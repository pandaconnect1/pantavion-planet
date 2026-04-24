// core/storage/kernel-persistence-orchestrator.ts

import {
  runPantavionKernelOneShotRunner,
  type PantavionKernelOneShotRunnerOutput,
} from '../kernel/kernel-one-shot-runner';

import {
  buildKernelBootstrapManifest,
  type PantavionKernelBootstrapManifest,
} from '../kernel/kernel-bootstrap-manifest';

import {
  buildKernelFoundationLock,
  type PantavionKernelFoundationLock,
} from '../kernel/kernel-foundation-lock';

import {
  saveKernelState,
  getKernelStateStoreSnapshot,
  type PantavionKernelStateStoreSnapshot,
} from './kernel-state-store';

import {
  saveKernelArtifact,
  getKernelArtifactStoreSnapshot,
  type PantavionKernelArtifactStoreSnapshot,
} from './kernel-artifact-store';

import {
  syncKernelAdmissionStore,
  getKernelAdmissionStoreSnapshot,
  type PantavionKernelAdmissionStoreRecord,
  type PantavionKernelAdmissionStoreSnapshot,
} from './kernel-admission-store';

import {
  generateAndStoreFoundationReport,
  generateAndStoreClosureReport,
  getKernelReportStoreSnapshot,
  type PantavionKernelReportStoreRecord,
  type PantavionKernelReportStoreSnapshot,
} from './kernel-report-store';

export interface PantavionKernelPersistenceWaveOutput {
  generatedAt: string;
  oneShot: PantavionKernelOneShotRunnerOutput;
  manifest: PantavionKernelBootstrapManifest;
  foundationLock: PantavionKernelFoundationLock;
  admissionSnapshot: PantavionKernelAdmissionStoreRecord;
  foundationReportRecord: PantavionKernelReportStoreRecord;
  closureReportRecord: PantavionKernelReportStoreRecord;
  stateSnapshot: PantavionKernelStateStoreSnapshot;
  artifactSnapshot: PantavionKernelArtifactStoreSnapshot;
  admissionStoreSnapshot: PantavionKernelAdmissionStoreSnapshot;
  reportStoreSnapshot: PantavionKernelReportStoreSnapshot;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderPersistenceWave(
  output: PantavionKernelPersistenceWaveOutput,
): string {
  return [
    'PANTAVION KERNEL PERSISTENCE WAVE',
    `generatedAt=${output.generatedAt}`,
    `readiness=${output.oneShot.entrypoint.artifact.readinessStatus}`,
    `ops=${output.oneShot.entrypoint.artifact.opsStatus}`,
    `controlPlaneMode=${output.oneShot.entrypoint.artifact.controlPlaneMode}`,
    `resilience=${output.oneShot.entrypoint.artifact.resilienceMode}`,
    '',
    'STATE STORE',
    `entryCount=${output.stateSnapshot.entryCount}`,
    `latestUpdatedAt=${output.stateSnapshot.latestUpdatedAt ?? ''}`,
    '',
    'ARTIFACT STORE',
    `entryCount=${output.artifactSnapshot.entryCount}`,
    `latestArtifactId=${output.artifactSnapshot.latestArtifactId ?? ''}`,
    '',
    'ADMISSION STORE',
    `snapshotCount=${output.admissionStoreSnapshot.snapshotCount}`,
    `latestItemCount=${output.admissionStoreSnapshot.latestItemCount}`,
    '',
    'REPORT STORE',
    `entryCount=${output.reportStoreSnapshot.entryCount}`,
    `foundationCount=${output.reportStoreSnapshot.foundationCount}`,
    `closureCount=${output.reportStoreSnapshot.closureCount}`,
    '',
    'PERSISTED KEYS',
    ...output.stateSnapshot.keys.map((key) => `- ${key}`),
  ].join('\n');
}

export async function runKernelPersistenceWave(): Promise<PantavionKernelPersistenceWaveOutput> {
  const oneShot = await runPantavionKernelOneShotRunner();
  const manifest = buildKernelBootstrapManifest();
  const foundationLock = buildKernelFoundationLock();

  saveKernelState({
    key: 'kernel.one-shot.latest',
    kind: 'snapshot',
    payload: oneShot,
    tags: ['kernel', 'one-shot', 'latest'],
    metadata: {
      readiness: oneShot.entrypoint.artifact.readinessStatus,
      ops: oneShot.entrypoint.artifact.opsStatus,
    },
  });

  saveKernelState({
    key: 'kernel.manifest.latest',
    kind: 'manifest',
    payload: manifest,
    tags: ['kernel', 'manifest', 'latest'],
    metadata: {
      sections: manifest.sections.length,
    },
  });

  saveKernelState({
    key: 'kernel.foundation-lock.latest',
    kind: 'lock',
    payload: foundationLock,
    tags: ['kernel', 'foundation-lock', 'latest'],
    metadata: {
      status: foundationLock.status,
      pathCount: foundationLock.authoritativeBuildPath.length,
    },
  });

  const artifactRecord = saveKernelArtifact(oneShot.entrypoint.artifact);
  const admissionSnapshot = syncKernelAdmissionStore();
  const foundationReportRecord = await generateAndStoreFoundationReport();
  const closureReportRecord = await generateAndStoreClosureReport();

  const output: PantavionKernelPersistenceWaveOutput = {
    generatedAt: nowIso(),
    oneShot,
    manifest,
    foundationLock,
    admissionSnapshot,
    foundationReportRecord,
    closureReportRecord,
    stateSnapshot: getKernelStateStoreSnapshot(),
    artifactSnapshot: getKernelArtifactStoreSnapshot(),
    admissionStoreSnapshot: getKernelAdmissionStoreSnapshot(),
    reportStoreSnapshot: getKernelReportStoreSnapshot(),
    rendered: '',
  };

  output.rendered = renderPersistenceWave(output);

  void artifactRecord;

  return output;
}

export default runKernelPersistenceWave;
