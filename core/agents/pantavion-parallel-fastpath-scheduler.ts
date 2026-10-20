/**
 * Pantavion deterministic fast-path scheduler.
 * No model inference on the scheduling path. Distributed persistence/leases
 * must be provided by deployment infrastructure before multi-host use.
 */
export type Priority = "emergency" | "interactive" | "build" | "research" | "background";
export type DispatchJob = {
  id: string;
  kernelId: string;
  priority: Priority;
  requires: string[];
  risk: "read_only" | "sandbox_code" | "protected_change";
  estimatedCost: number;
};
export type WorkerSlot = {
  id: string;
  kernelIds: string[];
  busy: boolean;
  maxCost: number;
};
const rank: Record<Priority,number> = {emergency:0,interactive:1,build:2,research:3,background:4};
export function scheduleIndependentKernels(jobs: DispatchJob[], workers: WorkerSlot[]) {
  const assigned = new Set<string>();
  const used = new Set<string>();
  const assignments: Array<{jobId:string;workerId:string;kernelId:string}> = [];
  const deferred: Array<{jobId:string;reason:string}> = [];
  const ordered = [...jobs].sort((a,b)=>rank[a.priority]-rank[b.priority] || a.id.localeCompare(b.id));
  for (const job of ordered) {
    if (job.risk === "protected_change") {
      deferred.push({jobId:job.id,reason:"protected_approval_required"}); continue;
    }
    if (job.requires.some(id=>!assigned.has(id))) {
      deferred.push({jobId:job.id,reason:"dependencies_not_ready"}); continue;
    }
    const worker=workers.find(w=>!w.busy && !used.has(w.id) &&
      w.kernelIds.includes(job.kernelId) && w.maxCost>=job.estimatedCost);
    if (!worker) {deferred.push({jobId:job.id,reason:"no_available_worker"});continue;}
    assignments.push({jobId:job.id,workerId:worker.id,kernelId:job.kernelId});
    assigned.add(job.id);used.add(worker.id);
  }
  return {assignments,deferred};
}
export type CircuitState = "closed" | "open" | "half_open";
export function nextCircuitState(input: {
  state: CircuitState;
  consecutiveFailures: number;
  failureThreshold: number;
  retryWindowElapsed: boolean;
  latestProbeSucceeded?: boolean;
}): CircuitState {
  if (input.state==="open") return input.retryWindowElapsed?"half_open":"open";
  if (input.state==="half_open") return input.latestProbeSucceeded?"closed":"open";
  return input.consecutiveFailures>=input.failureThreshold?"open":"closed";
}
