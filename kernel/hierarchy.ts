export type KernelTier =
  | "root"
  | "governance"
  | "research"
  | "domain_supervisor"
  | "topic_supervisor"
  | "user_kernel"
  | "specialist"
  | "worker";

export interface KernelHierarchyNode {
  id: string;
  tier: KernelTier;
  parentId: string | null;
  domain?: string;
  topic?: string;
  jurisdiction?: string;
  ageBand?: string;
  capabilities: string[];
  healthy: boolean;
  priority: number;
}

export interface KernelEscalationRequest {
  fromNodeId: string;
  reason: "no_solution" | "policy_conflict" | "capacity" | "uncertain_truth" | "jurisdiction";
  requiredCapabilities?: string[];
}

export interface KernelHierarchyDecision {
  targetNodeId: string | null;
  path: string[];
  reason: string;
}

const byPriority = (a: KernelHierarchyNode, b: KernelHierarchyNode) =>
  b.priority - a.priority || a.id.localeCompare(b.id);

export const getAncestors = (
  nodes: KernelHierarchyNode[],
  startNodeId: string
): KernelHierarchyNode[] => {
  const map = new Map(nodes.map((node) => [node.id, node]));
  const result: KernelHierarchyNode[] = [];
  let current = map.get(startNodeId);
  const seen = new Set<string>();

  while (current?.parentId) {
    if (seen.has(current.parentId)) break;
    seen.add(current.parentId);
    const parent = map.get(current.parentId);
    if (!parent) break;
    result.push(parent);
    current = parent;
  }

  return result;
};

export const routeEscalation = (
  nodes: KernelHierarchyNode[],
  request: KernelEscalationRequest
): KernelHierarchyDecision => {
  const origin = nodes.find((node) => node.id === request.fromNodeId);
  if (!origin) {
    return { targetNodeId: null, path: [], reason: "origin_not_found" };
  }

  const ancestors = getAncestors(nodes, origin.id);
  const required = new Set(request.requiredCapabilities ?? []);
  const eligible = ancestors
    .filter((node) => node.healthy)
    .filter((node) => required.size === 0 || [...required].every((cap) => node.capabilities.includes(cap)))
    .sort(byPriority);

  const target = eligible[0] ?? ancestors.find((node) => node.healthy) ?? null;

  return {
    targetNodeId: target?.id ?? null,
    path: [origin.id, ...ancestors.map((node) => node.id)],
    reason: target ? `escalated:${request.reason}` : "no_healthy_supervisor",
  };
};

export const selectUserServingPath = (
  nodes: KernelHierarchyNode[],
  params: {
    domain: string;
    topic?: string;
    jurisdiction?: string;
    ageBand?: string;
    requiredCapabilities?: string[];
  }
): KernelHierarchyNode[] => {
  const required = new Set(params.requiredCapabilities ?? []);

  return nodes
    .filter((node) => node.healthy)
    .filter((node) => !node.domain || node.domain === params.domain)
    .filter((node) => !node.topic || !params.topic || node.topic === params.topic)
    .filter((node) => !node.jurisdiction || !params.jurisdiction || node.jurisdiction === params.jurisdiction)
    .filter((node) => !node.ageBand || !params.ageBand || node.ageBand === params.ageBand)
    .filter((node) => required.size === 0 || [...required].every((cap) => node.capabilities.includes(cap)))
    .sort((a, b) => {
      const tierOrder: Record<KernelTier, number> = {
        root: 0,
        governance: 1,
        research: 2,
        domain_supervisor: 3,
        topic_supervisor: 4,
        user_kernel: 5,
        specialist: 6,
        worker: 7,
      };
      return tierOrder[a.tier] - tierOrder[b.tier] || byPriority(a, b);
    });
};

export const validateHierarchy = (nodes: KernelHierarchyNode[]): string[] => {
  const issues: string[] = [];
  const ids = new Set(nodes.map((node) => node.id));
  const roots = nodes.filter((node) => node.tier === "root");
  if (roots.length !== 1) issues.push(`expected_exactly_one_root:${roots.length}`);

  for (const node of nodes) {
    if (node.tier !== "root" && !node.parentId) issues.push(`missing_parent:${node.id}`);
    if (node.parentId && !ids.has(node.parentId)) issues.push(`unknown_parent:${node.id}:${node.parentId}`);
    if (node.parentId === node.id) issues.push(`self_parent:${node.id}`);
  }

  return issues;
};
