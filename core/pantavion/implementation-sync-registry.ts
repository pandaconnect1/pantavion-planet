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

export function requiredEvidenceForState(state: ImplementationState): ImplementationEvidenceKind[] {
  return state === "blocked" ? [] : [...requiredEvidence[state]];
}

export function validateImplementationTruth(item: ImplementationSyncItem): string[] {
  const blockers: string[] = [];
  if (!item.id.trim() || !item.title.trim() || !item.source.trim()) blockers.push("identity_or_source_missing");
  if (!Number.isFinite(Date.parse(item.updatedAt))) blockers.push("updated_at_invalid");
  if (item.state === "blocked") {
    if (!item.blocker?.trim()) blockers.push("blocked_state_without_blocker");
    return blockers;
  }

  const evidenceKinds = new Set((item.evidenceRecords ?? []).map((record) => record.kind));
  for (const required of requiredEvidence[item.state]) {
    if (!evidenceKinds.has(required)) blockers.push(`evidence_missing:${required}`);
  }
  if (item.state === "deployed" || item.state === "verified_live") {
    const exactRevision = (item.evidenceRecords ?? []).find((record) => record.kind === "exact_revision");
    if (!exactRevision?.revision?.trim()) blockers.push("exact_deployed_revision_missing");
  }
  return blockers;
}

export function canAdvanceImplementationState(
  current: ImplementationState,
  next: ImplementationState,
) {
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
    throw new Error(`invalid implementation transition:${current.state}->${next}`);
  }
  const candidate: ImplementationSyncItem = {
    ...current,
    state: next,
    evidenceRecords: [...(current.evidenceRecords ?? []), ...evidenceRecords],
    updatedAt,
  };
  const blockers = validateImplementationTruth(candidate);
  if (blockers.length) throw new Error(`implementation truth rejected:${blockers.join(",")}`);
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
      ? { ...item, state: "blocked" as const, blocker: `truth_gate:${truthBlockers.join("|")}` }
      : item;
    const existing = merged.get(safeItem.id);
    if (!existing) {
      merged.set(safeItem.id, safeItem);
      continue;
    }

    const incomingRank = stateRank(safeItem.state);
    const existingRank = stateRank(existing.state);
    const newer = Date.parse(safeItem.updatedAt) >= Date.parse(existing.updatedAt);
    const mergedEvidenceRecords = [...(existing.evidenceRecords ?? []), ...(safeItem.evidenceRecords ?? [])]
      .filter((record, index, all) =>
        all.findIndex((candidate) =>
          candidate.kind === record.kind &&
          candidate.reference === record.reference &&
          candidate.revision === record.revision,
        ) === index,
      );

    if (incomingRank > existingRank || (incomingRank === existingRank && newer)) {
      merged.set(safeItem.id, {
        ...existing,
        ...safeItem,
        evidence: [...new Set([...(existing.evidence ?? []), ...(safeItem.evidence ?? [])])],
        evidenceRecords: mergedEvidenceRecords,
      });
    } else {
      merged.set(safeItem.id, {
        ...existing,
        evidence: [...new Set([...(existing.evidence ?? []), ...(safeItem.evidence ?? [])])],
        evidenceRecords: mergedEvidenceRecords,
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const codedAt = "2026-08-27T20:45:00.000Z";
const testedAt = "2026-08-27T23:06:30.000Z";
const branch = "feature/sovereign-technology-factory-foundation";
const sovereignContractRun =
  "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33124896375";
const sovereignKernelIntegrationRun =
  "https://github.com/pandaconnect1/pantavion-planet/actions/runs/33125460286";
const sovereignKernelTestedAt = "2026-08-27T23:13:36.164Z";

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
        revision: "ab1800acfa6261a874949ed8a20b134379a7df5d",
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
        revision: "73cbfb22d5fff8e66965f59f92f2df18c44dbc72",
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
  testedItem("sovereign-technology-factory", "Sovereign Technology Factory", "sovereign", "core/sovereign/technology-factory.ts"),
  testedItem("intent-to-outcome-fabric", "Intent-to-Outcome Fabric", "sovereign", "core/sovereign/intent-to-outcome-fabric.ts"),
  testedItem("ephemeral-agent-swarm", "Ephemeral Agent Swarm", "sovereign", "core/sovereign/ephemeral-agent-swarm.ts"),
  testedItem("intent-firewall", "Intent Firewall", "sovereign", "core/sovereign/intent-firewall.ts"),
  testedItem("agent-capability-budget", "Agent Capability & Budget Control", "sovereign", "core/sovereign/agent-capability-budget-control.ts"),
  testedItem("disconnected-edge-execution", "Disconnected / Edge Execution", "sovereign", "core/sovereign/edge-execution.ts"),
  testedItem("technology-library", "Technology Library", "sovereign", "core/sovereign/technology-library.ts"),
  testedKernelItem(),
  testedItem("implementation-sync", "Automatic Implementation Sync", "kernel", "core/pantavion/implementation-sync-registry.ts"),
  testedItem("owner-implementation-surface", "Founder-only Implementation Truth", "owner_control", "app/owner/control/implementation/page.tsx"),
  {
    id: "production-verification",
    title: "Production verification",
    domain: "release",
    state: "blocked",
    source: "owner_green_light",
    blocker: "Factory PR #315 is TESTED but unmerged; founder approval, exact deployment revision and live evidence do not exist.",
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