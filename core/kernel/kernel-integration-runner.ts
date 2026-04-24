// core/kernel/kernel-integration-runner.ts

import { pantavionFoundation } from './kernel-bootstrap';
import { runPantavionFoundationSmoke } from './kernel-foundation-smoke';
import {
  evaluateKernelAdmission,
  type PantavionAdmissionRunOutput,
} from './kernel-admission';

import {
  getCapabilityFamilyRegistrySnapshot,
  type PantavionCapabilityRegistrySnapshot,
} from '../registry/capability-family-registry';

import {
  getProtocolGatewayStats,
  getProtocolRegistrySnapshot,
} from '../protocol/protocol-gateway';

import { getResilienceSnapshot, type PantavionResilienceSnapshot } from '../runtime/resilience-runtime';

export interface PantavionKernelIntegrationRunnerOutput {
  bootSnapshot: ReturnType<typeof pantavionFoundation.getSnapshot>;
  smoke: Awaited<ReturnType<typeof runPantavionFoundationSmoke>>;
  admission: PantavionAdmissionRunOutput;
  registrySnapshot: PantavionCapabilityRegistrySnapshot;
  protocolAdapterCount: number;
  protocolGatewayStats: ReturnType<typeof getProtocolGatewayStats>;
  resilienceSnapshot: PantavionResilienceSnapshot;
}

export async function runPantavionKernelIntegration(): Promise<PantavionKernelIntegrationRunnerOutput> {
  const smoke = await runPantavionFoundationSmoke();

  const admission = await evaluateKernelAdmission({
    title: 'Resilience-aware kernel admission runner',
    description:
      'Admission candidate for stronger integration runner alignment across kernel, protocol and runtime foundation.',
    objectKind: 'service',
    familyKeyHint: 'kernel',
    targetPath: 'core/kernel/kernel-integration-runner.ts',
    targetModule: 'kernel',
    requestedCapabilities: [
      'capability-lookup',
      'policy-evaluation',
      'build-recommendation',
      'admin-alert-generation',
    ],
    tags: ['kernel', 'integration', 'runner', 'bootstrap'],
    protocolFamilies: ['internal'],
    runtimeFamilies: ['durable-execution', 'workspace-runtime', 'voice-runtime', 'resilience-runtime'],
    riskHint: 'medium',
    sensitivity: 'internal',
    truthPreference: 'deterministic',
    actorId: pantavionFoundation.actors.adminRoot.id,
    actorRole: 'admin-operator',
    actorScopes: ['global'],
    metadata: {
      integrationRunner: true,
      smoke: true,
    },
  });

  const registrySnapshot = getCapabilityFamilyRegistrySnapshot();
  const protocolSnapshot = getProtocolRegistrySnapshot();
  const protocolGatewayStats = getProtocolGatewayStats();
  const resilienceSnapshot = getResilienceSnapshot();

  return {
    bootSnapshot: pantavionFoundation.getSnapshot(),
    smoke,
    admission,
    registrySnapshot,
    protocolAdapterCount: protocolSnapshot.adapters.length,
    protocolGatewayStats,
    resilienceSnapshot,
  };
}

export default runPantavionKernelIntegration;
