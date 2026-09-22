import fs from "node:fs";

const invariantModule = await import("../core/pantavion/permanent-system-invariants.ts");
const visionModule = await import("../core/intake/vision-directive-registry.ts");
const kernelModule = await import("../core/kernel/kernel-constitution-registry.ts");
const memoryModule = await import("../core/kernel/kernel-continuity-memory.ts");
const lifelongModule = await import("../core/pantavion/lifelong-humanity-ecosystem.ts");

const invariantSnapshot = invariantModule.getPantavionPermanentInvariantSnapshot();
const vision = visionModule.listVisionDirectives();
const kernelSnapshot = kernelModule.getKernelConstitutionSnapshot();
const memory = memoryModule.createPantavionContinuityMemoryReport();
const lifelong = lifelongModule.getPantavionLifelongHumanityEcosystemSnapshot();

const failures = [];
const requireTruth = (condition, message) => {
  if (!condition) failures.push(message);
};

const requiredInvariantKeys = [
  "truth_before_status",
  "no_orphan_founder_vision",
  "constitutional_memory",
  "multi_kernel_one_truth",
  "maximum_bounded_intelligence",
  "speed_without_corruption",
  "zero_trust_least_privilege",
  "immutable_originals",
  "reversibility_before_production",
  "continuous_technology_intake",
  "provider_neutrality_sovereignty",
  "evidence_bound_self_improvement",
  "human_first_authority",
  "safety_privacy_law_over_speed",
  "observability_is_correctness",
  "no_fake_live",
];

const requiredDirectiveKeys = [
  "architecture-multi-kernel-one-truth",
  "continuity-no-orphan-founder-vision",
  "memory-constitutional-continuity",
  "intelligence-maximum-bounded-routing",
  "security-zero-trust-fail-closed",
  "innovation-continuous-modern-technology-intake",
  "mission-lifelong-humanity-ecosystem",
  "mission-seven-continent-human-unity",
  "innovation-human-benefit-invention-engine",
  "intelligence-lifelong-human-companion",
];

const expectedTruthLifecycle = [
  "IDEA",
  "CODED",
  "TESTED",
  "MERGED",
  "DEPLOYED",
  "VERIFIED_LIVE",
  "OWNER_OK_FOR_USERS",
];

const expectedErrorLifecycle = [
  "PREVENT",
  "DETECT",
  "CONTAIN",
  "RECOVER",
  "VERIFY",
  "LEARN",
];

const invariantKeys = new Set(invariantSnapshot.records.map((r) => r.key));
const directivesByKey = new Map(vision.map((r) => [r.directiveKey, r]));

requireTruth(
  invariantSnapshot.marker === "pantavion_permanent_system_invariants_v1",
  "permanent invariant marker missing",
);
requireTruth(
  invariantSnapshot.invariantCount === requiredInvariantKeys.length,
  `expected ${requiredInvariantKeys.length} permanent invariants, got ${invariantSnapshot.invariantCount}`,
);
requireTruth(
  invariantSnapshot.founderLockedCount === invariantSnapshot.invariantCount,
  "not every permanent invariant is founder-locked",
);
requireTruth(
  invariantSnapshot.failClosedCount === invariantSnapshot.invariantCount,
  "not every permanent invariant is fail-closed",
);

for (const key of requiredInvariantKeys) {
  requireTruth(invariantKeys.has(key), `missing permanent invariant: ${key}`);
}

requireTruth(
  JSON.stringify(invariantSnapshot.truthLifecycle) === JSON.stringify(expectedTruthLifecycle),
  "truth lifecycle drift detected",
);
requireTruth(
  JSON.stringify(invariantSnapshot.errorLifecycle) === JSON.stringify(expectedErrorLifecycle),
  "error lifecycle drift detected",
);

for (const key of requiredDirectiveKeys) {
  const directive = directivesByKey.get(key);
  requireTruth(Boolean(directive), `missing founder directive: ${key}`);
  if (directive) {
    requireTruth(directive.founderLocked === true, `directive is not founder-locked: ${key}`);
    requireTruth(directive.priority === "critical", `directive is not critical: ${key}`);
  }
}

requireTruth(kernelSnapshot.constitutionalKernelCount >= 5, "constitutional kernel count below baseline");
requireTruth(
  kernelSnapshot.regenerativeKernelCount === kernelSnapshot.constitutionalKernelCount,
  "not every constitutional kernel is regenerative",
);
requireTruth(
  kernelSnapshot.lightweightKernelCount === kernelSnapshot.constitutionalKernelCount,
  "not every constitutional kernel is lightweight",
);

requireTruth(memory.ok === true, "continuity memory contract not healthy");
requireTruth(memory.memoryPolicy.hotCurrentContext === true, "hot memory disabled");
requireTruth(memory.memoryPolicy.warmIndexedSummaries === true, "warm indexed memory disabled");
requireTruth(memory.memoryPolicy.coldPrivateArchive === true, "cold private archive disabled");
requireTruth(memory.memoryPolicy.internalDecisionLedger === true, "internal decision ledger disabled");
requireTruth(memory.protectedBoundaries.noUserRecordLoss === true, "no-user-record-loss boundary disabled");
requireTruth(memory.protectedBoundaries.noBlobMutation === true, "no-blob-mutation boundary disabled");

requireTruth(lifelong.marker === "pantavion_lifelong_humanity_ecosystem_v1", "lifelong humanity marker missing");
requireTruth(lifelong.founderLocked === true, "lifelong humanity ecosystem is not founder-locked");
requireTruth(lifelong.sevenContinentCoverageRequired === true, "seven-continent coverage requirement disabled");
requireTruth(lifelong.humanAgencyRequired === true, "human agency requirement disabled");
requireTruth(lifelong.evidenceBoundInnovation === true, "evidence-bound innovation requirement disabled");
requireTruth(lifelong.noValuationGuarantee === true, "valuation truth boundary disabled");
requireTruth(lifelong.lifeStages.length === 14, `expected 14 life stages, got ${lifelong.lifeStages.length}`);
requireTruth(lifelong.intelligence.multiKernel === true, "lifelong multi-kernel intelligence disabled");
requireTruth(lifelong.intelligence.deterministicTruthSystems === true, "deterministic truth systems disabled");
requireTruth(lifelong.intelligence.consentAwareMemory === true, "consent-aware memory disabled");
requireTruth(lifelong.innovationDomains.includes("neuroscience_cognitive_assistance"), "neuroscience innovation domain missing");
requireTruth(lifelong.innovationDomains.includes("longevity_healthy_ageing"), "healthy-ageing innovation domain missing");

const doctrine = fs.readFileSync("docs/architecture/PANTAVION_PERMANENT_SYSTEM_INVARIANTS_20260922.md", "utf8");
for (const marker of [
  "Truth before status",
  "No-orphan founder vision",
  "Multi-kernel, one truth",
  "Zero-trust and least privilege",
  "Modern technology intake is continuous, not reckless",
  "PREVENT -> DETECT -> CONTAIN -> RECOVER -> VERIFY -> LEARN",
  "No static/fake-live Pantavion",
]) {
  requireTruth(doctrine.includes(marker), `constitutional doctrine marker missing: ${marker}`);
}

const lifelongDoctrine = fs.readFileSync("docs/architecture/PANTAVION_LIFELONG_HUMANITY_ECOSYSTEM_20260922.md", "utf8");
for (const marker of [
  "Lifelong human companion model",
  "Seven-continent unification",
  "Self-regeneration and self-upgrade",
  "Innovation and invention mission",
  "Human capability extension",
  "No valuation is guaranteed.",
]) {
  requireTruth(lifelongDoctrine.includes(marker), `lifelong humanity doctrine marker missing: ${marker}`);
}

const masterDoctrine = fs.readFileSync("PANTAVION-MASTER-DOCTRINE.md", "utf8");
for (const marker of [
  "Human-first: ο άνθρωπος αποφασίζει, η AI υποστηρίζει.",
  "Multi-kernel hierarchy, common truth, common security and one canonical control plane.",
  "No uncontrolled production self-modification.",
  "Recovered/classified is not the same as implemented/live.",
]) {
  requireTruth(masterDoctrine.includes(marker), `master doctrine marker missing: ${marker}`);
}

if (failures.length) {
  console.error(JSON.stringify({
    marker: "pantavion_permanent_invariants_audit_v1",
    ok: false,
    failures,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  marker: "pantavion_permanent_invariants_audit_v1",
  ok: true,
  permanentInvariantCount: invariantSnapshot.invariantCount,
  founderLockedInvariantCount: invariantSnapshot.founderLockedCount,
  failClosedInvariantCount: invariantSnapshot.failClosedCount,
  requiredFounderDirectiveCount: requiredDirectiveKeys.length,
  totalVisionDirectiveCount: vision.length,
  constitutionalKernelCount: kernelSnapshot.constitutionalKernelCount,
  continuityMemory: {
    hot: memory.memoryPolicy.hotCurrentContext,
    warm: memory.memoryPolicy.warmIndexedSummaries,
    cold: memory.memoryPolicy.coldPrivateArchive,
    internalDecisionLedger: memory.memoryPolicy.internalDecisionLedger,
  },
  lifelongHumanity: {
    founderLocked: lifelong.founderLocked,
    lifeStageCount: lifelong.lifeStages.length,
    sevenContinentCoverageRequired: lifelong.sevenContinentCoverageRequired,
    evidenceBoundInnovation: lifelong.evidenceBoundInnovation,
    humanAgencyRequired: lifelong.humanAgencyRequired,
  },
  truthLifecycle: invariantSnapshot.truthLifecycle,
  errorLifecycle: invariantSnapshot.errorLifecycle,
}, null, 2));
