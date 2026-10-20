import { describe, expect, it } from "vitest";
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
    expect(admitKernelWork(input)).toEqual({ allowed: true, kernelId: "water", remainingSlots: 1 });
  });
  it("denies unknown and inactive kernels", () => {
    expect(admitKernelWork({...input, work: {...work, kernelId: "missing"}})).toEqual({allowed: false, reason: "unknown_kernel"});
    expect(admitKernelWork({...input, kernels: [{...kernel, active: false}]})).toEqual({allowed: false, reason: "inactive_kernel"});
  });
  it("denies cross-kernel data access", () => {
    expect(admitKernelWork({...input, work: {...work, dataClasses: ["restricted"]}})).toEqual({allowed: false, reason: "data_scope_denied"});
  });
  it("denies protected changes even when an unverified approval reference is supplied", () => {
    expect(admitKernelWork({...input, work: {...work, risk: "protected_change", approvalRef: "unverified"}})).toEqual({allowed: false, reason: "approval_required"});
  });
  it("denies capacity exhaustion", () => {
    expect(admitKernelWork({...input, activeJobs: 3})).toEqual({allowed: false, reason: "capacity_exhausted"});
  });
  it("denies exhausted budgets", () => {
    expect(admitKernelWork({...input, consumedBudgetUnits: 90})).toEqual({allowed: false, reason: "budget_exhausted"});
  });
  it("denies malformed governance", () => {
    expect(validateKernel({...kernel, maxConcurrentAgents: 0})).toContain("invalid_concurrency");
    expect(admitKernelWork({...input, kernels: [{...kernel, owner: ""}]})).toEqual({allowed: false, reason: "invalid_kernel"});
  });
});
