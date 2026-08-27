export type KernelNodeRole = "leader" | "standby" | "supervisor" | "worker";
export type KernelNodeStatus = "healthy" | "degraded" | "unreachable" | "quarantined";

export interface KernelNodeHealth {
  id: string;
  role: KernelNodeRole;
  status: KernelNodeStatus;
  priority: number;
  epoch: number;
  lastHeartbeatAt: string;
  parentId?: string;
}

export interface KernelElectionPolicy {
  heartbeatTimeoutMs: number;
  minimumHealthyVoters: number;
}

export interface KernelElectionResult {
  leaderId: string | null;
  previousLeaderId: string | null;
  changed: boolean;
  reason:
    | "leader_healthy"
    | "leader_failed"
    | "quorum_unavailable"
    | "no_eligible_candidate";
  epoch: number;
}

export interface KernelTaskLease {
  taskId: string;
  ownerNodeId: string;
  checkpointId?: string;
  leaseExpiresAt: string;
  idempotencyKey: string;
}

const parseMillis = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isKernelNodeHealthy = (
  node: KernelNodeHealth,
  nowMs: number,
  heartbeatTimeoutMs: number
): boolean => {
  if (node.status !== "healthy") return false;
  return nowMs - parseMillis(node.lastHeartbeatAt) <= heartbeatTimeoutMs;
};

const compareCandidates = (a: KernelNodeHealth, b: KernelNodeHealth): number => {
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.epoch !== b.epoch) return b.epoch - a.epoch;
  return a.id.localeCompare(b.id);
};

/**
 * Deterministic failover decision.
 *
 * This function does not perform distributed consensus by itself. It provides
 * the deterministic election policy used by the runtime once membership and
 * quorum observations have been collected by the durable control plane.
 */
export const electKernelLeader = (
  nodes: KernelNodeHealth[],
  currentLeaderId: string | null,
  policy: KernelElectionPolicy,
  nowMs = Date.now()
): KernelElectionResult => {
  const healthyVoters = nodes.filter((node) =>
    isKernelNodeHealthy(node, nowMs, policy.heartbeatTimeoutMs)
  );

  const currentLeader = currentLeaderId
    ? healthyVoters.find((node) => node.id === currentLeaderId && node.role === "leader")
    : undefined;

  const maxEpoch = nodes.reduce((max, node) => Math.max(max, node.epoch), 0);

  if (healthyVoters.length < policy.minimumHealthyVoters) {
    return {
      leaderId: null,
      previousLeaderId: currentLeaderId,
      changed: currentLeaderId !== null,
      reason: "quorum_unavailable",
      epoch: maxEpoch,
    };
  }

  if (currentLeader) {
    return {
      leaderId: currentLeader.id,
      previousLeaderId: currentLeaderId,
      changed: false,
      reason: "leader_healthy",
      epoch: Math.max(maxEpoch, currentLeader.epoch),
    };
  }

  const eligible = healthyVoters
    .filter((node) => node.role === "standby" || node.role === "supervisor" || node.role === "leader")
    .sort(compareCandidates);

  const winner = eligible[0];
  if (!winner) {
    return {
      leaderId: null,
      previousLeaderId: currentLeaderId,
      changed: currentLeaderId !== null,
      reason: "no_eligible_candidate",
      epoch: maxEpoch,
    };
  }

  return {
    leaderId: winner.id,
    previousLeaderId: currentLeaderId,
    changed: winner.id !== currentLeaderId,
    reason: currentLeaderId ? "leader_failed" : "no_eligible_candidate",
    epoch: maxEpoch + 1,
  };
};

export const canReassignKernelTask = (
  lease: KernelTaskLease,
  nowMs = Date.now()
): boolean => nowMs >= parseMillis(lease.leaseExpiresAt);

export const reassignKernelTaskLease = (
  lease: KernelTaskLease,
  nextOwnerNodeId: string,
  leaseDurationMs: number,
  nowMs = Date.now()
): KernelTaskLease => {
  if (!nextOwnerNodeId.trim()) {
    throw new Error("nextOwnerNodeId is required");
  }
  if (leaseDurationMs <= 0) {
    throw new Error("leaseDurationMs must be positive");
  }
  if (!canReassignKernelTask(lease, nowMs)) {
    throw new Error("task lease is still active");
  }

  return {
    ...lease,
    ownerNodeId: nextOwnerNodeId,
    leaseExpiresAt: new Date(nowMs + leaseDurationMs).toISOString(),
  };
};
