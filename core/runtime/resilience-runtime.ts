export type PantavionResilienceMode = 'normal' | 'degraded' | 'fallback' | 'protected';

export interface PantavionResilienceState {
  mode: PantavionResilienceMode;
  reasons: string[];
  updatedAt: string;
}

export function createResilienceState(
  mode: PantavionResilienceMode = 'normal',
  reasons: string[] = [],
): PantavionResilienceState {
  return {
    mode,
    reasons,
    updatedAt: new Date().toISOString(),
  };
}

export const pantavionFoundation } from './kernel-bootstrap';
import { runPantavionKernelIntegration } from './kernel-integration-runner';
import { evaluateKernelAdmissionPolicy } from './kernel-admission-policy';
import { getKernelTaxonomySnapshot } from './kernel-taxonomy';
import { getCapabilityFamilyRegistrySnapshot } from '../registry/capability-family-registry';
import { getProtocolGatewayStats } from '../protocol/protocol-gateway';
import { getResilienceSnapshot: any = undefined;
export type pantavionFoundation } from './kernel-bootstrap';
import { runPantavionKernelIntegration } from './kernel-integration-runner';
import { evaluateKernelAdmissionPolicy } from './kernel-admission-policy';
import { getKernelTaxonomySnapshot } from './kernel-taxonomy';
import { getCapabilityFamilyRegistrySnapshot } from '../registry/capability-family-registry';
import { getProtocolGatewayStats } from '../protocol/protocol-gateway';
import { getResilienceSnapshot = any;
