const fs=require("fs");
const path=require("path");
const root=process.cwd();
const indexRoot=path.join(root,"data","recovery","canonical-ledger","indexes");
const semRoot=path.join(root,"data","recovery","canonical-ledger","semantic-reclassification");
const outRoot=path.join(root,"data","recovery","canonical-ledger","numeric-module-audit");
fs.mkdirSync(outRoot,{recursive:true});
const targets=[
 ["People","modules/people.json"],["Chat","modules/chat.json"],
 ["Social / Pulse / Communities","modules/social-pulse-communities.json"],
 ["Interpreter / Translation","modules/interpreter-translation.json"]
];
const count=(xs,fn)=>{const m={};for(const x of xs){const k=String(fn(x)||"UNSPECIFIED");m[k]=(m[k]||0)+1;}return Object.entries(m).map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value));};
const summarize=(module,records)=>({
 module,totalReferences:records.length,
 uniqueEvidenceUnits:new Set(records.map(r=>[r.sourceFile,r.sourceLine,r.sourceCommit].join("|"))).size,
 uniqueSourceFiles:new Set(records.map(r=>r.sourceFile).filter(Boolean)).size,
 exactDuplicateRelations:records.filter(r=>r.exactDuplicateOf).length,
 reviewRequired:records.filter(r=>r.reviewStatus==="REVIEW_REQUIRED").length,
 classified:records.filter(r=>r.reviewStatus!=="REVIEW_REQUIRED").length,
 stages:count(records,r=>r.implementationStage),
 sourceFamilies:count(records,r=>r.sourceFamily),
 recoveryStates:count(records,r=>r.recoveryState),
 liveStates:count(records,r=>r.liveState),
 layers:count(records,r=>r.layer),
 topSourceFiles:count(records,r=>r.sourceFile).slice(0,30),
 topCanonicalTargets:count(records,r=>r.canonicalTarget).slice(0,20),
 topBlockers:count(records,r=>(r.blockers||[]).join(" + ")||"NONE").slice(0,20),
 topNextActions:count(records,r=>r.nextAction).slice(0,20)
});
const modules=[];
for(const [name,file] of targets){
 const value=JSON.parse(fs.readFileSync(path.join(indexRoot,file),"utf8"));
 modules.push(summarize(name,value.records));
}
const dating=JSON.parse(fs.readFileSync(path.join(semRoot,"dating-candidates.json"),"utf8")).records;
modules.push({
 module:"Dating (semantic references)",totalReferences:dating.length,
 uniqueEvidenceUnits:new Set(dating.map(r=>[r.provenance?.sourceFile,r.provenance?.sourceLine,r.provenance?.sourceCommit].join("|"))).size,
 uniqueSourceFiles:new Set(dating.map(r=>r.provenance?.sourceFile).filter(Boolean)).size,
 reviewRequired:dating.filter(r=>r.reviewStatus==="REVIEW_REQUIRED").length,
 classifiedElsewhere:dating.filter(r=>r.reviewStatus!=="REVIEW_REQUIRED").length,
 currentModules:count(dating,r=>r.currentModule),
 matchedTerms:dating.flatMap(r=>r.matchedTerms||[]).reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{}),
 sourceFamilies:count(dating,r=>r.provenance?.sourceFamily),
 topSourceFiles:count(dating,r=>r.provenance?.sourceFile).slice(0,30),
 truth:"Dating semantic references require content-level confirmation; unique evidence units remove repeated provenance-family views but do not prove unique capabilities."
});
const manifest={
 id:"pantavion_five_module_numeric_audit_v1",generatedAt:new Date().toISOString(),
 modules,totalReferences:modules.reduce((n,x)=>n+x.totalReferences,0),
 totalUniqueEvidenceUnits:modules.reduce((n,x)=>n+x.uniqueEvidenceUnits,0),
 truth:"References are not completed features. Unique evidence units deduplicate by source file, line and commit; capability-level deduplication remains required.",
 verifiedCompleteModules:0,verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify(manifest,null,2));
