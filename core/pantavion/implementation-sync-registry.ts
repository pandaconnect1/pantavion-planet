export type ImplementationState =
  | "idea"
  | "coded"
  | "tested"
  | "merged"
  | "deployed"
  | "verified_live"
  | "blocked";

export type ImplementationEvidenceKind =
  | "code"
  | "test"
  | "merge"
  | "deployment"
  | "exact_revision"
  | "authenticated_e2e"
  | "rls_isolation"
  | "rollback"
  | "audit";

export type ImplementationEvidence = {
  kind: ImplementationEvidenceKind;
  reference: string;
  recordedAt: string;
  revision?: string;
};

export type ImplementationSyncItem = {
  id: string;
  title: string;
  domain: string;
  state: ImplementationState;
  source: string;
  branch?: string;
  pr?: number;
  evidence?: string[];
  evidenceRecords?: ImplementationEvidence[];
  blocker?: string;
  updatedAt: string;
};

const stateOrder: Exclude<ImplementationState, "blocked">[] = [
  "idea",
  "coded",
  "tested",
  "merged",
  "deployed",
  "verified_live",
];

const requiredEvidence: Record<Exclude<ImplementationState, "blocked">, ImplementationEvidenceKind[]> = {
  idea: [],
  coded: ["code"],
  tested: ["code", "test"],
  merged: ["code", "test", "merge"],
  deployed: ["code", "test", "merge", "deployment", "exact_revision"],
  verified_live: [
    "code",
    "test",
    "merge",
    "deployment",
    "exact_revision",
    "authenticated_e2e",
    "rls_isolation",
    "rollback",
    "audit",
  ],
};

const validImplementationStates = new Set<ImplementationState>([...stateOrder, "blocked"]);
const validEvidenceKinds = new Set<ImplementationEvidenceKind>([
  "code",
  "test",
  "merge",
  "deployment",
  "exact_revision",
  "authenticated_e2e",
  "rls_isolation",
  "rollback",
  "audit",
]);
const revisionBoundEvidenceKinds = new Set<ImplementationEvidenceKind>([
  "merge",
  "deployment",
  "exact_revision",
  "authenticated_e2e",
  "rls_isolation",
  "rollback",
  "audit",
]);

export function requiredEvidenceForState(state: ImplementationState): ImplementationEvidenceKind[] {
  if (!validImplementationStates.has(state)) throw new Error("invalid implementation state");
  return state === "blocked" ? [] : [...requiredEvidence[state]];
}

export function validateImplementationTruth(item: ImplementationSyncItem): string[] {
  const blockers: string[] = [];
  const updatedAt = Date.parse(item.updatedAt);
  if (!item.id.trim() || !item.title.trim() || !item.source.trim()) blockers.push("identity_or_source_missing");
  if (!Number.isFinite(updatedAt)) blockers.push("updated_at_invalid");
  if (!validImplementationStates.has(item.state)) {
    blockers.push("implementation_state_invalid");
    return blockers;
  }
  if (item.state === "blocked") {
    if (!item.blocker?.trim()) blockers.push("blocked_state_without_blocker");
    return blockers;
  }

  const evidenceRecords = item.evidenceRecords ?? [];
  for (const record of evidenceRecords) {
    if (!validEvidenceKinds.has(record.kind)) blockers.push("evidence_kind_invalid");
    if (!record.reference.trim()) blockers.push("evidence_reference_missing:" + record.kind);
    const recordedAt = Date.parse(record.recordedAt);
    if (!Number.isFinite(recordedAt)) blockers.push("evidence_timestamp_invalid:" + record.kind);
    else if (Number.isFinite(updatedAt) && recordedAt > updatedAt) {
      blockers.push("evidence_after_item_update:" + record.kind);
    }
    if (revisionBoundEvidenceKinds.has(record.kind) && !record.revision?.trim()) {
      blockers.push("evidence_revision_missing:" + record.kind);
    }
  }

  const evidenceKinds = new Set(evidenceRecords.map((record) => record.kind));
  for (const required of requiredEvidence[item.state]) {
    if (!evidenceKinds.has(required)) blockers.push("evidence_missing:" + required);
  }

  if (item.state === "deployed" || item.state === "verified_live") {
    const exactRevisions = [
      ...new Set(
        evidenceRecords
          .filter((record) => record.kind === "exact_revision")
          .map((record) => record.revision?.trim())
          .filter((revision): revision is string => Boolean(revision)),
      ),
    ];
    if (!exactRevisions.length) blockers.push("exact_deployed_revision_missing");
    if (exactRevisions.length > 1) blockers.push("contradictory_exact_deployed_revisions");
    const exactRevision = exactRevisions[0];
    if (exactRevision) {
      for (const record of evidenceRecords) {
        if (
          revisionBoundEvidenceKinds.has(record.kind) &&
          record.kind !== "merge" &&
          record.revision?.trim() &&
          record.revision.trim() !== exactRevision
        ) {
          blockers.push("evidence_revision_mismatch:" + record.kind);
        }
      }
    }
  }
  return [...new Set(blockers)];
}

export function canAdvanceImplementationState(
  current: ImplementationState,
  next: ImplementationState,
) {
  if (!validImplementationStates.has(current) || !validImplementationStates.has(next)) return false;
  if (next === "blocked") return true;
  if (current === "blocked") return false;
  const currentRank = stateOrder.indexOf(current);
  const nextRank = stateOrder.indexOf(next);
  return nextRank === currentRank || nextRank === currentRank + 1;
}

export function advanceImplementationItem(
  current: ImplementationSyncItem,
  next: ImplementationState,
  evidenceRecords: ImplementationEvidence[],
  updatedAt: string,
): ImplementationSyncItem {
  if (!canAdvanceImplementationState(current.state, next)) {
    throw new Error("invalid implementation transition:" + current.state + "->" + next);
  }
  const nextUpdatedAt = Date.parse(updatedAt);
  const currentUpdatedAt = Date.parse(current.updatedAt);
  if (
    !Number.isFinite(nextUpdatedAt) ||
    !Number.isFinite(currentUpdatedAt) ||
    nextUpdatedAt < currentUpdatedAt
  ) {
    throw new Error("implementation updatedAt must be valid and monotonic");
  }
  const candidate: ImplementationSyncItem = {
    ...current,
    state: next,
    evidenceRecords: [...(current.evidenceRecords ?? []), ...evidenceRecords],
    updatedAt,
  };
  const blockers = validateImplementationTruth(candidate);
  if (blockers.length) throw new Error("implementation truth rejected:" + blockers.join(","));
  return candidate;
}

function stateRank(state: ImplementationState) {
  return state === "blocked" ? -1 : stateOrder.indexOf(state);
}

export function synchronizeImplementationItems(
  ...sources: ImplementationSyncItem[][]
): ImplementationSyncItem[] {
  const merged = new Map<string, ImplementationSyncItem>();

  for (const item of sources.flat()) {
    const truthBlockers = validateImplementationTruth(item);
    const safeItem = truthBlockers.length
      ? { ...item, state: "blocked" as const, blocker: "truth_gate:" + truthBlockers.join("|") }
      : item;
    const existing = merged.get(safeItem.id);
    if (!existing) {
      merged.set(safeItem.id, safeItem);
      continue;
    }

    if (safeItem.state === "blocked" && existing.state !== "blocked") continue;

    const incomingRank = stateRank(safeItem.state);
    const existingRank = stateRank(existing.state);
    const incomingTime = Date.parse(safeItem.updatedAt);
    const existingTime = Date.parse(existing.updatedAt);
    const newer = Number.isFinite(incomingTime) && (
      !Number.isFinite(existingTime) || incomingTime >= existingTime
    );
    const preferred =
      incomingRank > existingRank || (incomingRank === existingRank && newer)
        ? safeItem
        : existing;

    const validEvidenceSources = [existing, safeItem].filter((candidate) => candidate.state !== "blocked");
    const mergedEvidenceRecords = validEvidenceSources
      .flatMap((candidate) => candidate.evidenceRecords ?? [])
      .filter((record, index, all) =>
        all.findIndex((candidate) =>
          candidate.kind === record.kind &&
          candidate.reference === record.reference &&
          candidate.revision === record.revision &&
          candidate.recordedAt === record.recordedAt,
        ) === index,
      );

    const candidate: ImplementationSyncItem = {
      ...preferred,
      evidence: [
        ...new Set(validEvidenceSources.flatMap((source) => source.evidence ?? [])),
      ],
      evidenceRecords: mergedEvidenceRecords,
    };
    const candidateBlockers = validateImplementationTruth(candidate);
    merged.set(
      safeItem.id,
      candidateBlockers.length
        ? {
            ...candidate,
            state: "blocked",
            blocker: "truth_gate:" + candidateBlockers.join("|"),
          }
        : candidate,
    );
  }

  return [...merged.values()].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

type MergedMainItemInput = {
  id: string;
  title: string;
  domain: string;
  source: string;
  pr: number;
  headRevision: string;
  mergeRevision: string;
  testRun: string;
  testedAt: string;
  mergedAt: string;
};

function mergedMainItem(input: MergedMainItemInput): ImplementationSyncItem {
  return {
    id: input.id,
    title: input.title,
    domain: input.domain,
    state: "merged",
    source: input.source,
    branch: "main",
    pr: input.pr,
    evidenceRecords: [
      {
        kind: "code",
        reference: input.source,
        recordedAt: input.testedAt,
        revision: input.headRevision,
      },
      {
        kind: "test",
        reference: input.testRun,
        recordedAt: input.testedAt,
        revision: input.headRevision,
      },
      {
        kind: "merge",
        reference: `https://github.com/pandaconnect1/pantavion-planet/pull/${input.pr}`,
        recordedAt: input.mergedAt,
        revision: input.mergeRevision,
      },
    ],
    updatedAt: input.mergedAt,
  };
}

type TestedPullRequestItemInput = {
  id: string;
  title: string;
  domain: string;
  source: string;
  branch: string;
  pr: number;
  headRevision: string;
  testRun: string;
  testedAt: string;
  auditReference?: string;
  evidence?: string[];
};

function testedPullRequestItem(input: TestedPullRequestItemInput): ImplementationSyncItem {
  const evidenceRecords: ImplementationEvidence[] = [
    {
      kind: "code",
      reference: input.source,
      recordedAt: input.testedAt,
      revision: input.headRevision,
    },
    {
      kind: "test",
      reference: input.testRun,
      recordedAt: input.testedAt,
      revision: input.headRevision,
    },
  ];
  if (input.auditReference) {
    evidenceRecords.push({
      kind: "audit",
      reference: input.auditReference,
      recordedAt: input.testedAt,
      revision: input.headRevision,
    });
  }
  return {
    id: input.id,
    title: input.title,
    domain: input.domain,
    state: "tested",
    source: input.source,
    branch: input.branch,
    pr: input.pr,
    evidence: input.evidence,
    evidenceRecords,
    updatedAt: input.testedAt,
  };
}

function mergedFactoryItem(
  id: string,
  title: string,
  domain: string,
  source: string,
): ImplementationSyncItem {
  return mergedMainItem({
    id,
    title,
    domain,
    source,
    pr: 315,
    headRevision: "75208e3baeef68b819977727f1c6425769294058",
    mergeRevision: "39391543b46d1226686d4d5b915f38efd69e83e7",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33304779695",
    testedAt: "2026-08-30T09:46:35.000Z",
    mergedAt: "2026-08-30T14:32:11.000Z",
  });
}

export const sovereignFactoryImplementationItems: ImplementationSyncItem[] = [
  mergedMainItem({
    id: "canonical-conversation-intake",
    title: "Canonical Conversation Intake",
    domain: "kernel",
    source: "core/intake/pantavion-conversation-intake.ts",
    pr: 329,
    headRevision: "cdc29cce4f10bad625c58d87ad1be7655b363492",
    mergeRevision: "da3c3eaf483455e55960cad27f6f01f396e2a4a0",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33198943520",
    testedAt: "2026-08-28T18:24:01.000Z",
    mergedAt: "2026-08-28T18:24:45.000Z",
  }),
  mergedMainItem({
    id: "universal-artifact-intake",
    title: "Universal Artifact Intake",
    domain: "recovery",
    source: "core/intake/pantavion-universal-artifact-intake.ts",
    pr: 330,
    headRevision: "6b979eed47e4ca3627a3bd79a68ba5db5c974907",
    mergeRevision: "4d74dbbdb00653b35a11016e52be736fbfe6f81a",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33200845615",
    testedAt: "2026-08-28T18:48:49.000Z",
    mergedAt: "2026-08-28T18:49:38.000Z",
  }),
  mergedMainItem({
    id: "universal-raw-artifact-upload",
    title: "Universal Raw Artifact Upload",
    domain: "recovery",
    source: "app/api/kernel/artifact-upload/complete/route.ts",
    pr: 331,
    headRevision: "a33da52cca3fcab2858a5ee976d71359013230bb",
    mergeRevision: "cc59aadbb7c5a2cd37d234c6b3cd07b296357b6d",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33201669487",
    testedAt: "2026-08-28T18:59:34.000Z",
    mergedAt: "2026-08-28T19:00:32.000Z",
  }),
  mergedMainItem({
    id: "artifact-sha-byte-truth",
    title: "Stored-byte SHA-256 Verification Truth",
    domain: "recovery",
    source: "core/intake/pantavion-universal-artifact-intake.ts",
    pr: 332,
    headRevision: "376ad678410553421c0efbc01bf032cf9699a4ec",
    mergeRevision: "ecf4d1c6c298139b84ef88b66c8219cebfc0058c",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33216071220",
    testedAt: "2026-08-28T22:17:48.000Z",
    mergedAt: "2026-08-29T05:23:47.000Z",
  }),
  mergedMainItem({
    id: "durable-execution-fencing",
    title: "Durable Execution Lease Fencing",
    domain: "runtime",
    source: "core/runtime/durable-execution-fencing.ts",
    pr: 333,
    headRevision: "fa5d6b6fca77091408ff7cf05de958c3f6c88ca5",
    mergeRevision: "de5623cdaeeca37a93797261cba6f7cd3bf497f6",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33235879451",
    testedAt: "2026-08-29T05:21:08.000Z",
    mergedAt: "2026-08-29T05:22:34.000Z",
  }),
  mergedMainItem({
    id: "sovereignty-loop",
    title: "Self-sustaining Sovereignty Loop",
    domain: "kernel",
    source: "core/kernel/pantavion-sovereignty-loop.ts",
    pr: 337,
    headRevision: "72a0787612d781eb1dcbc786f6023fdf232c2f24",
    mergeRevision: "e7ceeed19b39b8249ace38b19885faea95a7577b",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33245816062",
    testedAt: "2026-08-29T09:36:09.000Z",
    mergedAt: "2026-08-29T09:37:21.000Z",
  }),
  mergedMainItem({
    id: "global-safety-fabric",
    title: "Global Multi-Kernel Safety Fabric",
    domain: "safety",
    source: "kernel/global-safety-fabric.ts",
    pr: 338,
    headRevision: "04114dfeb4d44557a09603bd9e53826f0bee4e95",
    mergeRevision: "cee3597409db3c96e838384d2a8cdcf94bc5c249",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33246606266",
    testedAt: "2026-08-29T09:57:29.000Z",
    mergedAt: "2026-08-29T09:58:49.000Z",
  }),
  mergedMainItem({
    id: "personal-ai-adaptive-runtime",
    title: "Personal AI Adaptive Runtime",
    domain: "personal_ai",
    source: "core/intelligence/personal-ai-adaptive-runtime.ts",
    pr: 339,
    headRevision: "17fddc8acc51b26f4184380192e25f76f4ad36e4",
    mergeRevision: "907efd183774445b44d34914f28de9ef64c71569",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33247677154",
    testedAt: "2026-08-29T10:24:39.000Z",
    mergedAt: "2026-08-29T10:25:39.000Z",
  }),
  mergedMainItem({
    id: "semantic-classification-v4",
    title: "Semantic Classification v4 Current Main",
    domain: "recovery",
    source: "scripts/pantavion-canonical-semantic-classification-v3.cjs",
    pr: 340,
    headRevision: "246f5ccf0d28d516a7baba09a0ffcaad9295f1f4",
    mergeRevision: "27b3941a686df6b93bc3435e033b5c9c3d874c64",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33248853554",
    testedAt: "2026-08-29T10:55:46.000Z",
    mergedAt: "2026-08-29T10:57:11.000Z",
  }),
  mergedMainItem({
    id: "governed-hold-closure-v4",
    title: "Governed HOLD Closure v4",
    domain: "recovery",
    source: "data/recovery/governed-hold-resolution-v4.json",
    pr: 341,
    headRevision: "cdba56cedf248ee8af6279cf245a9dd39ba28295",
    mergeRevision: "30af1fd2f2b9791c152dc2851fdbe26e2b822a8b",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33249215839",
    testedAt: "2026-08-29T11:05:03.000Z",
    mergedAt: "2026-08-29T11:06:40.000Z",
  }),
  mergedMainItem({
    id: "global-human-demand-radar",
    title: "Seven-Continent Global Human Demand Radar",
    domain: "research",
    source: "core/research/pantavion-global-human-demand-radar.ts",
    pr: 342,
    headRevision: "528dc75f9deb55d36b87ce12e312578fb66e7c33",
    mergeRevision: "df2f33701dc4c8876615a7426cb53575da171a86",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33251431284",
    testedAt: "2026-08-29T12:02:36.000Z",
    mergedAt: "2026-08-29T12:53:42.000Z",
  }),
  mergedMainItem({
    id: "demand-promotion-control",
    title: "Founder Demand Promotion Control",
    domain: "research",
    source: "core/research/pantavion-demand-promotion.ts",
    pr: 343,
    headRevision: "a702129e095c44ac8fc9893c5d53c6cc6e7b0a92",
    mergeRevision: "1ba14f74f214dd454d5ba3bc294a5db7e6b3fce8",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33253841837",
    testedAt: "2026-08-29T13:00:55.000Z",
    mergedAt: "2026-08-29T13:01:46.000Z",
  }),
  mergedMainItem({
    id: "founder-canonical-state-runtime",
    title: "Pantavion-native Founder Continuity Runtime",
    domain: "kernel",
    source: "core/kernel/pantavion-founder-canonical-state-runtime.ts",
    pr: 345,
    headRevision: "341bb68f127ac320ce79519326fb652f48d8eccf",
    mergeRevision: "02602948426bbabed28c40f392641436d0d61339",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33256733833",
    testedAt: "2026-08-29T14:08:59.000Z",
    mergedAt: "2026-08-29T14:10:19.000Z",
  }),
  mergedMainItem({
    id: "persistent-demand-radar",
    title: "Persistent Founder Demand Radar",
    domain: "research",
    source: "core/research/pantavion-demand-radar-runtime.ts",
    pr: 346,
    headRevision: "3aa4fe760d6921bbbe6e27871c1f2cbf76e3c10b",
    mergeRevision: "c8a483be2d4fd59a815c8808e6c212827d2d111b",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33266008555",
    testedAt: "2026-08-29T17:37:05.000Z",
    mergedAt: "2026-08-29T17:38:05.000Z",
  }),
  mergedMainItem({
    id: "universal-artifact-runtime-1-5g",
    title: "Universal Artifact Runtime 1.5 GiB Policy",
    domain: "recovery",
    source: "core/intake/pantavion-artifact-storage-policy.ts",
    pr: 347,
    headRevision: "f9b22994c0f3feba650e0c8206f07c29f3ba486e",
    mergeRevision: "aef121dadea57c5bd3be58450422afafda4acddc",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33266350988",
    testedAt: "2026-08-29T17:45:02.000Z",
    mergedAt: "2026-08-29T17:46:03.000Z",
  }),
  mergedFactoryItem(
    "sovereign-technology-factory",
    "Sovereign Technology Factory",
    "sovereign",
    "core/sovereign/technology-factory.ts",
  ),
  mergedFactoryItem(
    "intent-to-outcome-fabric",
    "Intent-to-Outcome Fabric",
    "sovereign",
    "core/sovereign/intent-to-outcome-fabric.ts",
  ),
  mergedFactoryItem(
    "ephemeral-agent-swarm",
    "Ephemeral Agent Swarm",
    "sovereign",
    "core/sovereign/ephemeral-agent-swarm.ts",
  ),
  mergedFactoryItem(
    "intent-firewall",
    "Intent Firewall",
    "sovereign",
    "core/sovereign/intent-firewall.ts",
  ),
  mergedFactoryItem(
    "agent-capability-budget",
    "Agent Capability & Budget Control",
    "sovereign",
    "core/sovereign/agent-capability-budget-control.ts",
  ),
  mergedFactoryItem(
    "disconnected-edge-execution",
    "Disconnected / Edge Execution",
    "sovereign",
    "core/sovereign/edge-execution.ts",
  ),
  mergedFactoryItem(
    "technology-library",
    "Technology Library",
    "sovereign",
    "core/sovereign/technology-library.ts",
  ),
  mergedFactoryItem(
    "bounded-execution-runtime",
    "Receipt-chained Bounded Execution Runtime",
    "runtime",
    "core/sovereign/bounded-execution-runtime.ts",
  ),
  mergedFactoryItem(
    "bounded-execution-checkpointing",
    "Fenced Bounded Execution Checkpointing",
    "runtime",
    "core/sovereign/bounded-execution-runtime.ts",
  ),
  mergedFactoryItem(
    "durable-bounded-execution-coordinator",
    "Durable Fenced Bounded Execution Recovery",
    "runtime",
    "core/sovereign/durable-bounded-execution-coordinator.ts",
  ),
  mergedFactoryItem(
    "sovereign-capability-kernel",
    "Sovereign Capability Kernel",
    "kernel",
    "core/sovereign/sovereign-capability-kernel.ts",
  ),
  mergedFactoryItem(
    "implementation-sync",
    "Automatic Implementation Sync",
    "kernel",
    "core/pantavion/implementation-sync-registry.ts",
  ),
  mergedFactoryItem(
    "owner-implementation-surface",
    "Founder-only Implementation Truth",
    "owner_control",
    "app/owner/control/implementation/page.tsx",
  ),
  mergedMainItem({
    id: "recovery-corpus-runtime-fabric",
    title: "82,413-record Recovery Runtime Fabric",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-runtime-fabric.ts",
    pr: 352,
    headRevision: "b4525534fb2f43e1c686cdca1ba906e03f397cae",
    mergeRevision: "9f7399f4bc025fba816fd2e6296a2c7acf32b3b3",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33317521905",
    testedAt: "2026-08-30T14:45:25.000Z",
    mergedAt: "2026-08-30T14:45:25.000Z",
  }),
  mergedMainItem({
    id: "privileged-mutation-boundary",
    title: "Privileged Mutation Boundary",
    domain: "security",
    source: "core/kernel/kernel-privileged-mutation-boundary.ts",
    pr: 353,
    headRevision: "f9aaae9d1094385b6c3e378cdf51a281135ae1a0",
    mergeRevision: "fb0a2c85293e458f146b15eba64112d84d329de2",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33304597556",
    testedAt: "2026-08-30T14:31:48.000Z",
    mergedAt: "2026-08-30T14:31:48.000Z",
  }),
  mergedMainItem({
    id: "recovery-partition-scheduler",
    title: "Durable Recovery Partition Scheduler",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-partition-scheduler.ts",
    pr: 354,
    headRevision: "32d2ad000987815c6403c11f4312dfb4041f8537",
    mergeRevision: "3bd9d8f894154b7424cea72d773813ec3e932afd",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33318156427",
    testedAt: "2026-08-30T14:59:17.000Z",
    mergedAt: "2026-08-30T14:59:17.000Z",
  }),
  mergedMainItem({
    id: "recovery-source-batch-index",
    title: "Deterministic Recovery Source Batch Index",
    domain: "recovery",
    source: "scripts/pantavion-recovery-source-batch-index.mjs",
    pr: 355,
    headRevision: "f490f6c2f33d3835c407d9c285c0f1c5534e2e6e",
    mergeRevision: "fd6270d47615ae009f83a59be10bf5828b804fe9",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33319156304",
    testedAt: "2026-08-30T15:20:30.000Z",
    mergedAt: "2026-08-30T15:20:30.000Z",
  }),
  mergedMainItem({
    id: "recovery-partition-inventory",
    title: "Full-corpus Recovery Partition Inventory",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-partition-inventory.ts",
    pr: 356,
    headRevision: "cc6cfe25d30f59e0cf20aa012f75c8e16d908d96",
    mergeRevision: "71d6092062a87f2a9de3d1b367997ee54acfca72",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33327419968",
    testedAt: "2026-08-30T18:17:09.000Z",
    mergedAt: "2026-08-30T18:17:09.000Z",
  }),
  mergedMainItem({
    id: "recovery-source-index-preservation",
    title: "Recovery Source Index Preservation",
    domain: "recovery",
    source: "scripts/pantavion-recovery-source-batch-index.mjs",
    pr: 357,
    headRevision: "ae087033f1c2cea13ae7b78446e3d938673ea0cf",
    mergeRevision: "7a644b8e30e2f782059959f1570d073744968bc0",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33327149384",
    testedAt: "2026-08-30T18:11:17.000Z",
    mergedAt: "2026-08-30T18:11:17.000Z",
  }),
  mergedMainItem({
    id: "translation-e2e-cooldown",
    title: "Production Translation E2E Cooldown Control",
    domain: "translation",
    source: ".github/workflows/pantavion-production-translation-e2e.yml",
    pr: 358,
    headRevision: "fb9e658d69ea7c76800310ad7eff497206934841",
    mergeRevision: "71075eaf8fd6c758489936c768f1985181af1dca",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33319955615",
    testedAt: "2026-08-30T18:04:48.000Z",
    mergedAt: "2026-08-30T18:04:48.000Z",
  }),
  {
    id: "recovery-semantic-receipts-superseded",
    title: "Superseded Recovery Semantic Receipts",
    domain: "recovery",
    state: "blocked",
    source: "https://github.com/pandaconnect1/pantavion-planet/pull/359",
    branch: "feature/recovery-partition-semantic-receipts-20260830",
    pr: 359,
    blocker: "PR #359 closed unmerged and was superseded without data loss by TESTED PR #364.",
    updatedAt: "2026-08-30T20:51:36.000Z",
  },
  mergedMainItem({
    id: "recovery-fenced-production-executor",
    title: "Fenced Production Recovery Executor",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-fenced-executor.ts",
    pr: 360,
    headRevision: "d0023f59a63413ac9c4f66a27834617bd88f438a",
    mergeRevision: "c710abbf1d24fefddc3f8d2154841a0982c64022",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33329985335",
    testedAt: "2026-08-30T19:13:08.000Z",
    mergedAt: "2026-08-30T19:13:08.000Z",
  }),
  mergedMainItem({
    id: "internal-scheduler-redundancy",
    title: "Internal Scheduler Redundancy",
    domain: "runtime",
    source: "app/api/pantavion/intelligence/scheduler-health/route.ts",
    pr: 361,
    headRevision: "b135348dcb764cfd1f5c2288f0f5a52bb119336e",
    mergeRevision: "bb085e9cba119938d1c691b795d5b32da3864286",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33331095426",
    testedAt: "2026-08-30T19:56:37.000Z",
    mergedAt: "2026-08-30T19:56:37.000Z",
  }),
  mergedMainItem({
    id: "scheduler-history-admin-binding-repair",
    title: "Scheduler History and Admin Binding Repair",
    domain: "runtime",
    source: ".github/workflows/pantavion-repair-vercel-supabase-admin.yml",
    pr: 362,
    headRevision: "e39ca1efecf7f3c52fe15e3b31b35e0d737905db",
    mergeRevision: "f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33333034293",
    testedAt: "2026-08-30T20:16:06.000Z",
    mergedAt: "2026-08-30T20:16:06.000Z",
  }),
  testedPullRequestItem({
    id: "scheduler-single-credential-admin-repair",
    title: "Single-credential Scheduler Admin Repair",
    domain: "runtime",
    source: ".github/workflows/pantavion-repair-vercel-supabase-admin.yml",
    branch: "fix/vercel-token-only-admin-repair",
    pr: 363,
    headRevision: "15e56e8de04693e88698965438a7edae2695b6bd",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33333406006",
    testedAt: "2026-08-31T01:53:54.000Z",
    evidence: ["remaining_external_credential:VERCEL_TOKEN"],
  }),
  testedPullRequestItem({
    id: "recovery-partition-semantic-receipts",
    title: "82,413-record Chained Semantic Receipts",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-partition-semantic-receipt.ts",
    branch: "feature/recovery-partition-semantic-receipts-main-20260830",
    pr: 364,
    headRevision: "b5cd186847a957588adf98745e0edcdd496e9b1e",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33335022195",
    testedAt: "2026-08-30T21:00:49.000Z",
    auditReference: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33335022195/artifacts/9738809673",
    evidence: [
      "records:82413",
      "partitions:165",
      "artifact_bytes:19070669",
      "artifact_sha256:6d63c5e5a54444b8e8ae9dddac483f7ea4aeed96677bce317c09a15bd25c695d",
    ],
  }),
  testedPullRequestItem({
    id: "recovery-implementation-planning",
    title: "82,413-record Implementation Planning",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-implementation-plan-envelope.ts",
    branch: "feature/recovery-implementation-planning-envelopes-20260830",
    pr: 365,
    headRevision: "ae1d8e49c5fc4eacfc508e614001f96826a046a7",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33335538920",
    testedAt: "2026-08-30T21:11:46.000Z",
    auditReference: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33335538920/artifacts/9738960314",
    evidence: [
      "records:82413",
      "partitions:165",
      "planning_ready_idea:31779",
      "blocked_governed_hold:355",
      "blocked_recursive_provenance:50279",
      "artifact_bytes:40581214",
      "artifact_sha256:90b3038693eee649efbea82df5a377ed55abeeef3a9ef720e070a03deda94726",
    ],
  }),
  testedPullRequestItem({
    id: "recovery-sovereign-build-dispatch",
    title: "82,413-record Sovereign Build Dispatch",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-sovereign-build-dispatch.ts",
    branch: "feature/recovery-sovereign-build-dispatch-20260831",
    pr: 366,
    headRevision: "cc47f2ca9dd5bd783020ea2e2a6a09d5deb25f18",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33338614570",
    testedAt: "2026-08-30T22:18:58.000Z",
    auditReference: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33338614570/artifacts/9739867022",
    evidence: [
      "records:82413",
      "canonical_build_orders:279",
      "awaiting_owner:279",
      "execution_ready:0",
      "agent_grants:0",
      "artifact_bytes:30669834",
      "artifact_sha256:77d4bc569f8459011c6989d5e5d304125b16422588d5196d7903f1ef269520d9",
    ],
  }),
  testedPullRequestItem({
    id: "recovery-founder-build-order-surface",
    title: "82,413-record Founder Build Order Surface",
    domain: "owner_control",
    source: "app/owner/control/implementation/recovery-build-orders/page.tsx",
    branch: "feature/recovery-owner-build-order-surface-20260831",
    pr: 368,
    headRevision: "1e41f50bd8c011fac5efebf84acfed43e94571df",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33349937265",
    testedAt: "2026-08-31T02:16:28.000Z",
    auditReference: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33349937265/artifacts/9743312025",
    evidence: [
      "records:82413",
      "classified_members:31779",
      "canonical_build_orders:279",
      "awaiting_owner:279",
      "execution_ready:0",
      "agent_grants:0",
      "visibility:founder_only_aal2",
      "build_order_index_sha256:5a9b0f5a83ea571e2d1e27489f581219af5c7569d7cd1b802c42154dc73324b4",
      "artifact_bytes:30669834",
      "artifact_sha256:2ebb264b4a02d65e90f69debe0f0db579e0867561b882b84b8e699fbdae7e2b5",
    ],
  }),
  testedPullRequestItem({
    id: "recovery-sovereign-build-readiness",
    title: "82,413-record Sovereign Build Readiness",
    domain: "recovery",
    source: "core/recovery/pantavion-recovery-build-readiness.ts",
    branch: "feature/recovery-build-readiness-20260831",
    pr: 369,
    headRevision: "3df028c52a9d7d087bbe0c04e22a51cf40d94a8b",
    testRun: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33353191073",
    testedAt: "2026-08-31T03:18:31.000Z",
    auditReference: "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33353191073/artifacts/9744346952",
    evidence: [
      "records:82413",
      "classified_members:31779",
      "readiness_packets:279",
      "risk_critical:152",
      "risk_high:90",
      "risk_medium:37",
      "technology_hold:279",
      "awaiting_owner:279",
      "execution_ready:0",
      "agent_grants:0",
      "edge_eligible:0",
      "readiness_index_sha256:4b5c433871adf6b8579df35b5658995f5d0639c0a87a73bc3876f528ac780b49",
      "terminal_readiness_sha256:c518e30c4276ddcf77481e0e23f8556a015b59ab1a08ab75501d95eb69f1c1b5",
      "artifact_bytes:30754729",
      "artifact_sha256:de59b1687f78ba6b198379a0a654eb3b05af0a796e4c38a54028254eb98af7ea",
    ],
  }),
  {
    id: "production-verification",
    title: "Production verification",
    domain: "release",
    state: "blocked",
    source: "owner_green_light",
    blocker: "Factory PR #315 and recovery/runtime PRs #352-#362 are MERGED only; merge evidence is not deployment or live evidence. PRs #363-#369 are TESTED and unmerged. Production progression requires explicit founder authorization, VERCEL_TOKEN for the scheduler repair path, exact deployed revision, authenticated E2E, RLS isolation, rollback and audit evidence.",
    updatedAt: "2026-08-31T03:18:31.000Z",
  },
];

export const implementationSyncDoctrine = {
  title: "Pantavion Automatic Implementation Synchronization",
  rule:
    "Every capability, module, agent, kernel, migration and deployment publishes evidence into the shared registry. The founder surface reads registry truth and never infers completion from code alone.",
  truthChain: ["idea", "coded", "tested", "merged", "deployed", "verified_live"] as const,
  blockedRule:
    "A blocked path remains visible with its exact blocker while independent safe work continues.",
  releaseRule:
    "No public exposure, production mutation, deployment or VERIFIED_LIVE transition occurs without explicit founder authorization and the required evidence chain.",
};
