#!/usr/bin/env node
/** Strict, read-only excavation coverage gate. Missing evidence means NOT COMPLETE. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=(relative)=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const exists=(relative)=>fs.existsSync(path.join(root,relative));
const problems=[],sources=[];
function inspectIngestion(relative){
 if(!exists(relative)){problems.push({type:'missing_source',path:relative});return;}
 const d=load(relative), declared=d.totals?.findings,embedded=d.findings?.length;
 sources.push({path:relative,declared,embedded,unitemized:typeof declared==='number'&&typeof embedded==='number'?Math.max(0,declared-embedded):null});
 if(!Number.isSafeInteger(declared)||!Array.isArray(d.findings))problems.push({type:'invalid_ingestion',path:relative});
 else if(embedded<declared)problems.push({type:'unitemized_findings',path:relative,count:declared-embedded});
}
inspectIngestion('data/runtime-reports/latest-founder-vision-ingestion.json');
inspectIngestion('data/runtime-reports/latest-unfinished-plan-ingestion.json');
const manifestPath='data/recovery/imported-pr248/deep-analysis/manifest.json';
if(!exists(manifestPath))problems.push({type:'missing_source',path:manifestPath});
else {
 const d=load(manifestPath),branches=Array.isArray(d.branches)?d.branches:[];
 sources.push({path:manifestPath,declared:d.totals?.snapshotBranches,embedded:branches.length});
 if(branches.length!==d.totals?.snapshotBranches)problems.push({type:'branch_count_mismatch',expected:d.totals?.snapshotBranches,actual:branches.length});
 for(const branch of branches){
  if(!branch.report){problems.push({type:'missing_report_pointer',branch:branch.id});continue;}
  // Historical reports may have moved; never silently count an unverified pointer as inspected.
  if(!exists(branch.report))problems.push({type:'unavailable_branch_report',branch:branch.id,path:branch.report});
  if(branch.verificationState!=='VERIFIED_LIVE')problems.push({type:'not_live_verified',branch:branch.id,state:branch.verificationState??'unknown'});
 }
}
const recovery='docs/recovery/RECOVERY_STATE_MANIFEST.json';
if(!exists(recovery))problems.push({type:'missing_source',path:recovery});
else {
 const d=load(recovery),items=Array.isArray(d.items)?d.items:[];
 sources.push({path:recovery,embedded:items.length});
 for(const item of items)if(item.liveState!=='VERIFIED_LIVE')problems.push({type:'recovery_item_not_live',id:item.id,state:item.liveState??'unknown'});
}
const report={schema:'pantavion-excavation-completeness-gate-v1',generatedAt:new Date().toISOString(),
 complete:problems.length===0,sources,problemCount:problems.length,problems,
 definition:'Coverage of these sources only; a PASS does not prove no unknown sources exist.'};
if(process.argv.includes('--write')){
 const dir=path.join(root,'artifacts','ecosystem-discovery');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'excavation-completeness-gate.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
if(!report.complete)process.exitCode=1;
