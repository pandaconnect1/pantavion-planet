import type { PantavionDomain } from '../../types/pantavion';

export type CanonicalZone = 'foundation' | 'registry' | 'runtime' | 'control-plane' | 'governance' | 'surface';

export interface CanonicalPlacement {
  domain: PantavionDomain;
  zone: CanonicalZone;
  targetPath: string;
  entityType: 'type' | 'registry' | 'policy' | 'runtime' | 'alert' | 'research';
  reasons: string[];
  grounded: boolean;
}

export interface CanonicalRegistryContract {
  resolvePlacement(domain: PantavionDomain): CanonicalPlacement;
  listPlacements(): CanonicalPlacement[];
}

const CANONICAL_PLACEMENTS: Record<PantavionDomain, Omit<CanonicalPlacement, 'domain'>> = {
  kernel:      { zone: 'foundation',    targetPath: 'core/kernel/kernel.ts',                entityType: 'runtime',  reasons: ['kernel-foundation'], grounded: true },
  canonical:   { zone: 'registry',      targetPath: 'core/canonical/canonical-registry.ts', entityType: 'registry', reasons: ['canonical-registry'], grounded: true },
  capability:  { zone: 'registry',      targetPath: 'core/registry/capability-registry.ts', entityType: 'registry', reasons: ['capability-registry'], grounded: true },
  security:    { zone: 'governance',    targetPath: 'core/security/security-policy.ts',      entityType: 'policy',   reasons: ['security-governance'], grounded: true },
  admin:       { zone: 'control-plane', targetPath: 'core/admin/admin-alerts.ts',           entityType: 'alert',    reasons: ['admin-alerting'], grounded: true },
  identity:    { zone: 'foundation',    targetPath: 'core/identity/identity-model.ts',      entityType: 'type',     reasons: ['identity-foundation'], grounded: true },
  protocol:    { zone: 'foundation',    targetPath: 'core/protocol/protocol-gateway.ts',    entityType: 'runtime',  reasons: ['protocol-foundation'], grounded: true },
  runtime:     { zone: 'runtime',       targetPath: 'core/runtime/durable-execution.ts',    entityType: 'runtime',  reasons: ['durable-runtime'], grounded: true },
  workspace:   { zone: 'runtime',       targetPath: 'core/runtime/workspace-runtime.ts',    entityType: 'runtime',  reasons: ['workspace-runtime'], grounded: true },
  voice:       { zone: 'runtime',       targetPath: 'core/runtime/voice-runtime.ts',        entityType: 'runtime',  reasons: ['voice-runtime'], grounded: true },
  memory:      { zone: 'foundation',    targetPath: 'core/kernel/kernel.ts',                entityType: 'runtime',  reasons: ['memory-awaits-dedicated-layer'], grounded: false },
  research:    { zone: 'surface',       targetPath: 'core/kernel/kernel.ts',                entityType: 'research', reasons: ['research-routed-via-kernel'], grounded: false },
  build:       { zone: 'control-plane', targetPath: 'core/kernel/kernel.ts',                entityType: 'runtime',  reasons: ['build-routed-via-kernel'], grounded: false },
  general:     { zone: 'surface',       targetPath: 'core/kernel/kernel.ts',                entityType: 'runtime',  reasons: ['general-routed-via-kernel'], grounded: false },
};

export const canonicalRegistry: CanonicalRegistryContract = {
  resolvePlacement(domain) {
    const placement = CANONICAL_PLACEMENTS[domain] ?? CANONICAL_PLACEMENTS.general;
    return { domain, ...placement };
  },
  listPlacements() {
    return (Object.keys(CANONICAL_PLACEMENTS) as PantavionDomain[]).map((domain) => this.resolvePlacement(domain));
  },
};

export function resolvePlacement(domain: PantavionDomain): CanonicalPlacement {
  return canonicalRegistry.resolvePlacement(domain);
}