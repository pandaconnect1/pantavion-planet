import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { admitKernelWork, validateKernel, type KernelDefinition, type KernelWork } from "./pantavion-kernel-federation-policy";

const kernel: KernelDefinition = {
  id: "water", purpose: "Water engineering", owner: "founder",
  allowedDataClasses: ["public", "internal"], leadRoles: ["research", "safety"],
  maxConcurrentAgents: 3, monthlyBudgetUnits: 100, active: true,
};
const work: KernelWork = { id: "job-1", kernelId: "water", dataClasses: ["internal"], risk: "sandbox_code" };
const input = { kernels: [kernel], work, activeJobs: 1, consumedBudgetUnits: 10, estimatedCostUnits: 20 };

describe("kernel federation admission", () => {
  it("admits bounded in-scope jobs", () => {
    assert.deepEqual(admitKernelWork(input), { allowed: true, kernelId: "water", remainingSlots: 1 });
  });
  it("denies unknown and inactive kernels", () => {
    assert.deepEqual(admitKernelWork({...input, work: {...work, kernelId: "missing"}}), {allowed: false, reason: "unknown_kernel"});
    assert.deepEqual(admitKernelWork({...input, kernels: [{...kernel, active: false}]}), {allowed: false, reason: "inactive_kernel"});
  });
  it("denies cross-kernel data access", () => {
    assert.deepEqual(admitKernelWork({...input, work: {...work, dataClasses: ["restricted"]}}), {allowed: false, reason: "data_scope_denied"});
  });
  it("denies protected changes even with an unverified approval reference", () => {
    assert.deepEqual(admitKernelWork({...input, work: {...work, risk: "protected_change", approvalRef: "unverified"}}), {allowed: false, reason: "approval_required"});
  });
  it("denies capacity exhaustion", () => {
    assert.deepEqual(admitKernelWork({...input, activeJobs: 3}), {allowed: false, reason: "capacity_exhausted"});
  });
  it("denies exhausted budgets", () => {
    assert.deepEqual(admitKernelWork({...input, consumedBudgetUnits: 90}), {allowed: false, reason: "budget_exhausted"});
  });
  it("denies malformed governance", () => {
    assert.ok(validateKernel({...kernel, maxConcurrentAgents: 0}).includes("invalid_concurrency"));
    assert.deepEqual(admitKernelWork({...input, kernels: [{...kernel, owner: ""}]}), {allowed: false, reason: "invalid_kernel"});
  });
});
