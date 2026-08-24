const fs=require("fs");
const path=require("path");
const crypto=require("crypto");

const root=process.cwd();
const corpus=path.join(root,"data","recovery","canonical-ledger","corpus");
const out=path.join(root,"data","recovery","canonical-ledger","indexes");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,"modules"),{recursive:true});
fs.mkdirSync(path.join(out,"implementation-stages"),{recursive:true});

const slug=s=>String(s||"UNCLASSIFIED").normalize("NFKD").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"unclassified";
const byModule=new Map();
const byStage=new Map();
const totals={records:0,duplicatesExact:0,reviewRequired:0,classified:0};

function stageOf(r){
 const c=r.classification||{};
 const family=r.provenance?.sourceFamily||"unknown";
 const live=String(c.liveState||"").toUpperCase();
 const state=String(c.recoveryState||"").toUpperCase();
 if(family==="live-state"||live.includes("LIVE")) return "LIVE_EVIDENCE_REQUIRES_VERIFICATION";
 if(family==="unfinished-gap"||/BLOCK|MISSING|UNFINISHED|PLANNED/.test(state)) return "GAP_OR_BLOCKER";
 if(["current-code","donor","recovery"].includes(family)) return "CODE_PRESENT_UNVERIFIED";
 if(family==="founder-vision") return "IDEA_OR_SPECIFICATION";
 return "SEMANTIC_REVIEW_REQUIRED";
}
function pointer(r,batch){
 const c=r.classification||{};
 const exact=(r.relations||[]).find(x=>x.type==="DUPLICATE_EXACT");
 return {
  id:r.id,batch,ordinal:r.ordinal,
  sourceFamily:r.provenance?.sourceFamily||null,
  sourceFile:r.provenance?.sourceFile||null,
  sourceLine:r.provenance?.sourceLine||null,
  sourceCommit:r.provenance?.sourceCommit||null,
  module:c.module||"UNCLASSIFIED",
  topicFamily:c.topicFamily||null,
  productDomain:c.productDomain||null,
  layer:c.layer||null,
  recoveryState:c.recoveryState||null,
  liveState:c.liveState||null,
  decision:c.decision||null,
  canonicalTarget:c.canonicalTarget||null,
  reviewStatus:r.reviewStatus||null,
  implementationStage:stageOf(r),
  exactDuplicateOf:exact?.targetId||null,
  blockers:Array.isArray(c.blockers)?c.blockers:[],
  nextAction:c.nextAction||null
 };
}

const batchFiles=fs.readdirSync(path.join(corpus,"batches")).filter(x=>x.endsWith(".json")).sort();
for(const batch of batchFiles){
 const value=JSON.parse(fs.readFileSync(path.join(corpus,"batches",batch),"utf8"));
 for(const r of value.records||[]){
  const p=pointer(r,batch);
  totals.records++;
  if(p.exactDuplicateOf) totals.duplicatesExact++;
  if(p.reviewStatus==="REVIEW_REQUIRED") totals.reviewRequired++; else totals.classified++;
  if(!byModule.has(p.module)) byModule.set(p.module,[]);
  byModule.get(p.module).push(p);
  if(!byStage.has(p.implementationStage)) byStage.set(p.implementationStage,[]);
  byStage.get(p.implementationStage).push(p);
 }
}
const manifest=JSON.parse(fs.readFileSync(path.join(corpus,"manifest.json"),"utf8"));
if(totals.records!==manifest.totalRecords) throw new Error(`index count mismatch ${totals.records} != ${manifest.totalRecords}`);

const moduleIndex=[];
for(const [name,records] of [...byModule.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
 const file=`modules/${slug(name)}.json`;
 fs.writeFileSync(path.join(out,file),JSON.stringify({module:name,totalRecords:records.length,records},null,2)+"\n");
 moduleIndex.push({module:name,totalRecords:records.length,file});
}
const stageIndex=[];
for(const [name,records] of [...byStage.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
 const file=`implementation-stages/${slug(name)}.json`;
 fs.writeFileSync(path.join(out,file),JSON.stringify({implementationStage:name,totalRecords:records.length,records},null,2)+"\n");
 stageIndex.push({implementationStage:name,totalRecords:records.length,file});
}
const indexManifest={
 id:"pantavion_corpus_indexes_v1",
 generatedAt:new Date().toISOString(),
 corpusFingerprint:manifest.corpusFingerprint,
 totalRecords:totals.records,
 totalBatches:batchFiles.length,
 totals,
 modules:moduleIndex,
 implementationStages:stageIndex,
 truth:"Indexes point to the single permanent corpus copy by batch and ordinal. Implementation stages are evidence classifications, not claims of live functionality.",
 verifiedLive:false,
 deleteAllowed:false
};
fs.writeFileSync(path.join(out,"manifest.json"),JSON.stringify(indexManifest,null,2)+"\n");
console.log(JSON.stringify(indexManifest,null,2));
