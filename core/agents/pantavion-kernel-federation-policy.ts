/**
 * Pure, server-safe Kernel federation admission and dispatch policy.
 * This module does not start workers or grant access to protected data.
 */
export type KernelDefinition = {
  id: string;
  purpose: string;
  owner: string;
  allowedDataClasses: readonly string[];
  leadRoles: readonly string[];
  maxConcurrentAgents: number;
  monthlyBudgetUnits: number;
  active: boolean;
};
export type KernelWork = {
  id: string;
  kernelId: string;
  dataClasses: readonly string[];
  risk: "read_only" | "sandbox_code" | "protected_change";
  approvalRef?: string;
};
export type KernelAdmission =
  | { allowed: true; kernelId: string; remainingSlots: number }
  | { allowed: false; reason: "unknown_kernel" | "inactive_kernel" | "invalid_kernel" | "data_scope_denied" | "approval_required" | "capacity_exhausted" | "budget_exhausted" };

const SAFE_ID = /^[a-z][a-z0-9_-]{1,79}$/;
export function validateKernel(kernel: KernelDefinition): string[] {
  const issues: string[] = [];
  if (!SAFE_ID.test(kernel.id)) issues.push("invalid_id");
  if (!kernel.purpose.trim() || !kernel.owner.trim()) issues.push("missing_governance");
  if (!Number.isSafeInteger(kernel.maxConcurrentAgents) || kernel.maxConcurrentAgents < 1 || kernel.maxConcurrentAgents > 1000) issues.push("invalid_concurrency");
  if (!Number.isSafeInteger(kernel.monthlyBudgetUnits) || kernel.monthlyBudgetUnits < 0) issues.push("invalid_budget");
  if (kernel.allowedDataClasses.some((value) => !SAFE_ID.test(value))) issues.push("invalid_data_scope");
  if (kernel.leadRoles.some((value) => !SAFE_ID.test(value))) issues.push("invalid_lead_role");
  if (new Set(kernel.allowedDataClasses).size !== kernel.allowedDataClasses.length) issues.push("duplicate_data_scope");
  return issues;
}
export function admitKernelWork(input: {
  kernels: readonly KernelDefinition[];
  work: KernelWork;
  activeJobs: number;
  consumedBudgetUnits: number;
  estimatedCostUnits: number;
}): KernelAdmission {
  const kernel = input.kernels.find((entry) => entry.id === input.work.kernelId);
  if (!kernel) return { allowed: false, reason: "unknown_kernel" };
  if (validateKernel(kernel).length) return { allowed: false, reason: "invalid_kernel" };
  if (!kernel.active) return { allowed: false, reason: "inactive_kernel" };
  if (!input.work.id.trim() || input.work.dataClasses.some((item) => !kernel.allowedDataClasses.includes(item))) {
    return { allowed: false, reason: "data_scope_denied" };
  }
  if (input.work.risk === "protected_change") {
    // A caller must verify an approval against its durable approval store.
    // An unverified string is never sufficient authorization.
    return { allowed: false, reason: "approval_required" };
  }
  if (!Number.isSafeInteger(input.activeJobs) || input.activeJobs < 0 || input.activeJobs >= kernel.maxConcurrentAgents) {
    return { allowed: false, reason: "capacity_exhausted" };
  }
  if (![input.consumedBudgetUnits, input.estimatedCostUnits].every((value) => Number.isSafeInteger(value) && value >= 0) ||
      input.consumedBudgetUnits + input.estimatedCostUnits > kernel.monthlyBudgetUnits) {
    return { allowed: false, reason: "budget_exhausted" };
  }
  return { allowed: true, kernelId: kernel.id, remainingSlots: kernel.maxConcurrentAgents - input.activeJobs - 1 };
}
