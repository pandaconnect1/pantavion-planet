export type PantavionPermanentInvariantKey =
  | "truth_before_status"
  | "no_orphan_founder_vision"
  | "constitutional_memory"
  | "multi_kernel_one_truth"
  | "maximum_bounded_intelligence"
  | "speed_without_corruption"
  | "zero_trust_least_privilege"
  | "immutable_originals"
  | "reversibility_before_production"
  | "continuous_technology_intake"
  | "provider_neutrality_sovereignty"
  | "evidence_bound_self_improvement"
  | "human_first_authority"
  | "safety_privacy_law_over_speed"
  | "observability_is_correctness"
  | "no_fake_live";

export interface PantavionPermanentInvariantRecord {
  key: PantavionPermanentInvariantKey;
  title: string;
  mandate: string;
  enforcement: readonly string[];
  founderLocked: true;
  failClosed: true;
}

export interface PantavionPermanentInvariantSnapshot {
  marker: "pantavion_permanent_system_invariants_v1";
  generatedAt: string;
  invariantCount: number;
  founderLockedCount: number;
  failClosedCount: number;
  truthLifecycle: readonly string[];
  errorLifecycle: readonly string[];
  records: PantavionPermanentInvariantRecord[];
}

const records: PantavionPermanentInvariantRecord[] = [
  {
    key: "truth_before_status",
    title: "Truth Before Status",
    mandate: "No capability may be promoted beyond the evidence actually proving its lifecycle state.",
    enforcement: ["evidence_chain", "implementation_registry", "verified_live_gate"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "no_orphan_founder_vision",
    title: "No-Orphan Founder Vision",
    mandate: "Every founder directive, historical idea, artifact and unresolved requirement retains provenance and an explicit disposition.",
    enforcement: ["provenance", "supersession_links", "review_required_on_unknown"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "constitutional_memory",
    title: "Constitutional Memory",
    mandate: "Pantavion preserves tiered continuity memory across conversations, decisions, artifacts and operational history without mixing raw sensitive payloads into lightweight runtime memory.",
    enforcement: ["hot_memory", "warm_index", "cold_private_archive", "chronology"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "multi_kernel_one_truth",
    title: "Multi-Kernel One Truth",
    mandate: "Parallel kernels, agents, models and workers share one canonical truth, authority, provenance and audit plane.",
    enforcement: ["canonical_truth", "single_authority_model", "deduplication", "shared_audit"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "maximum_bounded_intelligence",
    title: "Maximum Bounded Intelligence",
    mandate: "Each task routes to the strongest suitable intelligence while authority remains bounded by identity, consent, policy, risk, cost, jurisdiction and reversibility.",
    enforcement: ["model_router", "capability_gate", "risk_gate", "fallback"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "speed_without_corruption",
    title: "Speed Without Silent Corruption",
    mandate: "Latency optimization never bypasses idempotency, fencing, validation, provenance, conflict detection, audit or rollback.",
    enforcement: ["idempotency", "lease_fencing", "validation", "rollback"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "zero_trust_least_privilege",
    title: "Zero Trust and Least Privilege",
    mandate: "Privileged access is deny-by-default and secrets never enter public clients, chat transcripts, logs or repository evidence.",
    enforcement: ["least_privilege", "secret_isolation", "rls", "session_authority_checks"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "immutable_originals",
    title: "Immutable Originals",
    mandate: "Original evidence, artifacts and master records remain immutable when possible; byte-changing work creates provenance-linked derivatives.",
    enforcement: ["sha256", "versioning", "derivative_lineage", "source_preservation"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "reversibility_before_production",
    title: "Reversibility Before Production",
    mandate: "High-impact production change requires bounded blast radius, observability, backup/checkpoint where applicable and a tested rollback path.",
    enforcement: ["backup_gate", "rollback_gate", "canary", "owner_gate"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "continuous_technology_intake",
    title: "Continuous Technology Intake",
    mandate: "Pantavion continuously evaluates relevant modern technology through research, legal, security, benchmark, sandbox, comparison and canary stages before adoption.",
    enforcement: ["technology_library", "benchmark", "sandbox", "promotion_gate"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "provider_neutrality_sovereignty",
    title: "Provider Neutrality and Sovereignty",
    mandate: "Critical external dependencies remain explicit and replaceable where practical, with verified fallback and rollback before retirement.",
    enforcement: ["sovereignty_state", "provider_registry", "fallback", "replacement_evidence"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "evidence_bound_self_improvement",
    title: "Evidence-Bound Self Improvement",
    mandate: "Kernels and agents may research, propose, simulate and benchmark improvements, but may not silently mutate canonical production truth.",
    enforcement: ["proposal_governed", "simulation", "test_gate", "promotion_gate"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "human_first_authority",
    title: "Human-First Authority",
    mandate: "Founder-gated, sensitive, irreversible and high-impact actions require valid human authority; AI never invents permission.",
    enforcement: ["founder_gate", "consent", "authority_assertion", "audit"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "safety_privacy_law_over_speed",
    title: "Safety Privacy and Law Over Speed",
    mandate: "Feature speed, growth, autonomy and sovereignty never override mandatory safety, privacy, age, legal or jurisdiction controls.",
    enforcement: ["policy_engine", "jurisdiction_gate", "age_gate", "privacy_gate"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "observability_is_correctness",
    title: "Observability Is Correctness",
    mandate: "Critical capability correctness includes status, blocker, owner, revision, evidence, verification time and rollback visibility.",
    enforcement: ["health", "audit", "provenance", "lifecycle_truth"],
    founderLocked: true,
    failClosed: true,
  },
  {
    key: "no_fake_live",
    title: "No Fake-Live Pantavion",
    mandate: "Dead buttons, invented numbers, placeholder capabilities and unverified success states may not be presented as real.",
    enforcement: ["runtime_probe", "truth_label", "blocker_visibility", "verified_live_gate"],
    founderLocked: true,
    failClosed: true,
  },
];

export const PANTAVION_PERMANENT_TRUTH_LIFECYCLE = [
  "IDEA",
  "CODED",
  "TESTED",
  "MERGED",
  "DEPLOYED",
  "VERIFIED_LIVE",
  "OWNER_OK_FOR_USERS",
] as const;

export const PANTAVION_ERROR_LIFECYCLE = [
  "PREVENT",
  "DETECT",
  "CONTAIN",
  "RECOVER",
  "VERIFY",
  "LEARN",
] as const;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function listPantavionPermanentInvariants(): PantavionPermanentInvariantRecord[] {
  return records.map((record) => clone(record));
}

export function getPantavionPermanentInvariantSnapshot(): PantavionPermanentInvariantSnapshot {
  const current = listPantavionPermanentInvariants();
  return {
    marker: "pantavion_permanent_system_invariants_v1",
    generatedAt: new Date().toISOString(),
    invariantCount: current.length,
    founderLockedCount: current.filter((item) => item.founderLocked).length,
    failClosedCount: current.filter((item) => item.failClosed).length,
    truthLifecycle: [...PANTAVION_PERMANENT_TRUTH_LIFECYCLE],
    errorLifecycle: [...PANTAVION_ERROR_LIFECYCLE],
    records: current,
  };
}

export default listPantavionPermanentInvariants;
