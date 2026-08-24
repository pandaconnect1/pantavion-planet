const fs=require("fs");
const path=require("path");
const root=process.cwd();
const batchesRoot=path.join(root,"data","recovery","canonical-ledger","corpus","batches");
const outRoot=path.join(root,"data","recovery","canonical-ledger","dating-deep-review");
fs.mkdirSync(outRoot,{recursive:true});

const specific=[
 ["matchmaking",8],["dating",8],["date app",8],["romance",7],["romantic",7],
 ["ραντεβ",8],["γνωριμ",7],["ερωτικ",7],["σύντροφ",6],["συντροφ",6]
];
const supporting=[
 ["relationship",3],["compatibility",4],["match",2],["partner",2],["attraction",4],
 ["adult only",4],["age verification",3],["consent",2],["safety",1],
 ["σχέση",3],["σχεση",3],["συμβατό",4],["ταίρια",3],["ενήλικ",3],["συναίνε",2]
];
const excludeKeys=/^(id|ordinal|generatedAt|createdAt|updatedAt|sourceLine|sourceCommit|batch|timestamp|date)$/i;
function collect(v,key=""){
 if(v==null||excludeKeys.test(key)) return "";
 if(typeof v==="string") return v;
 if(Array.isArray(v)) return v.map(x=>collect(x,key)).join(" ");
 if(typeof v==="object") return Object.entries(v).map(([k,x])=>collect(x,k)).join(" ");
 return "";
}
const hits=(text,terms)=>terms.filter(([t])=>text.includes(t)).map(([term,weight])=>({term,weight}));
const results=[];
for(const file of fs.readdirSync(batchesRoot).filter(x=>x.endsWith(".json")).sort()){
 const batch=JSON.parse(fs.readFileSync(path.join(batchesRoot,file),"utf8"));
 for(const r of batch.records||[]){
  const text=collect(r).normalize("NFKD").toLowerCase();
  const strong=hits(text,specific),support=hits(text,supporting);
  if(!strong.length&&!support.length) continue;
  const score=strong.reduce((n,x)=>n+x.weight,0)+support.reduce((n,x)=>n+x.weight,0);
  let tier="REJECT_GENERIC_CONTEXT";
  if(strong.length&&score>=12) tier="HIGH_CONFIDENCE_DATING_EVIDENCE";
  else if(strong.length||support.length>=2&&score>=6) tier="MEDIUM_CONFIDENCE_REVIEW";
  const safeguards={
   adultEligibility:/adult|age verification|18\+|ενήλικ/.test(text),
   consent:/consent|συναίνε/.test(text),
   blockReport:/block|report|moderation|μπλοκ|αναφορ/.test(text),
   locationPrivacy:/location privacy|distance privacy|hide distance|ιδιωτικ.*τοποθεσ/.test(text),
   antiHarassment:/harass|abuse|stalking|παρενόχλ|κακοποί/.test(text),
   regionalRules:/jurisdiction|region|country|law|νομ|χώρα/.test(text)
  };
  results.push({
   id:r.id,batch:file,ordinal:r.ordinal,currentModule:r.classification?.module||"UNCLASSIFIED",
   tier,score,strongSignals:strong,supportingSignals:support,safeguards,
   provenance:r.provenance,reviewStatus:r.reviewStatus,
   canonicalTarget:r.classification?.canonicalTarget||null,
   contentEvidence:{
    title:r.title||null,summary:r.summary||null,excerpt:r.excerpt||null,
    description:r.description||null,text:r.text||null,content:typeof r.content==="string"?r.content.slice(0,2000):null
   }
  });
 }
}
const relevant=results.filter(x=>x.tier!=="REJECT_GENERIC_CONTEXT");
const high=relevant.filter(x=>x.tier==="HIGH_CONFIDENCE_DATING_EVIDENCE");
const medium=relevant.filter(x=>x.tier==="MEDIUM_CONFIDENCE_REVIEW");
const safetyTotals={};
for(const k of Object.keys((relevant[0]||{safeguards:{}}).safeguards||{})) safetyTotals[k]=relevant.filter(x=>x.safeguards[k]).length;
const manifest={
 id:"pantavion_dating_deep_review_v1",generatedAt:new Date().toISOString(),
 scannedCorpusRecords:82413,datingRelevantCandidates:relevant.length,
 highConfidenceEvidence:high.length,mediumConfidenceReview:medium.length,
 rejectedGenericContext:results.length-relevant.length,safetyCoverageSignals:safetyTotals,
 truth:"High confidence means strong semantic Dating evidence, not completed or safe functionality. Every item still requires canonical placement, implementation mapping and tests.",
 corpusMutated:false,verifiedComplete:false,verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"records.json"),JSON.stringify({manifest,records:results},null,2)+"\n");
console.log(JSON.stringify(manifest,null,2));
