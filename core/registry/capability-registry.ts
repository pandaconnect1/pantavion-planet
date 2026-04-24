type UnknownRecord = Record<string, unknown>;

const BUILT_IN_CAPABILITIES = new Set<string>([
  'intake-normalization',
  'canonical-classification',
  'canonical-placement',
  'truth-zone-resolution',
  'capability-lookup',
  'policy-evaluation',
  'gap-detection',
  'build-recommendation',
  'admin-alert-generation',
  'decision-persistence',
  'explainability',
  'identity-resolution',
  'delegation-awareness',
  'protocol-routing',
  'adapter-resolution',
  'scope-enforcement',
  'risk-evaluation',
  'admin-visibility',
  'ops-alerting',
  'runtime-coordination',
  'resilience-awareness',
  'workspace-runtime-awareness',
  'voice-runtime-awareness',
  'memory-awareness',
  'high-stakes-routing',
  'crisis-governance',
  'governed-routing',
  'automation-orchestration',
  'verified-research',
  'enhanced-review-awareness',
  'approval-path-awareness',
  'high-stakes-guardrails',
  'restricted-flow-awareness',
  'admin-only-gating',
]);

function guessRuntimeFamily(key: string): string | undefined {
  if (key.includes('runtime') || key.includes('voice') || key.includes('workspace')) {
    return 'runtime-core';
  }
  if (key.includes('protocol') || key.includes('adapter')) {
    return 'protocol-core';
  }
  if (key.includes('identity') || key.includes('delegation')) {
    return 'identity-core';
  }
  if (key.includes('policy') || key.includes('risk') || key.includes('scope')) {
    return 'security-core';
  }
  return 'kernel-core';
}

function guessProtocolFamily(key: string): string | undefined {
  if (key.includes('protocol') || key.includes('adapter')) {
    return 'canonical-protocol';
  }
  if (key.includes('routing')) {
    return 'kernel-routing';
  }
  return undefined;
}

export async function matchCapabilities(query: UnknownRecord): Promise<UnknownRecord[]> {
  const requested = Array.isArray(query.requestedCapabilities)
    ? query.requestedCapabilities.map((item) => String(item))
    : [];

  return requested.map((key) => {
    const available = BUILT_IN_CAPABILITIES.has(key);

    return {
      key,
      status: available ? 'available' : 'missing',
      source: 'registry',
      owner: 'capability-registry',
      score: available ? 0.95 : 0.2,
      rationale: [
        available
          ? 'Capability is registered in the foundation registry.'
          : 'Capability is not yet registered in the current foundation registry.',
      ],
      runtimeFamily: guessRuntimeFamily(key),
      protocolFamily: guessProtocolFamily(key),
    };
  });
}

export async function findCapabilities(query: UnknownRecord): Promise<UnknownRecord[]> {
  return matchCapabilities(query);
}
