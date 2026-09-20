"use client";

import { type FormEvent, useState } from "react";

type Result = { ok:boolean; error?:string; detail?:string; proposalCount?:number; totalBudget?:number; swarmState?:string; agentsCreated?:boolean; agentsActivated?:boolean; executionAllowed?:boolean; budgetConsumed?:boolean; authorizationEffect?:string; receiptSha256?:string; decision?:{eligibleForOwnerReview:boolean; reasons:string[]} };

export default function FounderSwarmAdmissionClient() {
  const [form,setForm]=useState({intentId:"",agentId:"",role:"researcher",capability:"research",scope:"technology_library",budget:"0",createdAt:"",expiresAt:"",maxAgents:"4",maxTotalBudget:"100",maxLifetimeMinutes:"60"});
  const [result,setResult]=useState<Result|null>(null);
  const [pending,setPending]=useState(false);
  function field(name:keyof typeof form,value:string){setForm(current=>({...current,[name]:value}));}
  async function assess(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setPending(true); setResult(null);
    try {
      const response=await fetch("/api/owner/swarm-admission/assess",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        intentId:form.intentId,maxAgents:Number(form.maxAgents),maxTotalBudget:Number(form.maxTotalBudget),maxLifetimeMinutes:Number(form.maxLifetimeMinutes),
        proposals:[{id:form.agentId,role:form.role,budget:Number(form.budget),createdAt:form.createdAt,expiresAt:form.expiresAt,capabilities:[{capability:form.capability,scope:form.scope,readOnly:true,expiresAt:form.expiresAt}]}]
      })});
      setResult(await response.json() as Result);
    } catch { setResult({ok:false,error:"swarm_admission_failed"}); }
    finally { setPending(false); }
  }
  return <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
    <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-xl font-black">Προτεινόμενο swarm</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {([["intentId","Intent ID"],["agentId","Agent ID"],["capability","Capability"],["scope","Scope"]] as const).map(([name,label])=><label key={name} className="text-sm font-bold">{label}<input required maxLength={240} value={form[name]} onChange={e=>field(name,e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"/></label>)}
        <label className="text-sm font-bold">Role<select value={form.role} onChange={e=>field("role",e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"><option>planner</option><option>researcher</option><option>builder</option><option>verifier</option><option>security</option><option>translator</option><option>domain_specialist</option></select></label>
        {([["budget","Agent budget"],["maxAgents","Max agents"],["maxTotalBudget","Max total budget"],["maxLifetimeMinutes","Max lifetime minutes"]] as const).map(([name,label])=><label key={name} className="text-sm font-bold">{label}<input required type="number" min="0" value={form[name]} onChange={e=>field(name,e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"/></label>)}
        {([["createdAt","Created at"],["expiresAt","Expires at"]] as const).map(([name,label])=><label key={name} className="text-sm font-bold">{label}<input required type="datetime-local" value={form[name]} onChange={e=>field(name,e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3"/></label>)}
      </div>
      <button disabled={pending} className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 font-black text-cyan-100 disabled:opacity-50">{pending?"Αξιολόγηση...":"ΑΞΙΟΛΟΓΗΣΗ SWARM"}</button>
    </form>
    <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-xl font-black">Αποτέλεσμα</h2>
      {!result?<p className="mt-4 text-sm text-slate-400">Εδώ εμφανίζονται blockers, budget και deterministic receipt.</p>:!result.ok||!result.decision?<p className="mt-4 text-sm text-rose-200">{result.error}: {result.detail}</p>:<div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-cyan-500/60 p-4 text-cyan-100"><b>{result.decision.eligibleForOwnerReview?"ELIGIBLE FOR OWNER REVIEW":"BLOCKED"}</b><div className="mt-2 text-sm">{result.decision.reasons.join(", ")||"No assessment blockers."}</div></div>
        <div className="break-all rounded-2xl border border-slate-800 p-4 font-mono text-xs text-cyan-200">{result.receiptSha256}</div>
        <dl className="grid gap-2 text-xs text-slate-400"><div>Swarm: {result.swarmState}</div><div>Agents created: {String(result.agentsCreated)}</div><div>Agents activated: {String(result.agentsActivated)}</div><div>Execution: {String(result.executionAllowed)}</div><div>Budget consumed: {String(result.budgetConsumed)}</div><div>Authorization: {result.authorizationEffect}</div></dl>
      </div>}
    </section>
  </div>;
}
