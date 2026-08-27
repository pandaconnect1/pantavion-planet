export type ImplementationState =
  | "idea"
  | "coded"
  | "tested"
  | "merged"
  | "deployed"
  | "verified_live"
  | "blocked";

export type ImplementationSyncItem = {
  id: string;
  title: string;
  domain: string;
  state: ImplementationState;
  source: string;
  branch?: string;
  pr?: number;
  evidence?: string[];
  blocker?: string;
  updatedAt: string;
};

const stateOrder: ImplementationState[] = [
  "idea",
  "coded",
  "tested",
  "merged",
  "deployed",
  "verified_live",
];

export function canAdvanceImplementationState(
  current: ImplementationState,
  next: ImplementationState,
) {
  if (next === "blocked") return true;
  if (current === "blocked") return next !== "idea";
  return stateOrder.indexOf(next) >= stateOrder.indexOf(current);
}

export function synchronizeImplementationItems(
  ...sources: ImplementationSyncItem[][]
): ImplementationSyncItem[] {
  const merged = new Map<string, ImplementationSyncItem>();

  for (const item of sources.flat()) {
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
      continue;
    }

    const existingRank = existing.state === "blocked" ? -1 : stateOrder.indexOf(existing.state);
    const incomingRank = item.state === "blocked" ? -1 : stateOrder.indexOf(item.state);
    const newer = Date.parse(item.updatedAt) >= Date.parse(existing.updatedAt);

    if (incomingRank > existingRank || (incomingRank === existingRank && newer)) {
      merged.set(item.id, {
        ...existing,
        ...item,
        evidence: Array.from(new Set([...(existing.evidence ?? []), ...(item.evidence ?? [])])),
      });
    } else if (item.evidence?.length) {
      merged.set(item.id, {
        ...existing,
        evidence: Array.from(new Set([...(existing.evidence ?? []), ...item.evidence])),
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const implementationSyncDoctrine = {
  title: "Pantavion Automatic Implementation Synchronization",
  rule:
    "Every capability, module, agent, kernel, migration and deployment must publish its implementation state into the shared registry. The owner surface reads registry truth instead of manually maintained completion claims.",
  truthChain: ["idea", "coded", "tested", "merged", "deployed", "verified_live"] as const,
  blockedRule:
    "A blocked path remains visible with its blocker while independent work continues.",
};
