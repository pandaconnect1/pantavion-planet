// core/app/secrets-deploy-observability-integration-wave.ts

import { listDeploymentEnvironments, getDeploymentEnvironmentSnapshot } from './deployment-environment-registry';
import { listSecretRuntimeBindings, getSecretRuntimeBindingSnapshot } from './secret-runtime-binding-registry';
import { listObservabilitySignals, getObservabilitySignalSnapshot } from './observability-signal-registry';
import {
  evaluateDeployReadiness,
  getDeployReadinessSnapshot,
  type PantavionDeployReadinessDecision,
  type PantavionDeployReadinessRequest,
} from './deploy-readiness-gate';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionSecretsDeployObservabilityIntegrationWaveOutput {
  generatedAt: string;
  environmentSnapshot: ReturnType<typeof getDeploymentEnvironmentSnapshot>;
  secretBindingSnapshot: ReturnType<typeof getSecretRuntimeBindingSnapshot>;
  observabilitySnapshot: ReturnType<typeof getObservabilitySignalSnapshot>;
  deployReadinessSnapshot: ReturnType<typeof getDeployReadinessSnapshot>;
  decisions: PantavionDeployReadinessDecision[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionSecretsDeployObservabilityIntegrationWaveOutput): string {
  const environments = listDeploymentEnvironments();
  const bindings = listSecretRuntimeBindings();
  const signals = listObservabilitySignals();

  return [
    'PANTAVION SECRETS DEPLOY OBSERVABILITY INTEGRATION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'DEPLOYMENT ENVIRONMENTS',
    `environmentCount=${output.environmentSnapshot.environmentCount}`,
    `publicSurfaceEnabledCount=${output.environmentSnapshot.publicSurfaceEnabledCount}`,
    `secretsIsolatedCount=${output.environmentSnapshot.secretsIsolatedCount}`,
    `observabilityRequiredCount=${output.environmentSnapshot.observabilityRequiredCount}`,
    `founderDeployApprovalRequiredCount=${output.environmentSnapshot.founderDeployApprovalRequiredCount}`,
    '',
    ...environments.flatMap((item) => [
      `${item.environmentKey}`,
      `publicSurfaceEnabled=${item.publicSurfaceEnabled ? 'yes' : 'no'}`,
      `founderDeployApprovalRequired=${item.founderDeployApprovalRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'SECRET RUNTIME BINDINGS',
    `bindingCount=${output.secretBindingSnapshot.bindingCount}`,
    `serverOnlyCount=${output.secretBindingSnapshot.serverOnlyCount}`,
    `workerOnlyCount=${output.secretBindingSnapshot.workerOnlyCount}`,
    `founderBreakglassCount=${output.secretBindingSnapshot.founderBreakglassCount}`,
    `rotationRequiredCount=${output.secretBindingSnapshot.rotationRequiredCount}`,
    '',
    ...bindings.flatMap((item) => [
      `${item.bindingKey}`,
      `environmentKey=${item.environmentKey}`,
      `runtimeSurface=${item.runtimeSurface}`,
      `clientExposureBlocked=${item.clientExposureBlocked ? 'yes' : 'no'}`,
      '',
    ]),
    'OBSERVABILITY SIGNALS',
    `signalCount=${output.observabilitySnapshot.signalCount}`,
    `productionSignalCount=${output.observabilitySnapshot.productionSignalCount}`,
    `founderVisibleCount=${output.observabilitySnapshot.founderVisibleCount}`,
    `highOrCriticalCount=${output.observabilitySnapshot.highOrCriticalCount}`,
    '',
    ...signals.flatMap((item) => [
      `${item.signalKey}`,
      `signalClass=${item.signalClass}`,
      `severity=${item.severity}`,
      `founderVisible=${item.founderVisible ? 'yes' : 'no'}`,
      '',
    ]),
    'DEPLOY READINESS GATE',
    `evaluatedCount=${output.deployReadinessSnapshot.evaluatedCount}`,
    `allowedCount=${output.deployReadinessSnapshot.allowedCount}`,
    `blockedCount=${output.deployReadinessSnapshot.blockedCount}`,
    `incidentBlockedCount=${output.deployReadinessSnapshot.incidentBlockedCount}`,
    `founderApprovalRequiredCount=${output.deployReadinessSnapshot.founderApprovalRequiredCount}`,
    `secretRotationRequiredCount=${output.deployReadinessSnapshot.secretRotationRequiredCount}`,
    '',
    ...output.decisions.flatMap((item) => [
      `${item.environmentKey}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `blockedByIncident=${item.blockedByIncident ? 'yes' : 'no'}`,
      `requiresFounderApproval=${item.requiresFounderApproval ? 'yes' : 'no'}`,
      `requiresSecretRotation=${item.requiresSecretRotation ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runSecretsDeployObservabilityIntegrationWave(): Promise<PantavionSecretsDeployObservabilityIntegrationWaveOutput> {
  const requests: PantavionDeployReadinessRequest[] = [
    {
      environmentKey: 'development',
      founderApprovalPresent: false,
      observabilityReady: false,
      secretsRotationAgeDays: 12,
      activeCriticalIncident: false,
    },
    {
      environmentKey: 'staging',
      founderApprovalPresent: false,
      observabilityReady: true,
      secretsRotationAgeDays: 30,
      activeCriticalIncident: false,
    },
    {
      environmentKey: 'production',
      founderApprovalPresent: false,
      observabilityReady: true,
      secretsRotationAgeDays: 22,
      activeCriticalIncident: false,
    },
    {
      environmentKey: 'production',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 120,
      activeCriticalIncident: false,
    },
    {
      environmentKey: 'production',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 12,
      activeCriticalIncident: true,
    },
  ];

  const decisions = requests.map((item) => evaluateDeployReadiness(item));

  const output: PantavionSecretsDeployObservabilityIntegrationWaveOutput = {
    generatedAt: nowIso(),
    environmentSnapshot: getDeploymentEnvironmentSnapshot(),
    secretBindingSnapshot: getSecretRuntimeBindingSnapshot(),
    observabilitySnapshot: getObservabilitySignalSnapshot(),
    deployReadinessSnapshot: getDeployReadinessSnapshot(decisions),
    decisions,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'app.secrets-deploy-observability.latest',
    kind: 'report',
    payload: {
      environmentSnapshot: output.environmentSnapshot,
      secretBindingSnapshot: output.secretBindingSnapshot,
      observabilitySnapshot: output.observabilitySnapshot,
      deployReadinessSnapshot: output.deployReadinessSnapshot,
      environments: listDeploymentEnvironments(),
      bindings: listSecretRuntimeBindings(),
      signals: listObservabilitySignals(),
      decisions: output.decisions,
    },
    tags: ['app', 'secrets', 'deploy', 'observability', 'latest'],
    metadata: {
      environmentCount: output.environmentSnapshot.environmentCount,
      bindingCount: output.secretBindingSnapshot.bindingCount,
      signalCount: output.observabilitySnapshot.signalCount,
      deployAllowedCount: output.deployReadinessSnapshot.allowedCount,
      deployBlockedCount: output.deployReadinessSnapshot.blockedCount,
    },
  });

  return output;
}

export default runSecretsDeployObservabilityIntegrationWave;
