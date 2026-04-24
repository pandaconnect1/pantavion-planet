// core/protocol/provider-fallback-policy.ts

import {
  getProviderAdapter,
  listProviderAdapters,
  type PantavionProviderAdapterRecord,
} from './provider-adapter-registry';

import {
  getProviderHealth,
  type PantavionProviderHealthRecord,
} from './provider-health-registry';

export type PantavionProviderFallbackDisposition =
  | 'routable'
  | 'degraded'
  | 'blocked';

export interface PantavionProviderFallbackHop {
  rank: number;
  adapterKey: string;
  family: string;
  healthStatus: string;
  availability: string;
  score: number;
  reason: string;
}

export interface PantavionProviderFallbackPlan {
  generatedAt: string;
  capabilityKey: string;
  operationKey?: string;
  preferredAdapterKey?: string;
  disposition: PantavionProviderFallbackDisposition;
  primaryAdapterKey?: string;
  hops: PantavionProviderFallbackHop[];
  notes: string[];
}

export interface PantavionProviderFallbackPlanInput {
  capabilityKey: string;
  operationKey?: string;
  preferredAdapterKey?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildReason(input: {
  adapter: PantavionProviderAdapterRecord;
  health?: PantavionProviderHealthRecord | null;
  preferred: boolean;
}): string {
  const parts = [
    `availability=${input.adapter.availability}`,
    `health=${input.health?.status ?? 'unknown'}`,
    input.preferred ? 'preferred=true' : 'preferred=false',
  ];

  return parts.join(', ');
}

function computeScore(input: {
  adapter: PantavionProviderAdapterRecord;
  health?: PantavionProviderHealthRecord | null;
  preferred: boolean;
}): number {
  let score = 0;

  if (input.preferred) score += 40;

  switch (input.adapter.availability) {
    case 'ready':
      score += 40;
      break;
    case 'maintenance':
      score += 20;
      break;
    case 'degraded':
      score += 12;
      break;
    case 'offline':
      score += 0;
      break;
    case 'retired':
      score -= 100;
      break;
  }

  switch (input.health?.status) {
    case 'healthy':
      score += 30;
      break;
    case 'watch':
      score += 18;
      break;
    case 'degraded':
      score += 6;
      break;
    case 'offline':
      score -= 30;
      break;
    default:
      score += 5;
      break;
  }

  score += Math.round((input.health?.successRate ?? 0.8) * 10);

  return score;
}

export function buildProviderFallbackPlan(
  input: PantavionProviderFallbackPlanInput,
): PantavionProviderFallbackPlan {
  const candidates = listProviderAdapters()
    .filter((adapter) => adapter.availability !== 'retired')
    .filter((adapter) => adapter.supportedCapabilities.includes(input.capabilityKey))
    .filter((adapter) =>
      input.operationKey
        ? adapter.supportedOperations.includes(input.operationKey)
        : true,
    )
    .map((adapter) => {
      const health = getProviderHealth(adapter.adapterKey);
      const preferred = adapter.adapterKey === input.preferredAdapterKey;

      return {
        adapter,
        health,
        preferred,
        score: computeScore({
          adapter,
          health,
          preferred,
        }),
      };
    })
    .sort((left, right) => right.score - left.score);

  if (candidates.length === 0) {
    return {
      generatedAt: nowIso(),
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      preferredAdapterKey: input.preferredAdapterKey,
      disposition: 'blocked',
      primaryAdapterKey: undefined,
      hops: [],
      notes: ['No provider adapter matches the requested capability/operation.'],
    };
  }

  const hops: PantavionProviderFallbackHop[] = candidates.map((candidate, index) => ({
    rank: index + 1,
    adapterKey: candidate.adapter.adapterKey,
    family: candidate.adapter.family,
    healthStatus: candidate.health?.status ?? 'unknown',
    availability: candidate.adapter.availability,
    score: candidate.score,
    reason: buildReason({
      adapter: candidate.adapter,
      health: candidate.health,
      preferred: candidate.preferred,
    }),
  }));

  const primary = candidates[0];
  const disposition: PantavionProviderFallbackDisposition =
    primary.adapter.availability === 'ready' &&
    (primary.health?.status === 'healthy' || primary.health?.status === 'watch')
      ? 'routable'
      : primary.adapter.availability === 'offline'
        ? 'blocked'
        : 'degraded';

  return {
    generatedAt: nowIso(),
    capabilityKey: input.capabilityKey,
    operationKey: input.operationKey,
    preferredAdapterKey: input.preferredAdapterKey,
    disposition,
    primaryAdapterKey: primary.adapter.adapterKey,
    hops,
    notes: uniqStrings([
      `primary=${primary.adapter.adapterKey}`,
      `disposition=${disposition}`,
      ...(input.preferredAdapterKey ? [`preferred=${input.preferredAdapterKey}`] : []),
    ]),
  };
}

export function renderProviderFallbackPlan(
  plan: PantavionProviderFallbackPlan,
): string {
  return [
    'PANTAVION PROVIDER FALLBACK PLAN',
    `generatedAt=${plan.generatedAt}`,
    `capability=${plan.capabilityKey}`,
    `operation=${plan.operationKey ?? ''}`,
    `preferred=${plan.preferredAdapterKey ?? ''}`,
    `disposition=${plan.disposition}`,
    `primary=${plan.primaryAdapterKey ?? ''}`,
    ...plan.hops.flatMap((hop) => [
      `- rank=${hop.rank} adapter=${hop.adapterKey} score=${hop.score}`,
      `  family=${hop.family} availability=${hop.availability} health=${hop.healthStatus}`,
      `  reason=${hop.reason}`,
    ]),
  ].join('\n');
}

export function getPreferredProviderAdapter(
  adapterKey?: string,
): PantavionProviderAdapterRecord | null {
  return adapterKey ? getProviderAdapter(adapterKey) : null;
}

export default buildProviderFallbackPlan;
