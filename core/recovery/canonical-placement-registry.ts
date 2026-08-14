// core/recovery/canonical-placement-registry.ts
// Canonical recovery placement control. Registry presence never means VERIFIED_LIVE.

export type RecoveryState = 'COMPLETE' | 'PARTIAL' | 'SKELETON' | 'IDEA-SPEC' | 'DELETED-HISTORICAL';
export type RecoveryDecision = 'KEEP' | 'MERGE' | 'EVOLVE' | 'REBUILD' | 'ARCHIVE' | 'INVESTIGATE';
export type LiveState = 'SPEC_ONLY' | 'UI_ONLY' | 'BACKEND_PARTIAL' | 'BACKEND_LIVE' | 'CONNECTED' | 'TESTED' | 'DEPLOYED' | 'VERIFIED_LIVE';
export type PlacementState = 'IN_PLACE' | 'MERGE_PENDING' | 'MOVE_PENDING' | 'DONOR_ACCESS_BLOCKED' | 'ARCHIVED_REFERENCE';
export type DomainKernel = 'central' | 'identity' | 'people' | 'social' | 'chat' | 'translation' | 'voice' | 'dating' | 'safety' | 'memory' | 'ai' | 'guardian' | 'runtime' | 'surface' | 'recovery';

export interface CanonicalPlacementRecord {
  key: string;
  domain: string;
  centralKernel: 'core/kernel/kernel.ts';
  targetKernel: DomainKernel;
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

const CENTRAL_KERNEL = 'core/kernel/kernel.ts' as const;
const record = (item: Omit<CanonicalPlacementRecord,'centralKernel'>): CanonicalPlacementRecord => ({centralKernel:CENTRAL_KERNEL,...item});

export const CANONICAL_PLACEMENT_REGISTRY: CanonicalPlacementRecord[] = [
 record({key:'kernel-foundation-lock',domain:'kernel',targetKernel:'central',source:'core/kernel/kernel-foundation-lock.ts',canonicalTarget:'core/kernel/kernel-foundation-lock.ts',recoveryState:'COMPLETE',decision:'KEEP',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Reconcile declared kernel maturity with actual runtime implementation.'}),
 record({key:'canonical-registry',domain:'kernel',targetKernel:'central',source:'core/canonical/canonical-registry.ts',canonicalTarget:'core/canonical/canonical-registry.ts',recoveryState:'COMPLETE',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Ground remaining domains and require canonical ownership.'}),
 record({key:'capability-registry',domain:'kernel',targetKernel:'central',source:'core/registry/capability-registry.ts',canonicalTarget:'core/registry/capability-registry.ts',recoveryState:'COMPLETE',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Align maturity/health metadata to runtime truth and bind capabilities to domain kernels.'}),
 record({key:'durable-execution',domain:'runtime',targetKernel:'runtime',source:'core/runtime/durable-execution.ts',canonicalTarget:'core/runtime/durable-execution.ts',recoveryState:'PARTIAL',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Replace compatibility stubs with durable queue-worker execution governed by Central Kernel.'}),
 record({key:'guardian-kernel',domain:'guardian',targetKernel:'guardian',source:'core/guardian/pantavion-guardian-kernel.ts',canonicalTarget:'core/guardian/pantavion-guardian-kernel.ts',recoveryState:'PARTIAL',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Connect hosted scheduling, durable execution, audit and deploy gates through Central Kernel.'}),
 record({key:'autonomy-policy',domain:'guardian',targetKernel:'guardian',source:'core/runtime/pantavion-autonomy-policy.ts',canonicalTarget:'core/runtime/pantavion-autonomy-policy.ts',recoveryState:'COMPLETE',decision:'KEEP',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Bind policy checks to every autonomous execution entry point.'}),
 record({key:'ai-command-center',domain:'ai',targetKernel:'ai',source:'core/ai/pantavion-ai-command-center.ts',canonicalTarget:'core/ai/pantavion-ai-command-center.ts',recoveryState:'PARTIAL',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Connect role/risk routing to provider router, entitlements and Central Kernel authority.'}),
 record({key:'identity-model',domain:'identity',targetKernel:'identity',source:'core/identity/identity-model.ts',canonicalTarget:'core/identity/identity-model.ts',recoveryState:'COMPLETE',decision:'MERGE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Merge semantics with live Supabase Identity/Trust/Security schema and expose only kernel-authorized commands.'}),
 record({key:'delegation-model',domain:'identity',targetKernel:'identity',source:'core/identity/delegation-model.ts',canonicalTarget:'core/identity/delegation-model.ts',recoveryState:'COMPLETE',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Connect grants/scopes/expiry to runtime authorization.'}),
 record({key:'thread-registry',domain:'memory',targetKernel:'memory',source:'core/memory/thread-registry.ts',canonicalTarget:'core/memory/thread-registry.ts',recoveryState:'COMPLETE',decision:'EVOLVE',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Persist continuity graph and connect conversations/workflows through Memory Kernel.'}),
 record({key:'unfinished-plan-ingestion',domain:'recovery',targetKernel:'recovery',source:'core/intelligence/pantavion-unfinished-plan-ingestion.ts',canonicalTarget:'core/intelligence/pantavion-unfinished-plan-ingestion.ts',recoveryState:'PARTIAL',decision:'KEEP',liveState:'BACKEND_PARTIAL',placementState:'IN_PLACE',publicExposureSafe:false,nextAction:'Feed findings into canonical placement queue with deduplication and target-kernel assignment.'}),
 record({key:'donor-pantavion-planet-ui',domain:'surface',targetKernel:'surface',source:'repository:pantavion-planet-ui',canonicalTarget:'app/** + components/** + styles/**',recoveryState:'PARTIAL',decision:'MERGE',liveState:'SPEC_ONLY',placementState:'DONOR_ACCESS_BLOCKED',publicExposureSafe:false,blocker:'Donor repository is listed in recovery registries but is not currently visible through the active GitHub connector.',nextAction:'When accessible, extract fragments individually; assign each to its owning domain kernel before surface integration.'}),
 record({key:'donor-pantavion-one',domain:'legacy-lineage',targetKernel:'recovery',source:'repository:pantavion-one',canonicalTarget:'docs/brand/** + domain-specific selective merge',recoveryState:'PARTIAL',decision:'INVESTIGATE',liveState:'SPEC_ONLY',placementState:'DONOR_ACCESS_BLOCKED',publicExposureSafe:false,blocker:'Donor repository is not currently visible through the active GitHub connector.',nextAction:'Recover unique history, then assign useful fragments to the correct domain kernel; never create a parallel app.'})
];

export function listCanonicalPlacements(): CanonicalPlacementRecord[] { return CANONICAL_PLACEMENT_REGISTRY.map((item)=>({...item})); }
export function listPlacementBacklog(): CanonicalPlacementRecord[] { return listCanonicalPlacements().filter((item)=>item.placementState!=='IN_PLACE'); }
export function listPlacementsByKernel(kernel: DomainKernel): CanonicalPlacementRecord[] { return listCanonicalPlacements().filter((item)=>item.targetKernel===kernel); }
