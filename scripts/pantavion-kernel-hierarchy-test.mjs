import assert from "node:assert/strict";
import {
  routeEscalation,
  selectUserServingPath,
  validateHierarchy,
} from "../kernel/hierarchy.ts";

const nodes = [
  { id: "root", tier: "root", parentId: null, capabilities: ["final-governance"], healthy: true, priority: 100 },
  { id: "governance", tier: "governance", parentId: "root", capabilities: ["policy", "jurisdiction", "age-safety"], healthy: true, priority: 95 },
  { id: "research", tier: "research", parentId: "root", capabilities: ["research", "libraries", "technology-sync"], healthy: true, priority: 90 },
  { id: "social-domain", tier: "domain_supervisor", parentId: "governance", domain: "social", capabilities: ["policy", "social"], healthy: true, priority: 80 },
  { id: "translation-topic", tier: "topic_supervisor", parentId: "social-domain", domain: "social", topic: "translation", capabilities: ["translation", "social"], healthy: true, priority: 75 },
  { id: "user-1", tier: "user_kernel", parentId: "translation-topic", domain: "social", topic: "translation", jurisdiction: "CY", ageBand: "adult", capabilities: ["translation"], healthy: true, priority: 70 },
  { id: "specialist-1", tier: "specialist", parentId: "user-1", domain: "social", topic: "translation", capabilities: ["translation"], healthy: true, priority: 60 },
  { id: "worker-1", tier: "worker", parentId: "specialist-1", domain: "social", topic: "translation", capabilities: ["translation"], healthy: true, priority: 50 },
];

assert.deepEqual(validateHierarchy(nodes), []);

const serving = selectUserServingPath(nodes, {
  domain: "social",
  topic: "translation",
  jurisdiction: "CY",
  ageBand: "adult",
  requiredCapabilities: ["translation"],
});
assert.ok(serving.some((node) => node.id === "user-1"));
assert.ok(serving.some((node) => node.id === "translation-topic"));

const escalation = routeEscalation(nodes, {
  fromNodeId: "user-1",
  reason: "no_solution",
  requiredCapabilities: ["translation"],
});
assert.equal(escalation.targetNodeId, "translation-topic");
assert.deepEqual(escalation.path.slice(0, 3), ["user-1", "translation-topic", "social-domain"]);

const governanceEscalation = routeEscalation(nodes, {
  fromNodeId: "social-domain",
  reason: "policy_conflict",
  requiredCapabilities: ["policy"],
});
assert.equal(governanceEscalation.targetNodeId, "governance");

console.log("Pantavion kernel hierarchy contract: PASS");
