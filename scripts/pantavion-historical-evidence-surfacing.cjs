#!/usr/bin/env node
/** Read-only historical evidence surfacing; originals preserved verbatim. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const inputs=[
 ['founder_vision','data/runtime-reports/latest-founder-vision-ingestion.json','findings'],
 ['unfinished_plans','data/runtime-reports/latest-unfinished-plan-ingestion.json','findings'],
 ['branch_snapshots','data/recovery/imported-pr248/deep-analysis/manifest.json','branches'],
 ['recovery_manifest','docs/recovery/RECOVERY_STATE_MANIFEST.json','items']
];
const out=[],coverage=[],missing=[];
for(const [kind,relative,key] of inputs){
 const filename=path.join(root,relative);
 if(!fs.existsSync(filename)){missing.push(relative);continue;}
 const data=JSON.parse(fs.readFileSync(filename,'utf8'));
 const items=data[key];
 if(!Array.isArray(items)){missing.push(relative+'#'+key);continue;}
 coverage.push({source:relative,kind,availableRecords:items.length,declaredFindings:data.totals?.findings??null});
 for(let index=0;index<items.length;index++){
  const original=items[index];
  const serialized=JSON.stringify(original);
  const fingerprint=crypto.createHash('sha256').update(serialized).digest('hex');
  out.push({id:kind+':'+String(index+1).padStart(7,'0'),source:relative,sourceIndex:index,
    sourceFile:original.file??original.path??null,sourceLine:original.line??null,
    fingerprint,kind,original,reviewState:'unreviewed',liveVerified:false});
 }
}
const byHash=new Map();
for(const record of out){
 const ids=byHash.get(record.fingerprint)||[];
 ids.push(record.id);byHash.set(record.fingerprint,ids);
}
const duplicateCandidates=[...byHash.entries()].filter(([,ids])=>ids.length>1).map(([fingerprint,ids])=>({fingerprint,ids,action:'review_only'}));
const receipt={schema:'pantavion-historical-evidence-surfacing-v1',createdAt:new Date().toISOString(),
 totalRecords:out.length,coverage,missing,duplicateCandidateGroups:duplicateCandidates.length,
 note:'Not full excavation: only arrays present in listed sources; declared counts may exceed embedded findings. No source modified.',
 productionDeployed:false,verifiedLive:false};
if(process.argv.includes('--write')){
 const dir=path.join(root,'artifacts','ecosystem-discovery');fs.mkdirSync(dir,{recursive:true});
 for(const [name,data] of [['historical-evidence-records.json',out],['historical-evidence-duplicates.json',duplicateCandidates],['historical-evidence-receipt.json',receipt]]){
  fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
 }
}
console.log(JSON.stringify(receipt,null,2));
if(missing.length)process.exitCode=2;
