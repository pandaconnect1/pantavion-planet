// core/kernel/kernel-usage-harness.ts

import { pantavionFoundation } from './kernel-bootstrap';
import { runPantavionKernelIntegration } from './kernel-integration-runner';
import { evaluateKernelAdmissionPolicy } from './kernel-admission-policy';
import { getKernelTaxonomySnapshot } from './kernel-taxonomy';
import { getCapabilityFamilyRegistrySnapshot } from '../registry/capability-family-registry';
import { getProtocolGatewayStats } from '../protocol/protocol-gateway';
import { getResilienceSnapshot } from '../runtime/resilience-runtime';

export interface PantavionUsageHarnessOutput {
  boot: ReturnType<typeof pantavionFoundation.getSnapshot>;
  integration: Awaited<ReturnType<typeof runPantavionKernelIntegration>>;
  taxonomyNodeCount: number;
  capabilityRegistryEntryCount: number;
  protocolGatewayDispatchCount: number;
  resilienceMode: ReturnType<typeof getResilienceSnapshot>['mode'];
  policyChecks: Array<{
    title: string;
    allowed: boolean;
    band: string;
    controls: string[];
  }>;
}

export async function runPantavionUsageHarness(): Promise<PantavionUsageHarnessOutput> {
  const integration = await runPantavionKernelIntegration();

  const policyA = await evaluateKernelAdmissionPolicy({
    title: 'Voice runtime advanced translator bridge',
    description:
      'Admission candidate for richer multilingual interpreter orchestration over the canonical voice runtime.',
    objectKind: 'service',
    familyKeyHint: 'voice',
    targetPath: 'core/runtime/voice-runtime.ts',
    targetModule: 'voice',
    requestedCapabilities: [
      'voice-runtime-awareness',
      'governed-routing',
      'explainability',
    ],
    tags: ['voice', 'translation', 'interpreter', 'runtime'],
    protocolFamilies: ['internal'],
    runtimeFamilies: ['voice-runtime'],
    riskHint: 'medium',
    sensitivity: 'internal',
    truthPreference: 'verified',
    actorId: pantavionFoundation.actors.adminRoot.id,
    actorRole: 'admin-operator',
    actorScopes: ['global'],
    metadata: {
      harness: true,
      scenario: 'voice-upgrade',
    },
  });

  const policyB = await evaluateKernelAdmissionPolicy({
    title: 'Restricted crisis escalation console',
    description:
      'Admission candidate for a governed high-risk crisis escalation surface with sensitive operational controls.',
    objectKind: 'governed-surface',
    familyKeyHint: 'admin',
    targetPath: 'core/kernel/restricted-crisis-escalation-console.ts',
    targetModule: 'admin',
    requestedCapabilities: [
      'policy-evaluation',
      'admin-alert-generation',
      'capability-lookup',
    ],
    tags: ['crisis', 'restricted', 'admin', 'governed-surface'],
    protocolFamilies: ['internal'],
    runtimeFamilies: ['resilience-runtime'],
    riskHint: 'restricted',
    sensitivity: 'restricted',
    truthPreference: 'deterministic',
    actorId: pantavionFoundation.actors.adminRoot.id,
    actorRole: 'admin-operator',
    actorScopes: ['global'],
    metadata: {
      harness: true,
      scenario: 'restricted-console',
    },
  });

  const taxonomySnapshot = getKernelTaxonomySnapshot();
  const capabilityRegistrySnapshot = getCapabilityFamilyRegistrySnapshot();
  const protocolGatewayStats = getProtocolGatewayStats();
  const resilienceSnapshot = getResilienceSnapshot();

  return {
    boot: pantavionFoundation.getSnapshot(),
    integration,
    taxonomyNodeCount: taxonomySnapshot.nodeCount,
    capabilityRegistryEntryCount: capabilityRegistrySnapshot.entryCount,
    protocolGatewayDispatchCount: protocolGatewayStats.dispatchCount,
    resilienceMode: resilienceSnapshot.mode,
    policyChecks: [
      {
        title: policyA.admission.record.candidate.title,
        allowed: policyA.allowed,
        band: policyA.band,
        controls: [...policyA.requiredControls],
      },
      {
        title: policyB.admission.record.candidate.title,
        allowed: policyB.allowed,
        band: policyB.band,
        controls: [...policyB.requiredControls],
      },
    ],
  };
}

export default runPantavionUsageHarness;
