// core/kernel/kernel-bootstrap-manifest.ts

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

export type PantavionBootstrapManifestSectionKey =
  | 'foundation-core'
  | 'governance-and-admission'
  | 'runtime-and-protocol'
  | 'execution-and-export';

export interface PantavionBootstrapManifestEntry {
  key: string;
  title: string;
  path: string;
  role: string;
}

export interface PantavionBootstrapManifestSection {
  sectionKey: PantavionBootstrapManifestSectionKey;
  title: string;
  description: string;
  entries: PantavionBootstrapManifestEntry[];
}

export interface PantavionKernelBootstrapManifest {
  generatedAt: string;
  taxonomyNodeCount: number;
  capabilityRegistryEntryCount: number;
  bootstrapCommandCount: number;
  sections: PantavionBootstrapManifestSection[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderManifest(
  input: {
    sections: PantavionBootstrapManifestSection[];
    taxonomy: PantavionKernelTaxonomySnapshot;
    registry: PantavionCapabilityRegistrySnapshot;
    commandPack: PantavionKernelBootstrapCommandPack;
  },
): string {
  return [
    'PANTAVION KERNEL BOOTSTRAP MANIFEST',
    `generatedAt=${nowIso()}`,
    `taxonomyNodeCount=${input.taxonomy.nodeCount}`,
    `capabilityRegistryEntryCount=${input.registry.entryCount}`,
    `bootstrapCommandCount=${input.commandPack.entries.length}`,
    ...input.sections.flatMap((section) => [
      '',
      section.title.toUpperCase(),
      section.description,
      ...section.entries.flatMap((entry) => [
        `- ${entry.title}`,
        `  key=${entry.key}`,
        `  path=${entry.path}`,
        `  role=${entry.role}`,
      ]),
    ]),
  ].join('\n');
}

export function buildKernelBootstrapManifest(): PantavionKernelBootstrapManifest {
  const taxonomy = getKernelTaxonomySnapshot();
  const registry = getCapabilityFamilyRegistrySnapshot();
  const commandPack = buildKernelBootstrapCommandPack();

  const sections: PantavionBootstrapManifestSection[] = [
    {
      sectionKey: 'foundation-core',
      title: 'Foundation Core',
      description:
        'Τα κεντρικά canonical foundation files του Kernel 0 και των identity/protocol primitives.',
      entries: [
        {
          key: 'kernel.root',
          title: 'Kernel Root',
          path: 'core/kernel/kernel.ts',
          role: 'Canonical intake, placement, gap detection and recommendation.',
        },
        {
          key: 'kernel.bootstrap',
          title: 'Kernel Bootstrap',
          path: 'core/kernel/kernel-bootstrap.ts',
          role: 'Foundation lift and initial system wiring.',
        },
        {
          key: 'identity.model',
          title: 'Identity Model',
          path: 'core/identity/identity-model.ts',
          role: 'Identity posture, scopes, trust and approvals.',
        },
        {
          key: 'identity.delegation',
          title: 'Delegation Model',
          path: 'core/identity/delegation-model.ts',
          role: 'Delegated authority and bounded execution rights.',
        },
        {
          key: 'protocol.gateway',
          title: 'Protocol Gateway',
          path: 'core/protocol/protocol-gateway.ts',
          role: 'Governed adapter routing and protocol dispatch.',
        },
      ],
    },
    {
      sectionKey: 'governance-and-admission',
      title: 'Governance and Admission',
      description:
        'Τα files που κλειδώνουν taxonomy, admission, policy και οικογένειες capabilities.',
      entries: [
        {
          key: 'registry.capability-family',
          title: 'Capability Family Registry',
          path: 'core/registry/capability-family-registry.ts',
          role: 'Canonical family admission and candidate evaluation.',
        },
        {
          key: 'kernel.taxonomy',
          title: 'Kernel Taxonomy',
          path: 'core/kernel/kernel-taxonomy.ts',
          role: 'Canonical taxonomy layer/family/object-kind mapping.',
        },
        {
          key: 'kernel.admission',
          title: 'Kernel Admission',
          path: 'core/kernel/kernel-admission.ts',
          role: 'Admit/review/defer/reject logic for new kernel candidates.',
        },
        {
          key: 'kernel.admission-policy',
          title: 'Kernel Admission Policy',
          path: 'core/kernel/kernel-admission-policy.ts',
          role: 'Banding, controls and guarded admission path.',
        },
      ],
    },
    {
      sectionKey: 'runtime-and-protocol',
      title: 'Runtime and Protocol',
      description:
        'Τα canonical runtime layers που δίνουν durable/workspace/voice/resilience execution.',
      entries: [
        {
          key: 'runtime.durable',
          title: 'Durable Execution Runtime',
          path: 'core/runtime/durable-execution.ts',
          role: 'Step-based resilient execution and retry handling.',
        },
        {
          key: 'runtime.workspace',
          title: 'Workspace Runtime',
          path: 'core/runtime/workspace-runtime.ts',
          role: 'Workspace tasks, sessions and governed task execution.',
        },
        {
          key: 'runtime.voice',
          title: 'Voice Runtime',
          path: 'core/runtime/voice-runtime.ts',
          role: 'Voice sessions, interpreter turns and multimodal flow.',
        },
        {
          key: 'runtime.resilience',
          title: 'Resilience Runtime',
          path: 'core/runtime/resilience-runtime.ts',
          role: 'Fallback planning and degraded continuity control.',
        },
      ],
    },
    {
      sectionKey: 'execution-and-export',
      title: 'Execution and Export',
      description:
        'Τα terminal/control/export layers που κάνουν το foundation πρακτικά runnable και exportable.',
      entries: [
        {
          key: 'kernel.control-plane',
          title: 'Kernel Control Plane',
          path: 'core/kernel/kernel-control-plane.ts',
          role: 'Operational orchestration over boot/smoke/integration/usage/resilience.',
        },
        {
          key: 'kernel.real-runner',
          title: 'Kernel Real Runner',
          path: 'core/kernel/kernel-real-runner.ts',
          role: 'Renderable real runner path for terminal execution.',
        },
        {
          key: 'kernel.entrypoint',
          title: 'Kernel Entrypoint',
          path: 'core/kernel/kernel-entrypoint.ts',
          role: 'Entrypoint pack with artifact, terminal and rendered output.',
        },
        {
          key: 'kernel.command-surface',
          title: 'Kernel Command Surface',
          path: 'core/kernel/kernel-command-surface.ts',
          role: 'Unified command execution surface.',
        },
        {
          key: 'kernel.saved-export',
          title: 'Kernel Saved Export',
          path: 'core/kernel/kernel-saved-export.ts',
          role: 'Saved JSON/summary/combined text export generation.',
        },
      ],
    },
  ];

  return {
    generatedAt: nowIso(),
    taxonomyNodeCount: taxonomy.nodeCount,
    capabilityRegistryEntryCount: registry.entryCount,
    bootstrapCommandCount: commandPack.entries.length,
    sections,
    rendered: renderManifest({
      sections,
      taxonomy,
      registry,
      commandPack,
    }),
  };
}

export function renderKernelBootstrapManifest(): string {
  return buildKernelBootstrapManifest().rendered;
}

export default buildKernelBootstrapManifest;
