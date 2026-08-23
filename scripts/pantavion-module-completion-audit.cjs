const fs=require("fs");
const path=require("path");

const root=process.cwd();
const indexRoot=path.join(root,"data","recovery","canonical-ledger","indexes");
const outRoot=path.join(root,"data","recovery","canonical-ledger","completion-audit");
fs.mkdirSync(outRoot,{recursive:true});

const expectedModules=[
"People","Chat","Voice / Video","Social / Pulse / Communities","Marketplace / Work / Business",
"Interpreter / Translation","Maps / World / Water","SOS / Crisis","Safety / Trust / Minors",
"Identity / Auth / Consent","Kernel / Guardian / Runtime","Personal AI / PantaAI",
"Learning / Knowledge","Music / Media / Creation","Resilience / Offline / Infrastructure",
"Dating","Events","Business","Ads Center","Compass / Discovery","Mind","PantaLearn",
"App / Service Engine","Institutional Workflows","Contacts Sync","Billing / Entitlements",
"Notifications","Search / Discovery","Storage / Media","Audit / Observability"
];

const manifest=JSON.parse(fs.readFileSync(path.join(indexRoot,"manifest.json"),"utf8"));
const rows=[];
for(const moduleName of expectedModules){
 const entry=manifest.modules.find(x=>x.module===moduleName);
 if(!entry){
  rows.push({module:moduleName,total:0,liveEvidenceRequiresVerification:0,codePresentUnverified:0,gapsOrBlockers:0,ideasOrSpecifications:0,reviewRequired:0,classified:0,assessment:"EMPTY_NO_RECOVERED_RECORDS",verifiedComplete:false});
  continue;
 }
 const value=JSON.parse(fs.readFileSync(path.join(indexRoot,entry.file),"utf8"));
 const counts={LIVE_EVIDENCE_REQUIRES_VERIFICATION:0,CODE_PRESENT_UNVERIFIED:0,GAP_OR_BLOCKER:0,IDEA_OR_SPECIFICATION:0,SEMANTIC_REVIEW_REQUIRED:0};
 let reviewRequired=0;
 for(const r of value.records){
  counts[r.implementationStage]=(counts[r.implementationStage]||0)+1;
  if(r.reviewStatus==="REVIEW_REQUIRED") reviewRequired++;
 }
 const total=value.records.length;
 const gaps=counts.GAP_OR_BLOCKER||0;
 const code=counts.CODE_PRESENT_UNVERIFIED||0;
 const live=counts.LIVE_EVIDENCE_REQUIRES_VERIFICATION||0;
 const ideas=counts.IDEA_OR_SPECIFICATION||0;
 let assessment;
 if(total===0) assessment="EMPTY_NO_RECOVERED_RECORDS";
 else if(live>0 && gaps===0 && reviewRequired===0) assessment="LIVE_EVIDENCE_CANDIDATE_REQUIRES_E2E_VERIFICATION";
 else if(code>0 && gaps/total<=0.05 && reviewRequired/total<=0.10) assessment="MINOR_GAPS_CANDIDATE_UNVERIFIED";
 else if(code>0 && gaps/total<=0.25) assessment="PARTIAL_WITH_MANAGEABLE_GAPS";
 else if(code>0) assessment="PARTIAL_WITH_SUBSTANTIAL_GAPS";
 else if(ideas>0) assessment="SPECIFICATION_ONLY_NO_CODE_EVIDENCE";
 else assessment="SEMANTIC_REVIEW_REQUIRED";
 rows.push({module:moduleName,total,liveEvidenceRequiresVerification:live,codePresentUnverified:code,gapsOrBlockers:gaps,ideasOrSpecifications:ideas,semanticReviewRequired:counts.SEMANTIC_REVIEW_REQUIRED||0,reviewRequired,classified:total-reviewRequired,assessment,verifiedComplete:false});
}
const extra=manifest.modules.filter(x=>!expectedModules.includes(x.module)).map(x=>x.module);
const summary={
 id:"pantavion_module_completion_audit_v1",
 generatedAt:new Date().toISOString(),
 corpusFingerprint:manifest.corpusFingerprint,
 totalCorpusRecords:manifest.totalRecords,
 expectedModules:rows.length,
 emptyModules:rows.filter(x=>x.assessment==="EMPTY_NO_RECOVERED_RECORDS").length,
 verifiedCompleteModules:0,
 truth:"Evidence-based triage only. No module is complete until production E2E tests and live verification pass.",
 verifiedLive:false,
 deleteAllowed:false,
 extraRecoveredCategories:extra,
 modules:rows
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(summary,null,2)+"\n");
const lines=["# Pantavion Module Completion Audit","",`Corpus: **${summary.totalCorpusRecords}** records · Expected modules: **${summary.expectedModules}** · Empty: **${summary.emptyModules}** · Verified complete: **0**`,"","> Evidence triage only. No module is complete until production end-to-end testing and live verification pass.","","| Module | Total | Code unverified | Gaps | Ideas | Review | Assessment |","|---|---:|---:|---:|---:|---:|---|"];
for(const r of rows) lines.push(`| ${r.module} | ${r.total} | ${r.codePresentUnverified} | ${r.gapsOrBlockers} | ${r.ideasOrSpecifications} | ${r.reviewRequired} | ${r.assessment} |`);
fs.writeFileSync(path.join(outRoot,"REPORT.md"),lines.join("\n")+"\n");
console.log(JSON.stringify(summary,null,2));
