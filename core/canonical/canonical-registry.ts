type UnknownRecord = Record<string, unknown>;

const decisionStore: unknown[] = [];

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function categoryToFamily(category: string): string {
  switch (category) {
    case 'kernel':
      return 'foundation';
    case 'identity':
      return 'identity';
    case 'protocol':
      return 'protocol';
    case 'security':
      return 'security';
    case 'admin':
      return 'operations';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime';
    case 'memory':
      return 'memory';
    case 'business':
      return 'commercial';
    case 'crisis':
      return 'crisis';
    case 'utility':
      return 'geospatial';
    case 'learning':
      return 'learning';
    case 'people':
    case 'social':
      return 'human-core';
    default:
      return 'canonical';
  }
}

function categoryToProductFamily(category: string): string {
  switch (category) {
    case 'people':
    case 'social':
    case 'voice':
      return 'human-core';
    case 'memory':
    case 'knowledge':
    case 'learning':
      return 'guidance-knowledge-cognition';
    case 'utility':
      return 'discovery-place-infrastructure';
    case 'crisis':
      return 'crisis-humanitarian-safety';
    case 'business':
      return 'professional-commercial';
    case 'workspace':
    case 'runtime':
      return 'universal-workspaces';
    default:
      return 'shared-core-governance';
  }
}

function categoryToPath(category: string): string {
  switch (category) {
    case 'kernel':
      return 'core/kernel/kernel.ts';
    case 'identity':
      return 'core/identity/identity-model.ts';
    case 'protocol':
      return 'core/protocol/protocol-gateway.ts';
    case 'security':
      return 'core/security/security-policy.ts';
    case 'admin':
      return 'core/admin/admin-alerts.ts';
    case 'runtime':
      return 'core/runtime/durable-execution.ts';
    case 'workspace':
      return 'core/runtime/workspace-runtime.ts';
    case 'voice':
      return 'core/runtime/voice-runtime.ts';
    default:
      return 'types/pantavion.ts';
  }
}

function categoryToModule(category: string): string {
  switch (category) {
    case 'kernel':
      return 'kernel';
    case 'identity':
      return 'identity';
    case 'protocol':
      return 'protocol';
    case 'security':
      return 'security';
    case 'admin':
      return 'admin';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime';
    case 'memory':
      return 'memory';
    case 'business':
      return 'business';
    case 'crisis':
      return 'crisis';
    case 'utility':
      return 'utility';
    case 'people':
      return 'people';
    case 'social':
      return 'social';
    case 'learning':
      return 'learning';
    default:
      return 'canonical';
  }
}

function categoryToOwner(category: string): string {
  switch (category) {
    case 'kernel':
      return 'kernel-governor';
    case 'identity':
      return 'identity-governor';
    case 'protocol':
      return 'protocol-governor';
    case 'security':
      return 'security-governor';
    case 'admin':
      return 'ops-governor';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime-governor';
    case 'business':
      return 'commercial-governor';
    case 'crisis':
      return 'safety-governor';
    case 'utility':
      return 'infrastructure-governor';
    case 'memory':
      return 'continuity-governor';
    default:
      return 'canonical-governor';
  }
}

function categoryToCanonicalKey(category: string): string {
  switch (category) {
    case 'kernel':
      return 'kernel.0.coordinator.v1';
    case 'identity':
      return 'identity.foundation.v1';
    case 'protocol':
      return 'protocol.gateway.v1';
    case 'security':
      return 'security.policy.v1';
    case 'admin':
      return 'admin.alerting.v1';
    case 'runtime':
      return 'runtime.durable-execution.v1';
    case 'workspace':
      return 'runtime.workspace.v1';
    case 'voice':
      return 'runtime.voice.v1';
    case 'memory':
      return 'memory.continuity.v1';
    case 'learning':
      return 'learning.mastery.v1';
    case 'business':
      return 'business.operations.v1';
    case 'crisis':
      return 'crisis.sos.v1';
    case 'utility':
      return 'geospatial.utility.v1';
    case 'people':
      return 'people.graph.v1';
    case 'social':
      return 'social.community.v1';
    case 'knowledge':
      return 'knowledge.verified.v1';
    default:
      return 'canonical.unresolved.v1';
  }
}

export async function resolvePlacement(context: UnknownRecord): Promise<UnknownRecord> {
  const request = (context.request as UnknownRecord | undefined) ?? {};
  const classification = (context.classification as UnknownRecord | undefined) ?? {};
  const category = safeText(classification.category, 'unknown');

  const explicitTargetPath = safeText(request.targetPath);
  const explicitTargetModule = safeText(request.targetModule);

  return {
    zone: category,
    family: categoryToFamily(category),
    productFamily: categoryToProductFamily(category),
    canonicalKey: categoryToCanonicalKey(category),
    targetPath: explicitTargetPath || categoryToPath(category),
    targetModule: explicitTargetModule || categoryToModule(category),
    owner: categoryToOwner(category),
    confidence: explicitTargetPath || explicitTargetModule ? 0.92 : 0.84,
    rationale: [
      explicitTargetPath || explicitTargetModule
        ? 'Placement derived from explicit request target.'
        : 'Placement derived from canonical category mapping.',
    ],
    isFallback: !(explicitTargetPath || explicitTargetModule),
  };
}

export async function recordDecision(decision: unknown): Promise<void> {
  decisionStore.push(decision);
}

export function getDecisionStore(): unknown[] {
  return [...decisionStore];
}
