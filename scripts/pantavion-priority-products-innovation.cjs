const fs=require("fs");
const path=require("path");
const root=process.cwd();
const indexRoot=path.join(root,"data","recovery","canonical-ledger","indexes");
const outRoot=path.join(root,"data","recovery","canonical-ledger","product-deep-dives");
fs.mkdirSync(outRoot,{recursive:true});

const specs=[
 {module:"Interpreter / Translation",file:"modules/interpreter-translation.json",slug:"interpreter-translation"},
 {module:"Chat",file:"modules/chat.json",slug:"chat"},
 {module:"People",file:"modules/people.json",slug:"people"},
 {module:"Social / Pulse / Communities",file:"modules/social-pulse-communities.json",slug:"social-pulse-communities"}
];
const all=[];
for(const f of fs.readdirSync(path.join(indexRoot,"modules")).filter(x=>x.endsWith(".json"))){
 const value=JSON.parse(fs.readFileSync(path.join(indexRoot,"modules",f),"utf8"));
 all.push(...value.records);
}
const datingPattern=/\b(dating|matchmaking|romance|romantic|relationship|date|ραντεβ|γνωριμ|σχ[εέ]σ)/i;
const datingRecords=all.filter(r=>datingPattern.test([
 r.topicFamily,r.productDomain,r.canonicalTarget,r.nextAction,r.sourceFile,...(r.blockers||[])
].filter(Boolean).join(" ")));
specs.push({module:"Dating",slug:"dating",records:datingRecords});

const countBy=(records,key)=>{
 const m=new Map();
 for(const r of records){
  const raw=r[key];
  const values=Array.isArray(raw)?(raw.length?raw:["NONE"]):[raw||"UNSPECIFIED"];
  for(const v of values) m.set(String(v),1+(m.get(String(v))||0));
 }
 return [...m].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value));
};
const reports=[];
const innovations=[];
for(const spec of specs){
 const records=spec.records||JSON.parse(fs.readFileSync(path.join(indexRoot,spec.file),"utf8")).records;
 const stage=countBy(records,"implementationStage");
 const topics=countBy(records,"topicFamily");
 const domains=countBy(records,"productDomain");
 const targets=countBy(records,"canonicalTarget");
 const blockers=countBy(records,"blockers");
 const actions=countBy(records,"nextAction");
 const report={
  id:`pantavion_product_deep_dive_${spec.slug}_v1`,module:spec.module,totalRecords:records.length,
  recoveredFromSemanticSearch:spec.module==="Dating",
  implementationStages:stage,topicFamilies:topics,productDomains:domains,
  layers:countBy(records,"layer"),canonicalTargets:targets,blockers,nextActions:actions,
  records,verifiedComplete:false,verifiedLive:false,deleteAllowed:false
 };
 fs.writeFileSync(path.join(outRoot,`${spec.slug}.json`),JSON.stringify(report,null,2)+"\n");
 reports.push(report);
 for(const topic of topics.filter(x=>x.value!=="UNSPECIFIED").slice(0,100)){
  const evidence=records.filter(r=>(r.topicFamily||"UNSPECIFIED")===topic.value);
  const code=evidence.filter(r=>r.implementationStage==="CODE_PRESENT_UNVERIFIED").length;
  const live=evidence.filter(r=>r.implementationStage==="LIVE_EVIDENCE_REQUIRES_VERIFICATION").length;
  const gaps=evidence.filter(r=>r.implementationStage==="GAP_OR_BLOCKER").length;
  innovations.push({
   module:spec.module,innovationCandidate:topic.value,evidenceRecords:evidence.length,
   codeEvidenceUnverified:code,liveEvidenceRequiresVerification:live,gapsOrBlockers:gaps,
   evidenceStrength:live>0?"LIVE_EVIDENCE_REQUIRES_VERIFICATION":code>0?"CODE_EVIDENCE_UNVERIFIED":"SPECIFICATION_EVIDENCE",
   sourcePointers:evidence.slice(0,25).map(r=>({id:r.id,batch:r.batch,ordinal:r.ordinal,sourceFile:r.sourceFile,canonicalTarget:r.canonicalTarget})),
   grantClaimAllowed:false,
   nextRequirement:live>0?"Run production E2E verification and capture dated evidence":code>0?"Map code to user outcome, test, and capture measurable evidence":"Convert specification into bounded implementation and validation plan"
  });
 }
}
const manifest={
 id:"pantavion_priority_products_and_innovation_registry_v1",
 generatedAt:new Date().toISOString(),
 totalRecords:reports.reduce((n,r)=>n+r.totalRecords,0),
 modules:reports.map(r=>({module:r.module,totalRecords:r.totalRecords,file:r.id.replace("pantavion_product_deep_dive_","").replace("_v1","")+".json"})),
 innovationCandidates:innovations.length,
 datingSemanticCandidates:datingRecords.length,
 truth:"Innovation candidates are evidence-indexed working hypotheses, not unverified grant claims.",
 verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"innovation-registry.json"),JSON.stringify({manifest,innovations},null,2)+"\n");
const md=["# Pantavion Priority Products and Innovation Evidence","","> Evidence-indexed analysis for grant preparation. No candidate is an approved grant claim until implementation and measurable verification evidence exist.","",`Total mapped records: **${manifest.totalRecords}** · Innovation candidates: **${manifest.innovationCandidates}** · Dating semantic candidates: **${manifest.datingSemanticCandidates}**`,""];
for(const r of reports){
 md.push(`## ${r.module}`,"",`Recovered records: **${r.totalRecords}**`,"","### Implementation evidence","");
 for(const x of r.implementationStages) md.push(`- ${x.value}: ${x.count}`);
 md.push("","### Leading capability/topic families","");
 for(const x of r.topicFamilies.slice(0,20)) md.push(`- ${x.value}: ${x.count}`);
 md.push("","### Leading blockers","");
 for(const x of r.blockers.slice(0,15)) md.push(`- ${x.value}: ${x.count}`);
 md.push("");
}
fs.writeFileSync(path.join(outRoot,"GRANT_INNOVATION_REPORT.md"),md.join("\n")+"\n");
console.log(JSON.stringify(manifest,null,2));
