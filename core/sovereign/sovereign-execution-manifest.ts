import { createHash } from "node:crypto";

export const SOVEREIGN_EXECUTION_MANIFEST_SCHEMA = "pantavion.sovereign-execution-manifest.v1" as const;
export const SOVEREIGN_EXECUTION_MANIFEST_POLICY = "sealed-non-authorizing-manifest-v1" as const;

export type ManifestTask = {
  taskId: string; agentId: string; capability: string; cost: number;
  dependsOn: string[]; mode: "sandbox" | "disconnected_edge"; sequence: number;
};
export type SovereignExecutionManifestRequest = {
  admissionId: string; intentId: string; planId: string;
  revalidationReceipt: string; revalidationDecision: "DENY" | "REVALIDATION_PASSED";
  issuedAt: string; expiresAt: string; capabilityScope: string[];
  budgetRemaining: number; tasks: ManifestTask[];
};

const ROOT_KEYS = new Set(["admissionId","intentId","planId","revalidationReceipt","revalidationDecision","issuedAt","expiresAt","capabilityScope","budgetRemaining","tasks"]);
const TASK_KEYS = new Set(["taskId","agentId","capability","cost","dependsOn","mode","sequence"]);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const CAP = /^[a-z][a-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function record(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("invalid_execution_manifest:" + name);
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, allowed: Set<string>, name: string) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`invalid_execution_manifest:${name}_unknown_field:${key}`);
}
function text(value: unknown, name: string, pattern = ID) {
  if (typeof value !== "string" || !pattern.test(value.trim())) throw new Error("invalid_execution_manifest:" + name);
  return value.trim();
}
function number(value: unknown, name: string, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) {
    throw new Error("invalid_execution_manifest:" + name);
  }
  return value;
}
function time(value: unknown, name: string) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("invalid_execution_manifest:" + name);
  return new Date(value).toISOString();
}
function stringList(value: unknown, name: string, pattern: RegExp, maximum: number) {
  if (!Array.isArray(value) || value.length > maximum) throw new Error("invalid_execution_manifest:" + name);
  const items = value.map((item, index) => text(item, `${name}_${index}`, pattern).toLowerCase());
  if (new Set(items).size !== items.length) throw new Error("invalid_execution_manifest:" + name + "_duplicate");
  return items.sort();
}

export function parseSovereignExecutionManifest(value: unknown): SovereignExecutionManifestRequest {
  const root = record(value, "object_required"); exactKeys(root, ROOT_KEYS, "root");
  if (root.revalidationDecision !== "DENY" && root.revalidationDecision !== "REVALIDATION_PASSED") throw new Error("invalid_execution_manifest:revalidationDecision");
  if (!Array.isArray(root.tasks) || root.tasks.length === 0 || root.tasks.length > 32) throw new Error("invalid_execution_manifest:tasks");
  const tasks = root.tasks.map((raw, index) => {
    const task = record(raw, `task_${index}`); exactKeys(task, TASK_KEYS, `task_${index}`);
    if (task.mode !== "sandbox" && task.mode !== "disconnected_edge") throw new Error(`invalid_execution_manifest:task_${index}_mode`);
    return {
      taskId: text(task.taskId, `task_${index}_taskId`).toLowerCase(),
      agentId: text(task.agentId, `task_${index}_agentId`).toLowerCase(),
      capability: text(task.capability, `task_${index}_capability`, CAP).toLowerCase(),
      cost: number(task.cost, `task_${index}_cost`),
      dependsOn: stringList(task.dependsOn, `task_${index}_dependsOn`, ID, 31),
      mode: task.mode,
      sequence: number(task.sequence, `task_${index}_sequence`, true),
    } as ManifestTask;
  });
  if (new Set(tasks.map(task => task.taskId)).size !== tasks.length) throw new Error("invalid_execution_manifest:duplicate_task_id");
  const parsed = {
    admissionId: text(root.admissionId, "admissionId"), intentId: text(root.intentId, "intentId"), planId: text(root.planId, "planId"),
    revalidationReceipt: text(root.revalidationReceipt, "revalidationReceipt", SHA256).toLowerCase(),
    revalidationDecision: root.revalidationDecision,
    issuedAt: time(root.issuedAt, "issuedAt"), expiresAt: time(root.expiresAt, "expiresAt"),
    capabilityScope: stringList(root.capabilityScope, "capabilityScope", CAP, 64),
    budgetRemaining: number(root.budgetRemaining, "budgetRemaining"), tasks,
  } as SovereignExecutionManifestRequest;
  if (Date.parse(parsed.expiresAt) <= Date.parse(parsed.issuedAt)) throw new Error("invalid_execution_manifest:expiry_not_after_issue");
  return parsed;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (typeof value === "object" && value !== null) { const o=value as Record<string,unknown>; return "{" + Object.keys(o).sort().map(k=>JSON.stringify(k)+":"+stable(o[k])).join(",") + "}"; }
  return JSON.stringify(value) ?? "null";
}

export function compileSovereignExecutionManifest(value: unknown) {
  const request = parseSovereignExecutionManifest(value);
  const reasons: string[] = [];
  const ids = new Set(request.tasks.map(task => task.taskId));
  const scope = new Set(request.capabilityScope);
  if (request.revalidationDecision !== "REVALIDATION_PASSED") reasons.push("revalidation_not_passed");
  if (request.tasks.some(task => !scope.has(task.capability))) reasons.push("capability_scope_expansion");
  const totalCost = request.tasks.reduce((sum, task) => sum + task.cost, 0);
  if (!Number.isFinite(totalCost) || totalCost > request.budgetRemaining) reasons.push("manifest_budget_exceeded");
  if (request.tasks.some(task => task.dependsOn.includes(task.taskId))) reasons.push("self_dependency");
  if (request.tasks.some(task => task.dependsOn.some(dependency => !ids.has(dependency)))) reasons.push("missing_dependency");
  const edgeTasks = request.tasks.filter(task => task.mode === "disconnected_edge");
  const edgeSequences = edgeTasks.map(task => task.sequence);
  if (new Set(edgeSequences).size !== edgeSequences.length || edgeSequences.some(sequence => sequence === 0)) reasons.push("invalid_edge_sequence");
  const graph = new Map(request.tasks.map(task => [task.taskId, task.dependsOn]));
  const visiting = new Set<string>(); const visited = new Set<string>(); let cyclic = false;
  const visit = (id: string) => { if (visiting.has(id)) { cyclic=true; return; } if (visited.has(id)) return; visiting.add(id); for (const dep of graph.get(id) ?? []) if (graph.has(dep)) visit(dep); visiting.delete(id); visited.add(id); };
  for (const id of ids) visit(id); if (cyclic) reasons.push("dependency_cycle");
  const normalizedTasks = [...request.tasks].sort((a,b)=>a.taskId.localeCompare(b.taskId));
  const decision = reasons.length ? "DENY" : "MANIFEST_READY_FOR_OWNER_EXECUTION_REVIEW";
  const payload = {schema:SOVEREIGN_EXECUTION_MANIFEST_SCHEMA,policyVersion:SOVEREIGN_EXECUTION_MANIFEST_POLICY,request:{...request,tasks:normalizedTasks},decision,reasons:[...new Set(reasons)],taskCount:request.tasks.length,agentCount:new Set(request.tasks.map(task=>task.agentId)).size,totalCost,budgetRemainingAfter:request.budgetRemaining-totalCost,executionAllowed:false,executionStarted:false,agentsCreated:false,agentsActivated:false,edgeHandoffIssued:false,budgetConsumedNow:false,productionWriteAllowed:false,authorizationEffect:"none"};
  return {...payload,manifestOnly:true as const,ownerExecutionReviewRequired:true as const,manifestReceipt:createHash("sha256").update(stable(payload)).digest("hex")};
}
