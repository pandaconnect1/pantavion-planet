// core/kernel/kernel-foundation-lock.ts

import {
  buildKernelBootstrapManifest,
  type PantavionKernelBootstrapManifest,
} from './kernel-bootstrap-manifest';

import {
  getKernelTaxonomySnapshot,
  type PantavionKernelTaxonomySnapshot,
} from './kernel-taxonomy';

import {
  getCapabilityFamilyRegistrySnapshot,
  type PantavionCapabilityRegistrySnapshot,
} from '../registry/capability-family-registry';

import {
  buildKernelBootstrapCommandPack,
  type PantavionKernelBootstrapCommandPack,
} from './kernel-bootstrap-command-pack';

export type PantavionFoundationLockStatus =
  | 'locked'
  | 'locked-with-hardening-ahead';

export interface PantavionFoundationLockedPath {
  path: string;
  role: string;
  required: true;
}

export interface PantavionKernelFoundationLock {
  generatedAt: string;
  status: PantavionFoundationLockStatus;
  activeProject: 'pantavion-one-clean';
  authoritativeBuildPath: PantavionFoundationLockedPath[];
  manifest: PantavionKernelBootstrapManifest;
  taxonomy: PantavionKernelTaxonomySnapshot;
  registry: PantavionCapabilityRegistrySnapshot;
  commandPack: PantavionKernelBootstrapCommandPack;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildAuthoritativeBuildPath(): PantavionFoundationLockedPath[] {
  return [
    {
      path: 'types/pantavion.ts',
      role: 'shared Pantavion types',
      required: true,
    },
    {
      path: 'core/canonical/canonical-registry.ts',
      role: 'canonical placement and decision recording',
      required: true,
    },
    {
      path: 'core/registry/capability-registry.ts',
      role: 'capability lookup and matching',
      required: true,
    },
    {
      path: 'core/security/security-policy.ts',
      role: 'policy and disposition evaluation',
      required: true,
    },
    {
      path: 'core/admin/admin-alerts.ts',
      role: 'admin alert publication',
      required: true,
    },
    {
      path: 'core/kernel/kernel.ts',
      role: 'Kernel 0 coordinator',
      required: true,
    },
    {
      path: 'core/identity/identity-model.ts',
      role: 'identity posture and trust model',
      required: true,
    },
    {
      path: 'core/identity/delegation-model.ts',
      role: 'delegation and approval-aware authority',
      required: true,
    },
    {
      path: 'core/protocol/protocol-types.ts',
      role: 'protocol contracts and envelopes',
      required: true,
    },
    {
      path: 'core/protocol/protocol-gateway.ts',
      role: 'governed protocol dispatch',
      required: true,
    },
    {
      path: 'core/runtime/durable-execution.ts',
      role: 'durable execution runtime',
      required: true,
    },
    {
      path: 'core/runtime/workspace-runtime.ts',
      role: 'workspace runtime',
      required: true,
    },
    {
      path: 'core/runtime/voice-runtime.ts',
      role: 'voice runtime',
      required: true,
    },
    {
      path: 'core/runtime/resilience-runtime.ts',
      role: 'resilience runtime',
      required: true,
    },
  ];
}

function renderFoundationLock(
  lock: PantavionKernelFoundationLock,
): string {
  return [
    'PANTAVION FOUNDATION LOCK',
    `generatedAt=${lock.generatedAt}`,
    `status=${lock.status}`,
    `activeProject=${lock.activeProject}`,
    `taxonomyNodes=${lock.taxonomy.nodeCount}`,
    `registryEntries=${lock.registry.entryCount}`,
    `bootstrapCommands=${lock.commandPack.entries.length}`,
    '',
    'AUTHORITATIVE BUILD PATH',
    ...lock.authoritativeBuildPath.flatMap((item) => [
      `- ${item.path}`,
      `  role=${item.role}`,
    ]),
  ].join('\n');
}

export function buildKernelFoundationLock(): PantavionKernelFoundationLock {
  const manifest = buildKernelBootstrapManifest();
  const taxonomy = getKernelTaxonomySnapshot();
  const registry = getCapabilityFamilyRegistrySnapshot();
  const commandPack = buildKernelBootstrapCommandPack();

  const lock: PantavionKernelFoundationLock = {
    generatedAt: nowIso(),
    status: 'locked-with-hardening-ahead',
    activeProject: 'pantavion-one-clean',
    authoritativeBuildPath: buildAuthoritativeBuildPath(),
    manifest,
    taxonomy,
    registry,
    commandPack,
    rendered: '',
  };

  lock.rendered = renderFoundationLock(lock);

  return lock;
}

export function renderKernelFoundationLock(): string {
  return buildKernelFoundationLock().rendered;
}

export default buildKernelFoundationLock;
