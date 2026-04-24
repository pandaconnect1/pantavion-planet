// core/app/secret-runtime-binding-registry.ts

import type { PantavionDeploymentEnvironment } from './deployment-environment-registry';

export type PantavionSecretBindingClass =
  | 'provider-api'
  | 'billing'
  | 'internal-signing'
  | 'observability'
  | 'breakglass';

export interface PantavionSecretRuntimeBindingRecord {
  bindingKey: string;
  environmentKey: PantavionDeploymentEnvironment;
  bindingClass: PantavionSecretBindingClass;
  runtimeSurface: 'server-only' | 'worker-only' | 'founder-breakglass';
  rotationRequired: boolean;
  clientExposureBlocked: boolean;
  notes: string[];
}

export interface PantavionSecretRuntimeBindingSnapshot {
  generatedAt: string;
  bindingCount: number;
  serverOnlyCount: number;
  workerOnlyCount: number;
  founderBreakglassCount: number;
  rotationRequiredCount: number;
  clientExposureBlockedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SECRET_RUNTIME_BINDINGS: PantavionSecretRuntimeBindingRecord[] = [
  {
    bindingKey: 'provider_api_prod',
    environmentKey: 'production',
    bindingClass: 'provider-api',
    runtimeSurface: 'server-only',
    rotationRequired: true,
    clientExposureBlocked: true,
    notes: ['Provider API secrets are server-only in production.'],
  },
  {
    bindingKey: 'billing_prod',
    environmentKey: 'production',
    bindingClass: 'billing',
    runtimeSurface: 'server-only',
    rotationRequired: true,
    clientExposureBlocked: true,
    notes: ['Billing secrets remain server-only and tightly audited.'],
  },
  {
    bindingKey: 'observability_staging',
    environmentKey: 'staging',
    bindingClass: 'observability',
    runtimeSurface: 'worker-only',
    rotationRequired: true,
    clientExposureBlocked: true,
    notes: ['Observability tokens are never exposed to clients.'],
  },
  {
    bindingKey: 'internal_signing_prod',
    environmentKey: 'production',
    bindingClass: 'internal-signing',
    runtimeSurface: 'server-only',
    rotationRequired: true,
    clientExposureBlocked: true,
    notes: ['Internal signing material remains protected at runtime.'],
  },
  {
    bindingKey: 'breakglass_founder_prod',
    environmentKey: 'production',
    bindingClass: 'breakglass',
    runtimeSurface: 'founder-breakglass',
    rotationRequired: true,
    clientExposureBlocked: true,
    notes: ['Breakglass is founder-visible, rare, and rotation-triggering.'],
  },
];

export function listSecretRuntimeBindings(): PantavionSecretRuntimeBindingRecord[] {
  return SECRET_RUNTIME_BINDINGS.map((item) => cloneValue(item));
}

export function getSecretRuntimeBindingSnapshot(): PantavionSecretRuntimeBindingSnapshot {
  const list = listSecretRuntimeBindings();

  return {
    generatedAt: nowIso(),
    bindingCount: list.length,
    serverOnlyCount: list.filter((item) => item.runtimeSurface === 'server-only').length,
    workerOnlyCount: list.filter((item) => item.runtimeSurface === 'worker-only').length,
    founderBreakglassCount: list.filter((item) => item.runtimeSurface === 'founder-breakglass').length,
    rotationRequiredCount: list.filter((item) => item.rotationRequired).length,
    clientExposureBlockedCount: list.filter((item) => item.clientExposureBlocked).length,
  };
}

export default listSecretRuntimeBindings;
