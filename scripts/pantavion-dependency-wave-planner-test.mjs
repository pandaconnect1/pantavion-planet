import assert from "node:assert/strict";
import { planParallelWaves } from "../core/agents/pantavion-dependency-wave-planner.ts";
const job=(id,dependsOn=[],priority="build",risk="sandbox_code",estimatedCost=1)=>({
 id,kernelId:"kernel-"+id,dependsOn,priority,risk,estimatedCost
});
{
 const p=planParallelWaves([job("a"),job("b"),job("c",["a","b"])]);
 assert.deepEqual(p.waves,[["a","b"],["c"]]);
 assert.equal(p.blocked.length,0);
}
{
 const p=planParallelWaves([job("a",["b"]),job("b",["a"])]);
 assert.equal(p.diagnostics.cycles.length,1);
 assert.equal(p.blocked.filter(x=>x.reason==="dependency_cycle").length,2);
}
{
 const p=planParallelWaves([job("a",[],"build","protected_change"),job("b",["a"])]);
 assert.equal(p.waves.length,0);
 assert.deepEqual(p.blocked.map(x=>x.reason),["approval_required","waiting_on_blocked_dependency"]);
}
{
 const p=planParallelWaves([job("a",["not-found"])]);
 assert.equal(p.diagnostics.missingDependencies.length,1);
 assert.equal(p.blocked[0].reason,"missing_dependency");
}
{
 const p=planParallelWaves([job("a"),job("b"),job("c")],new Set(),2);
 assert.deepEqual(p.waves,[["a","b"],["c"]]);
}
{
 const p=planParallelWaves([job("a",[],"background"),job("b",[],"emergency")],new Set(),1);
 assert.deepEqual(p.waves,[["b"],["a"]]);
}
{
 const p=planParallelWaves([job("a"),job("b")],new Set(),10,1);
 assert.deepEqual(p.waves,[["a"],["b"]]);
}
{
 const p=planParallelWaves([job("a",["external"])],new Set(["external"]));
 assert.deepEqual(p.waves,[["a"]]);
}
console.log("Pantavion dependency wave planner: 8 contract checks passed");
