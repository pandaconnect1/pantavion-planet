/**
 * Pantavion dependency-aware parallel wave planner.
 * Pure deterministic planning: no network calls, AI inference, deployment or writes.
 * Jobs with completed prerequisites can run in parallel; protected jobs stay gated.
 */
export type WaveJob = Readonly<{
  id: string;
  kernelId: string;
  dependsOn: readonly string[];
  priority: "emergency" | "interactive" | "build" | "research" | "background";
  risk: "read_only" | "sandbox_code" | "protected_change";
  estimatedCost: number;
}>;
export type WavePlan = {
  waves: string[][];
  blocked: Array<{id:string;reason:string}>;
  diagnostics: {cycles:string[][];missingDependencies:Array<{id:string;dependency:string}>};
};
const priorityRank: Record<WaveJob["priority"],number> = {
  emergency:0,interactive:1,build:2,research:3,background:4
};
export function planParallelWaves(
  jobs: readonly WaveJob[],
  completed: ReadonlySet<string> = new Set(),
  maxParallel = 32,
  maxCostPerWave = Number.POSITIVE_INFINITY
): WavePlan {
  if (!Number.isSafeInteger(maxParallel) || maxParallel < 1) throw Error("Invalid parallel limit");
  if (!(maxCostPerWave > 0)) throw Error("Invalid wave budget");
  const byId = new Map<string,WaveJob>();
  for (const job of jobs) {
    if (!job.id || byId.has(job.id)) throw Error("Missing or duplicate job id: "+job.id);
    if (!job.kernelId || !Number.isFinite(job.estimatedCost) || job.estimatedCost<0) throw Error("Invalid job metadata: "+job.id);
    byId.set(job.id,job);
  }
  const missingDependencies: WavePlan["diagnostics"]["missingDependencies"] = [];
  for (const job of jobs) for (const dependency of job.dependsOn) {
    if (!byId.has(dependency) && !completed.has(dependency)) missingDependencies.push({id:job.id,dependency});
  }
  const blocked: WavePlan["blocked"] = [];
  const blockedIds = new Set<string>();
  for (const job of jobs) {
    if (job.risk==="protected_change") {
      blocked.push({id:job.id,reason:"approval_required"});
      blockedIds.add(job.id);
    }
  }
  for (const missing of missingDependencies) {
    if (!blockedIds.has(missing.id)) {
      blocked.push({id:missing.id,reason:"missing_dependency"});
      blockedIds.add(missing.id);
    }
  }
  const remaining = new Set(jobs.map(j=>j.id).filter(id=>!completed.has(id) && !blockedIds.has(id)));
  const done = new Set(completed);
  const waves:string[][]=[];
  while (remaining.size) {
    const ready = [...remaining].map(id=>byId.get(id)!).filter(job=>job.dependsOn.every(id=>done.has(id)))
      .sort((a,b)=>priorityRank[a.priority]-priorityRank[b.priority] || a.id.localeCompare(b.id));
    if (!ready.length) break;
    const selected:string[]=[];
    let spent=0;
    for (const job of ready) {
      if (selected.length>=maxParallel) break;
      if (spent+job.estimatedCost>maxCostPerWave) continue;
      selected.push(job.id);spent+=job.estimatedCost;
    }
    if (!selected.length) {
      for (const job of ready) {
        blocked.push({id:job.id,reason:"exceeds_wave_budget"});
        blockedIds.add(job.id);remaining.delete(job.id);
      }
      continue;
    }
    waves.push(selected);
    for (const id of selected) {remaining.delete(id);done.add(id);}
  }
  // Detect dependency cycles separately from jobs merely waiting on blocked predecessors.
  const cycles:string[][]=[];
  const color=new Map<string,number>();
  const stack:string[]=[];
  const cycleKeys=new Set<string>();
  function visit(id:string):void {
    color.set(id,1);stack.push(id);
    for (const dep of byId.get(id)!.dependsOn) {
      if (!remaining.has(dep)) continue;
      if (!color.has(dep)) visit(dep);
      else if (color.get(dep)===1) {
        const cycle=stack.slice(stack.indexOf(dep));
        const key=[...cycle].sort().join("|");
        if (!cycleKeys.has(key)) {cycles.push(cycle);cycleKeys.add(key);}
      }
    }
    stack.pop();color.set(id,2);
  }
  for (const id of remaining) if (!color.has(id)) visit(id);
  const cycleIds=new Set(cycles.flat());
  for (const id of remaining) blocked.push({
    id,reason:cycleIds.has(id)?"dependency_cycle":"waiting_on_blocked_dependency"
  });
  return {waves,blocked,diagnostics:{cycles,missingDependencies}};
}
