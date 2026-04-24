// core/kernel/kernel-taxonomy.ts

export type PantavionTaxonomyLayer =
  | 'foundation'
  | 'identity-trust-policy'
  | 'protocol-capability'
  | 'runtime'
  | 'surface'
  | 'admin-governance';

export type PantavionTaxonomyFamily =
  | 'kernel'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'workspace'
  | 'voice'
  | 'resilience'
  | 'registry'
  | 'admin'
  | 'memory'
  | 'unknown';

export type PantavionTaxonomyObjectKind =
  | 'kernel'
  | 'bootstrap'
  | 'smoke'
  | 'harness'
  | 'identity-model'
  | 'delegation-model'
  | 'protocol-types'
  | 'protocol-gateway'
  | 'runtime'
  | 'workspace-runtime'
  | 'voice-runtime'
  | 'resilience-runtime'
  | 'registry'
  | 'admission'
  | 'policy'
  | 'service'
  | 'surface'
  | 'unknown';

export interface PantavionTaxonomyMetadata {
  [key: string]: unknown;
}

export interface PantavionTaxonomyNode {
  nodeKey: string;
  title: string;
  layer: PantavionTaxonomyLayer;
  family: PantavionTaxonomyFamily;
  objectKind: PantavionTaxonomyObjectKind;
  canonicalPath: string;
  tags: string[];
  description: string;
  metadata: PantavionTaxonomyMetadata;
}

export interface PantavionTaxonomyClassificationInput {
  title: string;
  description?: string;
  targetPath?: string;
  targetModule?: string;
  tags?: string[];
  requestedCapabilities?: string[];
  metadata?: PantavionTaxonomyMetadata;
}

export interface PantavionTaxonomyClassification {
  recommendedLayer: PantavionTaxonomyLayer;
  recommendedFamily: PantavionTaxonomyFamily;
  recommendedObjectKind: PantavionTaxonomyObjectKind;
  canonicalPathHint?: string;
  matchedNodes: PantavionTaxonomyNode[];
  reasons: string[];
}

export interface PantavionKernelTaxonomySnapshot {
  generatedAt: string;
  nodeCount: number;
  families: PantavionTaxonomyFamily[];
  layers: PantavionTaxonomyLayer[];
  nodes: PantavionTaxonomyNode[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function searchText(parts: unknown[]): string {
  return parts
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
    .join(' ');
}

export class PantavionKernelTaxonomy {
  private readonly nodes = new Map<string, PantavionTaxonomyNode>();

  constructor() {
    this.seedFoundationNodes();
  }

  registerNode(input: PantavionTaxonomyNode): PantavionTaxonomyNode {
    const node: PantavionTaxonomyNode = {
      ...input,
      nodeKey: safeText(input.nodeKey),
      title: safeText(input.title, safeText(input.nodeKey)),
      canonicalPath: safeText(input.canonicalPath),
      description: safeText(input.description),
      tags: uniqStrings(input.tags ?? []),
      metadata: input.metadata ?? {},
    };

    this.nodes.set(node.nodeKey, node);
    return node;
  }

  getNode(nodeKey: string): PantavionTaxonomyNode | null {
    return this.nodes.get(nodeKey) ?? null;
  }

  listNodes(): PantavionTaxonomyNode[] {
    return [...this.nodes.values()].sort((a, b) =>
      a.canonicalPath.localeCompare(b.canonicalPath),
    );
  }

  classify(
    input: PantavionTaxonomyClassificationInput,
  ): PantavionTaxonomyClassification {
    const text = searchText([
      input.title,
      input.description,
      input.targetPath,
      input.targetModule,
      ...(input.tags ?? []),
      ...(input.requestedCapabilities ?? []),
    ]);

    const matchedNodes = this.listNodes().filter((node) => {
      const haystack = searchText([
        node.nodeKey,
        node.title,
        node.family,
        node.objectKind,
        node.canonicalPath,
        node.description,
        ...node.tags,
      ]);

      return (
        (safeText(input.targetPath) && node.canonicalPath === safeText(input.targetPath)) ||
        haystack.split(' ').some((token) => token.length > 3 && text.includes(token))
      );
    });

    const recommendedFamily = this.recommendFamily(text, safeText(input.targetPath));
    const recommendedLayer = this.layerForFamily(recommendedFamily);
    const recommendedObjectKind = this.recommendObjectKind(
      text,
      safeText(input.targetPath),
      safeText(input.targetModule),
    );

    const bestPathHint =
      matchedNodes[0]?.canonicalPath || this.defaultPathFor(recommendedObjectKind, recommendedFamily);

    const reasons = uniqStrings([
      `Recommended family resolved as ${recommendedFamily}.`,
      `Recommended layer resolved as ${recommendedLayer}.`,
      `Recommended object kind resolved as ${recommendedObjectKind}.`,
      ...(bestPathHint ? [`Canonical path hint: ${bestPathHint}.`] : []),
      ...(matchedNodes.length > 0
        ? [`Matched nodes: ${matchedNodes.map((node) => node.nodeKey).join(', ')}.`]
        : ['No exact taxonomy node match; using heuristic recommendation.']),
    ]);

    return {
      recommendedLayer,
      recommendedFamily,
      recommendedObjectKind,
      canonicalPathHint: bestPathHint || undefined,
      matchedNodes,
      reasons,
    };
  }

  getSnapshot(): PantavionKernelTaxonomySnapshot {
    const nodes = this.listNodes();

    return {
      generatedAt: nowIso(),
      nodeCount: nodes.length,
      families: uniqStrings(nodes.map((node) => node.family)) as PantavionTaxonomyFamily[],
      layers: uniqStrings(nodes.map((node) => node.layer)) as PantavionTaxonomyLayer[],
      nodes,
    };
  }

  private recommendFamily(
    text: string,
    targetPath: string,
  ): PantavionTaxonomyFamily {
    const path = targetPath.toLowerCase();

    if (path.includes('core/kernel') || text.includes('kernel')) return 'kernel';
    if (path.includes('core/identity') || text.includes('identity') || text.includes('delegation')) {
      return 'identity';
    }
    if (path.includes('core/protocol') || text.includes('protocol') || text.includes('gateway')) {
      return 'protocol';
    }
    if (path.includes('workspace') || text.includes('workspace')) return 'workspace';
    if (path.includes('voice') || text.includes('voice') || text.includes('interpreter')) {
      return 'voice';
    }
    if (path.includes('resilience') || text.includes('resilien') || text.includes('fallback')) {
      return 'resilience';
    }
    if (path.includes('runtime') || text.includes('runtime') || text.includes('durable')) {
      return 'runtime';
    }
    if (path.includes('registry') || text.includes('registry')) return 'registry';
    if (text.includes('admin') || text.includes('ops')) return 'admin';
    if (text.includes('memory') || text.includes('continuity')) return 'memory';
    return 'unknown';
  }

  private recommendObjectKind(
    text: string,
    targetPath: string,
    targetModule: string,
  ): PantavionTaxonomyObjectKind {
    const path = targetPath.toLowerCase();
    const moduleName = targetModule.toLowerCase();

    if (path.endsWith('kernel.ts')) return 'kernel';
    if (path.endsWith('kernel-bootstrap.ts')) return 'bootstrap';
    if (path.endsWith('kernel-foundation-smoke.ts')) return 'smoke';
    if (path.endsWith('kernel-usage-harness.ts')) return 'harness';
    if (path.endsWith('kernel-admission.ts')) return 'admission';
    if (path.endsWith('kernel-admission-policy.ts')) return 'policy';
    if (path.endsWith('identity-model.ts')) return 'identity-model';
    if (path.endsWith('delegation-model.ts')) return 'delegation-model';
    if (path.endsWith('protocol-types.ts')) return 'protocol-types';
    if (path.endsWith('protocol-gateway.ts')) return 'protocol-gateway';
    if (path.endsWith('workspace-runtime.ts')) return 'workspace-runtime';
    if (path.endsWith('voice-runtime.ts')) return 'voice-runtime';
    if (path.endsWith('resilience-runtime.ts')) return 'resilience-runtime';
    if (path.includes('runtime')) return 'runtime';
    if (path.includes('registry') || moduleName.includes('registry')) return 'registry';
    if (text.includes('bootstrap')) return 'bootstrap';
    if (text.includes('smoke')) return 'smoke';
    if (text.includes('harness')) return 'harness';
    if (text.includes('policy')) return 'policy';
    if (text.includes('service')) return 'service';
    return 'unknown';
  }

  private layerForFamily(family: PantavionTaxonomyFamily): PantavionTaxonomyLayer {
    switch (family) {
      case 'kernel':
      case 'registry':
        return 'foundation';
      case 'identity':
      case 'memory':
        return 'identity-trust-policy';
      case 'protocol':
        return 'protocol-capability';
      case 'runtime':
      case 'workspace':
      case 'voice':
      case 'resilience':
        return 'runtime';
      case 'admin':
        return 'admin-governance';
      default:
        return 'foundation';
    }
  }

  private defaultPathFor(
    objectKind: PantavionTaxonomyObjectKind,
    family: PantavionTaxonomyFamily,
  ): string {
    switch (objectKind) {
      case 'kernel':
        return 'core/kernel/kernel.ts';
      case 'bootstrap':
        return 'core/kernel/kernel-bootstrap.ts';
      case 'smoke':
        return 'core/kernel/kernel-foundation-smoke.ts';
      case 'harness':
        return 'core/kernel/kernel-usage-harness.ts';
      case 'admission':
        return 'core/kernel/kernel-admission.ts';
      case 'policy':
        return 'core/kernel/kernel-admission-policy.ts';
      case 'identity-model':
        return 'core/identity/identity-model.ts';
      case 'delegation-model':
        return 'core/identity/delegation-model.ts';
      case 'protocol-types':
        return 'core/protocol/protocol-types.ts';
      case 'protocol-gateway':
        return 'core/protocol/protocol-gateway.ts';
      case 'workspace-runtime':
        return 'core/runtime/workspace-runtime.ts';
      case 'voice-runtime':
        return 'core/runtime/voice-runtime.ts';
      case 'resilience-runtime':
        return 'core/runtime/resilience-runtime.ts';
      case 'runtime':
        return 'core/runtime/durable-execution.ts';
      case 'registry':
        return 'core/registry/capability-family-registry.ts';
      default:
        switch (family) {
          case 'identity':
            return 'core/identity/identity-model.ts';
          case 'protocol':
            return 'core/protocol/protocol-gateway.ts';
          case 'workspace':
            return 'core/runtime/workspace-runtime.ts';
          case 'voice':
            return 'core/runtime/voice-runtime.ts';
          case 'resilience':
            return 'core/runtime/resilience-runtime.ts';
          case 'runtime':
            return 'core/runtime/durable-execution.ts';
          case 'registry':
            return 'core/registry/capability-family-registry.ts';
          default:
            return 'core/kernel/kernel.ts';
        }
    }
  }

  private seedFoundationNodes(): void {
    const nodes: PantavionTaxonomyNode[] = [
      {
        nodeKey: 'kernel.root',
        title: 'Kernel Root',
        layer: 'foundation',
        family: 'kernel',
        objectKind: 'kernel',
        canonicalPath: 'core/kernel/kernel.ts',
        tags: ['kernel', 'coordinator', 'intake'],
        description: 'Kernel 0 coordinator and canonical governor.',
        metadata: {},
      },
      {
        nodeKey: 'kernel.bootstrap',
        title: 'Kernel Bootstrap',
        layer: 'foundation',
        family: 'kernel',
        objectKind: 'bootstrap',
        canonicalPath: 'core/kernel/kernel-bootstrap.ts',
        tags: ['bootstrap', 'foundation', 'integration'],
        description: 'Foundation bootstrap and canonical system lift.',
        metadata: {},
      },
      {
        nodeKey: 'identity.model',
        title: 'Identity Model',
        layer: 'identity-trust-policy',
        family: 'identity',
        objectKind: 'identity-model',
        canonicalPath: 'core/identity/identity-model.ts',
        tags: ['identity', 'trust', 'scope'],
        description: 'Identity posture, scopes and entitlements.',
        metadata: {},
      },
      {
        nodeKey: 'identity.delegation',
        title: 'Delegation Model',
        layer: 'identity-trust-policy',
        family: 'identity',
        objectKind: 'delegation-model',
        canonicalPath: 'core/identity/delegation-model.ts',
        tags: ['delegation', 'authority', 'approval'],
        description: 'Delegated authority and approval-aware scope transfer.',
        metadata: {},
      },
      {
        nodeKey: 'protocol.types',
        title: 'Protocol Types',
        layer: 'protocol-capability',
        family: 'protocol',
        objectKind: 'protocol-types',
        canonicalPath: 'core/protocol/protocol-types.ts',
        tags: ['protocol', 'contracts', 'envelopes'],
        description: 'Canonical protocol contracts and dispatch shapes.',
        metadata: {},
      },
      {
        nodeKey: 'protocol.gateway',
        title: 'Protocol Gateway',
        layer: 'protocol-capability',
        family: 'protocol',
        objectKind: 'protocol-gateway',
        canonicalPath: 'core/protocol/protocol-gateway.ts',
        tags: ['gateway', 'dispatch', 'adapters'],
        description: 'Governed protocol routing and adapter dispatch.',
        metadata: {},
      },
      {
        nodeKey: 'runtime.durable',
        title: 'Durable Execution',
        layer: 'runtime',
        family: 'runtime',
        objectKind: 'runtime',
        canonicalPath: 'core/runtime/durable-execution.ts',
        tags: ['durable', 'execution', 'retry'],
        description: 'Durable step execution with retries and approval pauses.',
        metadata: {},
      },
      {
        nodeKey: 'runtime.workspace',
        title: 'Workspace Runtime',
        layer: 'runtime',
        family: 'workspace',
        objectKind: 'workspace-runtime',
        canonicalPath: 'core/runtime/workspace-runtime.ts',
        tags: ['workspace', 'task', 'session'],
        description: 'Workspace tasks, sessions and governed execution.',
        metadata: {},
      },
      {
        nodeKey: 'runtime.voice',
        title: 'Voice Runtime',
        layer: 'runtime',
        family: 'voice',
        objectKind: 'voice-runtime',
        canonicalPath: 'core/runtime/voice-runtime.ts',
        tags: ['voice', 'turn', 'interpreter'],
        description: 'Voice session processing and interpreter path.',
        metadata: {},
      },
      {
        nodeKey: 'runtime.resilience',
        title: 'Resilience Runtime',
        layer: 'runtime',
        family: 'resilience',
        objectKind: 'resilience-runtime',
        canonicalPath: 'core/runtime/resilience-runtime.ts',
        tags: ['resilience', 'fallback', 'continuity'],
        description: 'Fallback planning and degraded continuity control.',
        metadata: {},
      },
      {
        nodeKey: 'registry.capability-family',
        title: 'Capability Family Registry',
        layer: 'foundation',
        family: 'registry',
        objectKind: 'registry',
        canonicalPath: 'core/registry/capability-family-registry.ts',
        tags: ['registry', 'family', 'admission'],
        description: 'Family-level capability registry and candidate evaluation.',
        metadata: {},
      },
      {
        nodeKey: 'kernel.admission',
        title: 'Kernel Admission',
        layer: 'admin-governance',
        family: 'kernel',
        objectKind: 'admission',
        canonicalPath: 'core/kernel/kernel-admission.ts',
        tags: ['admission', 'review', 'governance'],
        description: 'Admission evaluation for new candidates into canonical system.',
        metadata: {},
      },
    ];

    for (const node of nodes) {
      this.registerNode(node);
    }
  }
}

export function createKernelTaxonomy(): PantavionKernelTaxonomy {
  return new PantavionKernelTaxonomy();
}

export const kernelTaxonomy = createKernelTaxonomy();

export function classifyTaxonomyCandidate(
  input: PantavionTaxonomyClassificationInput,
): PantavionTaxonomyClassification {
  return kernelTaxonomy.classify(input);
}

export function getKernelTaxonomySnapshot(): PantavionKernelTaxonomySnapshot {
  return kernelTaxonomy.getSnapshot();
}
