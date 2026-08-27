import assert from "node:assert/strict";
import {
  planParallelKernelDispatch,
  selectReadyKernelTasks,
  validateKernelTaskGraph,
} from "../kernel/nervous-system.ts";

const now = Date.parse("2026-08-27T15:40:00.000Z");

const tasks = [
  {
    taskId: "recover",
    dependencies: [],
    requiredCapabilities: ["recovery"],
    priority: 100,
    status: "succeeded",
    idempotencyKey: "recover:v1",
  },
  {
    taskId: "classify-a",
    dependencies: ["recover"],
    requiredCapabilities: ["classification"],
    priority: 90,
    status: "queued",
    idempotencyKey: "classify-a:v1",
    checkpointId: "cp-a-3",
  },
  {
    taskId: "classify-b",
    dependencies: ["recover"],
    requiredCapabilities: ["classification"],
    priority: 80,
    status: "queued",
    idempotencyKey: "classify-b:v1",
  },
  {
    taskId: "merge",
    dependencies: ["classify-a", "classify-b"],
    requiredCapabilities: ["merge"],
    priority: 70,
    status: "queued",
    idempotencyKey: "merge:v1",
  },
];

assert.deepEqual(validateKernelTaskGraph(tasks), []);
assert.deepEqual(
  selectReadyKernelTasks(tasks).map((task) => task.taskId),
  ["classify-a", "classify-b"],
);

const workers = [
  {
    id: "worker-a",
    capabilities: ["classification"],
    healthy: true,
    capacity: 1,
    activeTasks: 0,
    priority: 90,
  },
  {
    id: "worker-b",
    capabilities: ["classification", "merge"],
    healthy: true,
    capacity: 2,
    activeTasks: 0,
    priority: 80,
  },
  {
    id: "worker-c",
    capabilities: ["classification"],
    healthy: false,
    capacity: 10,
    activeTasks: 0,
    priority: 100,
  },
];

const plan = planParallelKernelDispatch(tasks, workers, 60_000, now);
assert.equal(plan.assignments.length, 2);
assert.deepEqual(plan.unassignedTaskIds, []);
assert.deepEqual(
  plan.assignments.map((assignment) => assignment.taskId),
  ["classify-a", "classify-b"],
);
assert.equal(plan.assignments[0].workerId, "worker-a");
assert.equal(plan.assignments[1].workerId, "worker-b");
assert.equal(plan.assignments[0].checkpointId, "cp-a-3");
assert.equal(plan.assignments[0].idempotencyKey, "classify-a:v1");
assert.equal(plan.assignments[0].leaseExpiresAt, new Date(now + 60_000).toISOString());

const constrained = planParallelKernelDispatch(
  tasks,
  [{ ...workers[0], capacity: 1 }],
  60_000,
  now,
);
assert.equal(constrained.assignments.length, 1);
assert.deepEqual(constrained.unassignedTaskIds, ["classify-b"]);

const cyclic = [
  {
    taskId: "a",
    dependencies: ["b"],
    requiredCapabilities: [],
    priority: 1,
    status: "queued",
    idempotencyKey: "a:v1",
  },
  {
    taskId: "b",
    dependencies: ["a"],
    requiredCapabilities: [],
    priority: 1,
    status: "queued",
    idempotencyKey: "b:v1",
  },
];
assert.ok(validateKernelTaskGraph(cyclic).some((issue) => issue.startsWith("dependency_cycle:")));

console.log("Pantavion kernel nervous-system contract: PASS");
