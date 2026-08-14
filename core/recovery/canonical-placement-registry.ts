// core/recovery/canonical-placement-registry.ts
// Canonical recovery placement control. Do not treat registry presence as VERIFIED_LIVE.

export type RecoveryState = 'COMPLETE' | 'PARTIAL' | 'SKELETON' | 'IDEA-SPEC' | 'DELETED-HISTORICAL';
export type RecoveryDecision = 'KEEP' | 'MERGE' | 'EVOLVE' | 'REBUILD' | 'ARCHIVE' | 'INVESTIGATE';
export type LiveState = 'SPEC_ONLY' | 'UI_ONLY' | 'BACKEND_PARTIAL' | 'BACKEND_LIVE' | 'CONNECTED' | 'TESTED' | 'DEPLOYED' | 'VERIFIED_LIVE';
export type PlacementState = 'IN_PLACE' | 'MERGE_PENDING' | 'MOVE_PENDING' | 'DONOR_ACCESS_BLOCKED' | 'ARCHIVED_REFERENCE';

export interface CanonicalPlacementRecord {
  key: string;
  domain: string;
  source: string;
  canonicalTarget: string;
  recoveryState: RecoveryState;
  decision: RecoveryDecision;
  liveState: LiveState;
  placementState: PlacementState;
  publicExposureSafe: boolean;
  blocker?: string;
  nextAction: string;
}

export const CANONICAL_PLACEMENT_REGISTRY: CanonicalPlacementRecord[] = [
  {
    key: 'kernel-foundation-lock', domain: 'kernel',
    source: 'core/kernel/kernel-foundation-lock.ts', canonicalTarget: 'core/kernel/kernel-foundation-lock.ts',
    recoveryState: 'COMPLETE', decision: 'KEEP', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Reconcile declared kernel maturity with actual runtime implementation.'
  },
  {
    key: 'canonical-registry', domain: 'kernel',
    source: 'core/canonical/canonical-registry.ts', canonicalTarget: 'core/canonical/canonical-registry.ts',
    recoveryState: 'COMPLETE', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Ground remaining memory/research/build/general domains.'
  },
  {
    key: 'capability-registry', domain: 'kernel',
    source: 'core/registry/capability-registry.ts', canonicalTarget: 'core/registry/capability-registry.ts',
    recoveryState: 'COMPLETE', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Align maturity/health metadata to runtime truth.'
  },
  {
    key: 'durable-execution', domain: 'runtime',
    source: 'core/runtime/durable-execution.ts', canonicalTarget: 'core/runtime/durable-execution.ts',
    recoveryState: 'PARTIAL', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Replace register/enqueue/execute/run compatibility stubs with durable queue-worker execution.'
  },
  {
    key: 'guardian-kernel', domain: 'guardian',
    source: 'core/guardian/pantavion-guardian-kernel.ts', canonicalTarget: 'core/guardian/pantavion-guardian-kernel.ts',
    recoveryState: 'PARTIAL', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Connect hosted scheduling, durable execution, audit and deploy gates.'
  },
  {
    key: 'autonomy-policy', domain: 'guardian',
    source: 'core/runtime/pantavion-autonomy-policy.ts', canonicalTarget: 'core/runtime/pantavion-autonomy-policy.ts',
    recoveryState: 'COMPLETE', decision: 'KEEP', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Bind policy checks to every autonomous execution entry point.'
  },
  {
    key: 'ai-command-center', domain: 'ai',
    source: 'core/ai/pantavion-ai-command-center.ts', canonicalTarget: 'core/ai/pantavion-ai-command-center.ts',
    recoveryState: 'PARTIAL', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Connect role/risk routing to real provider router and entitlements.'
  },
  {
    key: 'identity-model', domain: 'identity',
    source: 'core/identity/identity-model.ts', canonicalTarget: 'core/identity/identity-model.ts',
    recoveryState: 'COMPLETE', decision: 'MERGE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Merge model semantics with live Supabase Identity/Trust/Security schema.'
  },
  {
    key: 'delegation-model', domain: 'identity',
    source: 'core/identity/delegation-model.ts', canonicalTarget: 'core/identity/delegation-model.ts',
    recoveryState: 'COMPLETE', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Connect grants/scopes/expiry to runtime authorization.'
  },
  {
    key: 'thread-registry', domain: 'memory',
    source: 'core/memory/thread-registry.ts', canonicalTarget: 'core/memory/thread-registry.ts',
    recoveryState: 'COMPLETE', decision: 'EVOLVE', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Persist continuity graph and connect conversations/workflows.'
  },
  {
    key: 'unfinished-plan-ingestion', domain: 'recovery',
    source: 'core/intelligence/pantavion-unfinished-plan-ingestion.ts', canonicalTarget: 'core/intelligence/pantavion-unfinished-plan-ingestion.ts',
    recoveryState: 'PARTIAL', decision: 'KEEP', liveState: 'BACKEND_PARTIAL', placementState: 'IN_PLACE',
    publicExposureSafe: false, nextAction: 'Feed findings into canonical placement queue with deduplication.'
  },
  {
    key: 'donor-pantavion-planet-ui', domain: 'surface',
    source: 'repository:pantavion-planet-ui', canonicalTarget: 'app/** + components/** + styles/**',
    recoveryState: 'PARTIAL', decision: 'MERGE', liveState: 'SPEC_ONLY', placementState: 'DONOR_ACCESS_BLOCKED',
    publicExposureSafe: false, blocker: 'Donor repository is listed in recovery registries but is not currently visible through the active GitHub connector.',
    nextAction: 'When donor access is available, extract UI fragments individually, compare against canonical surfaces, then merge only superior unique pieces.'
  },
  {
    key: 'donor-pantavion-one', domain: 'legacy-lineage',
    source: 'repository:pantavion-one', canonicalTarget: 'docs/brand/** + app/** selective merge',
    recoveryState: 'PARTIAL', decision: 'INVESTIGATE', liveState: 'SPEC_ONLY', placementState: 'DONOR_ACCESS_BLOCKED',
    publicExposureSafe: false, blocker: 'Donor repository is not currently visible through the active GitHub connector.',
    nextAction: 'Recover unique brand/routing/product history only; do not create a parallel app.'
  }
];

export function listCanonicalPlacements(): CanonicalPlacementRecord[] {
  return CANONICAL_PLACEMENT_REGISTRY.map((item) => ({ ...item }));
}

export function listPlacementBacklog(): CanonicalPlacementRecord[] {
  return listCanonicalPlacements().filter((item) => item.placementState !== 'IN_PLACE');
}
