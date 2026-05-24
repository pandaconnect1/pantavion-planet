import type { PantavionDomain, PantavionScope } from '../../types/pantavion';

export type CapabilityHealth = 'ok' | 'degraded' | 'down' | 'unknown';
export type CapabilityMaturity = 'incubating' | 'experimental' | 'production' | 'critical';
export type CapabilityExecutionMode = 'sync' | 'async' | 'durable' | 'human-approval';

export interface CapabilityDefinition {
  id: string;
  name: string;
  domain: PantavionDomain;
  description: string;
  keywords: string[];
  maturity: CapabilityMaturity;
  health: CapabilityHealth;
  executionMode: CapabilityExecutionMode;
  requiredScopes: PantavionScope[];
  source: string;
}

export interface CapabilityMatch {
  capability: CapabilityDefinition;
  score: number;
  reasons: string[];
  allowed: boolean;
  denialReasons: string[];
}

export interface CapabilityRegistryContract {
  listCapabilities(): CapabilityDefinition[];
  matchCapabilities(input: {
    domain: PantavionDomain;
    content: string;
    actorScopes: PantavionScope[];
  }): CapabilityMatch[];
}

const CAPABILITIES: CapabilityDefinition[] = [
  {
    id: 'canonical.resolve',
    name: 'Canonical Resolver',
    domain: 'canonical',
    description: 'Resolve canonical placement and structural mapping.',
    keywords: ['canonical', 'placement', 'registry', 'map'],
    maturity: 'critical',
    health: 'ok',
    executionMode: 'sync',
    requiredScopes: ['read'],
    source: 'core/canonical/canonical-registry.ts',
  },
  {
    id: 'capability.resolve',
    name: 'Capability Resolver',
    domain: 'capability',
    description: 'Resolve capability matches and execution pathways.',
    keywords: ['capability', 'tool', 'route', 'match'],
    maturity: 'critical',
    health: 'ok',
    executionMode: 'sync',
    requiredScopes: ['read'],
    source: 'core/registry/capability-registry.ts',
  },
  {
    id: 'policy.evaluate',
    name: 'Policy Evaluator',
    domain: 'security',
    description: 'Evaluate legal, safety, identity, and sovereignty rules.',
    keywords: ['policy', 'security', 'safety', 'audit'],
    maturity: 'critical',
    health: 'ok',
    executionMode: 'sync',
    requiredScopes: ['policy', 'read'],
    source: 'core/security/security-policy.ts',
  },
  {
    id: 'admin.alert',
    name: 'Admin Alert Generator',
    domain: 'admin',
    description: 'Generate admin, ops, and readiness alerts.',
    keywords: ['admin', 'alert', 'ops', 'incident', 'forecast'],
    maturity: 'production',
    health: 'ok',
    executionMode: 'async',
    requiredScopes: ['ops', 'read'],
    source: 'core/admin/admin-alerts.ts',
  },
  {
    id: 'runtime.durable',
    name: 'Durable Execution',
    domain: 'runtime',
    description: 'Create and maintain durable execution records and checkpoints.',
    keywords: ['runtime', 'durable', 'checkpoint', 'retry', 'execution'],
    maturity: 'production',
    health: 'ok',
    executionMode: 'durable',
    requiredScopes: ['execute', 'read'],
    source: 'core/runtime/durable-execution.ts',
  },
  {
    id: 'voice.runtime',
    name: 'Voice Runtime',
    domain: 'voice',
    description: 'Handle voice runtime requests and voice workflows.',
    keywords: ['voice', 'speech', 'tts', 'stt', 'translation'],
    maturity: 'production',
    health: 'ok',
    executionMode: 'async',
    requiredScopes: ['execute', 'read'],
    source: 'core/runtime/voice-runtime.ts',
  },
];

export const capabilityRegistry: CapabilityRegistryContract = {
  listCapabilities() {
    return CAPABILITIES;
  },

  matchCapabilities(input) {
    const text = input.content.toLowerCase();

    return CAPABILITIES
      .filter((capability) => capability.domain === input.domain || input.domain === 'general' || capability.domain === 'runtime')
      .map((capability) => {
        let score = capability.domain === input.domain ? 4 : 0;
        const reasons: string[] = capability.domain === input.domain ? ['domain-match'] : [];

        for (const keyword of capability.keywords) {
          if (text.includes(keyword)) {
            score += 2;
            reasons.push(`keyword:${keyword}`);
          }
        }

        const missingScopes = capability.requiredScopes.filter((scope) => !input.actorScopes.includes(scope));
        const denialReasons = capability.health === 'down' ? ['capability-down'] : [];
        if (missingScopes.length) denialReasons.push(`missing-scopes:${missingScopes.join(',')}`);

        return {
          capability,
          score,
          reasons,
          allowed: denialReasons.length === 0,
          denialReasons,
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);
  },
};

export function matchCapabilities(input: {
  domain: PantavionDomain;
  content: string;
  actorScopes: PantavionScope[];
}): CapabilityMatch[] {
  return capabilityRegistry.matchCapabilities(input);
}