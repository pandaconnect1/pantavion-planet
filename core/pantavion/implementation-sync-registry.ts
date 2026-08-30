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

const codedAt = "2026-08-27T20:45:00.000Z";
const testedAt = "2026-08-29T23:09:32.000Z";
const branch = "feature/sovereign-technology-factory-foundation";
const sovereignContractRun =
  "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33280225764";
const sovereignKernelIntegrationRun =
  "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33280225764";
const sovereignKernelTestedAt = "2026-08-29T23:09:32.000Z";

function codedItem(
  id: string,
  title: string,
  domain: string,
  source: string,
): ImplementationSyncItem {
  return {
    id,
    title,
    domain,
    state: "coded",
    source,
    branch,
    pr: 315,
    evidenceRecords: [{ kind: "code", reference: source, recordedAt: codedAt }],
    updatedAt: codedAt,
  };
}

function testedItem(
  id: string,
  title: string,
  domain: string,
  source: string,
): ImplementationSyncItem {
  const coded = codedItem(id, title, domain, source);
  return {
    ...coded,
    state: "tested",
    evidenceRecords: [
      ...(coded.evidenceRecords ?? []),
      {
        kind: "test",
        reference: sovereignContractRun,
        recordedAt: testedAt,
        revision: "53e04cc0e222fd6651c5559fca85f50791780d95",
      },
    ],
    updatedAt: testedAt,
  };
}

function testedKernelItem(): ImplementationSyncItem {
  const coded = codedItem(
    "sovereign-capability-kernel",
    "Sovereign Capability Kernel",
    "kernel",
    "core/sovereign/sovereign-capability-kernel.ts",
  );
  return {
    ...coded,
    state: "tested",
    evidenceRecords: [
      ...(coded.evidenceRecords ?? []),
      {
        kind: "test",
        reference: sovereignKernelIntegrationRun,
        recordedAt: sovereignKernelTestedAt,
        revision: "53e04cc0e222fd6651c5559fca85f50791780d95",
      },
    ],
    updatedAt: sovereignKernelTestedAt,
  };
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
  testedItem("sovereign-technology-factory", "Sovereign Technology Factory", "sovereign", "core/sovereign/technology-factory.ts"),
  testedItem("intent-to-outcome-fabric", "Intent-to-Outcome Fabric", "sovereign", "core/sovereign/intent-to-outcome-fabric.ts"),
  testedItem("ephemeral-agent-swarm", "Ephemeral Agent Swarm", "sovereign", "core/sovereign/ephemeral-agent-swarm.ts"),
  testedItem("intent-firewall", "Intent Firewall", "sovereign", "core/sovereign/intent-firewall.ts"),
  testedItem("agent-capability-budget", "Agent Capability & Budget Control", "sovereign", "core/sovereign/agent-capability-budget-control.ts"),
  testedItem("disconnected-edge-execution", "Disconnected / Edge Execution", "sovereign", "core/sovereign/edge-execution.ts"),
  testedItem("technology-library", "Technology Library", "sovereign", "core/sovereign/technology-library.ts"),
  {
    id: "bounded-execution-runtime",
    title: "Receipt-chained Bounded Execution Runtime",
    domain: "runtime",
    state: "tested",
    source: "core/sovereign/bounded-execution-runtime.ts",
    branch,
    pr: 315,
    evidenceRecords: [
      {
        kind: "code",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/commit/51175ae4d03c8c063ab5377e46db82976d913f7b",
        recordedAt: "2026-08-30T00:06:28.000Z",
        revision: "51175ae4d03c8c063ab5377e46db82976d913f7b",
      },
      {
        kind: "test",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33282528541",
        recordedAt: "2026-08-30T00:08:47.000Z",
        revision: "51175ae4d03c8c063ab5377e46db82976d913f7b",
      },
    ],
    updatedAt: "2026-08-30T00:08:47.000Z",
  },
  {
    id: "bounded-execution-checkpointing",
    title: "Fenced Bounded Execution Checkpointing",
    domain: "runtime",
    state: "tested",
    source: "core/sovereign/bounded-execution-runtime.ts",
    branch,
    pr: 315,
    evidenceRecords: [
      {
        kind: "code",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/commit/8bf3aa0441850b42a5b580ca6068b2619fe0ff3c",
        recordedAt: "2026-08-30T03:54:09.000Z",
        revision: "8bf3aa0441850b42a5b580ca6068b2619fe0ff3c",
      },
      {
        kind: "test",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33291312449",
        recordedAt: "2026-08-30T03:56:05.000Z",
        revision: "8bf3aa0441850b42a5b580ca6068b2619fe0ff3c",
      },
    ],
    updatedAt: "2026-08-30T03:56:05.000Z",
  },
  {
    id: "durable-bounded-execution-coordinator",
    title: "Durable Fenced Bounded Execution Recovery",
    domain: "runtime",
    state: "tested",
    source: "core/sovereign/durable-bounded-execution-coordinator.ts",
    branch,
    pr: 315,
    evidenceRecords: [
      {
        kind: "code",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/commit/6298cd0c1784a807646978dbf32fdda05466b97b",
        recordedAt: "2026-08-30T05:05:40.000Z",
        revision: "6298cd0c1784a807646978dbf32fdda05466b97b",
      },
      {
        kind: "test",
        reference:
          "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33293928901",
        recordedAt: "2026-08-30T05:07:57.000Z",
        revision: "6298cd0c1784a807646978dbf32fdda05466b97b",
      },
    ],
    updatedAt: "2026-08-30T05:07:57.000Z",
  },
  testedKernelItem(),
  testedItem("implementation-sync", "Automatic Implementation Sync", "kernel", "core/pantavion/implementation-sync-registry.ts"),
  testedItem("owner-implementation-surface", "Founder-only Implementation Truth", "owner_control", "app/owner/control/implementation/page.tsx"),
  {
    id: "production-verification",
    title: "Production verification",
    domain: "release",
    state: "blocked",
    source: "owner_green_light",
    blocker: "Factory PR #315 is TESTED but unmerged. Current-main production health does not prove these Factory files are deployed; founder approval, exact Factory deployment revision, authenticated E2E, isolation, rollback and audit evidence remain required.",
    updatedAt: codedAt,
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