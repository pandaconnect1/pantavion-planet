const fs=require("fs");
const path=require("path");
const root=process.cwd();
const indexRoot=path.join(root,"data","recovery","canonical-ledger","indexes");
const outRoot=path.join(root,"data","recovery","canonical-ledger","deep-dives");
fs.mkdirSync(outRoot,{recursive:true});
const targets=[
 {name:"Interpreter / Translation",file:"modules/interpreter-translation.json",slug:"interpreter-translation"},
 {name:"SOS / Crisis",file:"modules/sos-crisis.json",slug:"sos-crisis"}
];
const countBy=(records,key)=>{
 const m=new Map();
 for(const r of records){
  let v=r[key];
  if(Array.isArray(v)){ for(const x of v.length?v:["NONE"]) m.set(String(x),1+(m.get(String(x))||0)); }
  else { v=v||"UNSPECIFIED"; m.set(String(v),1+(m.get(String(v))||0)); }
 }
 return [...m].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value));
};
const reports=[];
for(const t of targets){
 const input=JSON.parse(fs.readFileSync(path.join(indexRoot,t.file),"utf8"));
 const records=input.records;
 const report={
  id:`pantavion_deep_dive_${t.slug}_v1`,
  module:t.name,totalRecords:records.length,
  implementationStages:countBy(records,"implementationStage"),
  topicFamilies:countBy(records,"topicFamily"),
  productDomains:countBy(records,"productDomain"),
  layers:countBy(records,"layer"),
  recoveryStates:countBy(records,"recoveryState"),
  liveStates:countBy(records,"liveState"),
  reviewStatuses:countBy(records,"reviewStatus"),
  canonicalTargets:countBy(records,"canonicalTarget"),
  blockers:countBy(records,"blockers"),
  nextActions:countBy(records,"nextAction"),
  records,
  globalReadiness:{
   continents:["Africa","Asia","Europe","North America","South America","Oceania","Antarctica / remote operations"],
   requiredAxes:["language-and-dialect-coverage","regional-law-and-consent","accessibility","low-bandwidth-and-offline","emergency-routing-and-authority-verification","data-residency-and-retention","abuse-prevention-and-minor-safety","observability-and-failover"],
   status:"REQUIRES_RECORD_LEVEL_MAPPING_AND_E2E_VERIFICATION"
  },
  verifiedLive:false,deleteAllowed:false
 };
 fs.writeFileSync(path.join(outRoot,`${t.slug}.json`),JSON.stringify(report,null,2)+"\n");
 reports.push(report);
}
const manifest={
 id:"pantavion_critical_modules_deep_dive_v1",
 generatedAt:new Date().toISOString(),
 modules:reports.map(r=>({module:r.module,totalRecords:r.totalRecords,file:`${r.id.replace("pantavion_deep_dive_","").replace("_v1","")}.json`})),
 totalRecords:reports.reduce((n,r)=>n+r.totalRecords,0),
 globalReadiness:"NOT_YET_VERIFIED",
 verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
const md=["# Critical Modules Deep Dive","","> Detailed recovered evidence inventory. This is not a production-readiness claim.",""];
for(const r of reports){
 md.push(`## ${r.module}`,"",`Total records: **${r.totalRecords}**`,"", "### Implementation evidence","");
 for(const x of r.implementationStages) md.push(`- ${x.value}: ${x.count}`);
 md.push("","### Leading blockers","");
 for(const x of r.blockers.slice(0,20)) md.push(`- ${x.value}: ${x.count}`);
 md.push("","### Leading next actions","");
 for(const x of r.nextActions.slice(0,20)) md.push(`- ${x.value}: ${x.count}`);
 md.push("");
}
fs.writeFileSync(path.join(outRoot,"REPORT.md"),md.join("\n")+"\n");
console.log(JSON.stringify(manifest,null,2));
