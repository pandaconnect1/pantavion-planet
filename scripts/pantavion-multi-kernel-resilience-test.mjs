import assert from "node:assert/strict";
import {
  canReassignKernelTask,
  electKernelLeader,
  reassignKernelTaskLease,
} from "../kernel/resilience.ts";

const now = Date.parse("2026-08-27T14:00:00.000Z");
const heartbeatTimeoutMs = 30_000;
const policy = { heartbeatTimeoutMs, minimumHealthyVoters: 2 };

const healthy = (id, role, priority, secondsAgo = 1, epoch = 7) => ({
  id,
  role,
  status: "healthy",
  priority,
  epoch,
  lastHeartbeatAt: new Date(now - secondsAgo * 1000).toISOString(),
});

const steady = electKernelLeader(
  [healthy("leader-a", "leader", 100), healthy("standby-b", "standby", 90)],
  "leader-a",
  policy,
  now
);
assert.equal(steady.leaderId, "leader-a");
assert.equal(steady.changed, false);
assert.equal(steady.reason, "leader_healthy");

const failedLeader = {
  ...healthy("leader-a", "leader", 100, 120),
  status: "unreachable",
};
const failover = electKernelLeader(
  [failedLeader, healthy("standby-b", "standby", 90), healthy("supervisor-c", "supervisor", 80)],
  "leader-a",
  policy,
  now
);
assert.equal(failover.leaderId, "standby-b");
assert.equal(failover.changed, true);
assert.equal(failover.reason, "leader_failed");
assert.equal(failover.epoch, 8);

const noQuorum = electKernelLeader(
  [failedLeader, healthy("standby-b", "standby", 90)],
  "leader-a",
  policy,
  now
);
assert.equal(noQuorum.leaderId, null);
assert.equal(noQuorum.reason, "quorum_unavailable");

const lease = {
  taskId: "task-1",
  ownerNodeId: "leader-a",
  checkpointId: "checkpoint-17",
  leaseExpiresAt: new Date(now - 1_000).toISOString(),
  idempotencyKey: "task-1:attempt-1",
};
assert.equal(canReassignKernelTask(lease, now), true);
const reassigned = reassignKernelTaskLease(lease, "standby-b", 60_000, now);
assert.equal(reassigned.ownerNodeId, "standby-b");
assert.equal(reassigned.checkpointId, "checkpoint-17");
assert.equal(reassigned.idempotencyKey, lease.idempotencyKey);
assert.equal(reassigned.leaseExpiresAt, new Date(now + 60_000).toISOString());

console.log("Pantavion multi-kernel resilience contract: PASS");
