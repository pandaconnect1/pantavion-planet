const fs=require("fs");
const path=require("path");
const root=process.cwd();
const corpusRoot=path.join(root,"data","recovery","canonical-ledger","corpus","batches");
const outRoot=path.join(root,"data","recovery","canonical-ledger","semantic-reclassification");
fs.mkdirSync(outRoot,{recursive:true});

const taxonomy={
"Dating":["dating","date app","matchmaking","romance","romantic","relationship","compatibility","ραντεβ","γνωριμ","σχέση","σχεση"],
"Chat":["chat","message","messaging","conversation","inbox","thread","dm","whatsapp","viber","signal","μήνυμα","συνομιλ"],
"People":["people","person","profile","contact","friend","network","directory","προφίλ","επαφ","φίλ"],
"Social / Pulse / Communities":["social","pulse","community","communities","post","feed","group","content creator","κοινότη","ανάρτη","δημοσίευ"],
"Interpreter / Translation":["translation","translate","translator","interpreter","language","dialect","subtitle","caption","speech-to-text","μετάφρα","διερμην","γλώσσ"],
"Voice / Video":["voice","video","call","webrtc","audio","camera","microphone","φωνή","βίντεο","κλήση"],
"SOS / Crisis":["sos","crisis","emergency","disaster","rescue","alert","incident","panic","έκτακ","κρίση","διάσω"],
"Safety / Trust / Minors":["safety","trust","minor","child","moderation","abuse","report","block","guardian","ασφάλ","ανήλικ","παιδί"],
"Identity / Auth / Consent":["identity","auth","login","signup","consent","permission","role","session","ταυτότητα","σύνδεση","συγκατάθεση"],
"Kernel / Guardian / Runtime":["kernel","runtime","guardian","agent","workflow","execution","queue","orchestrat","πυρήν","εκτέλεση"],
"Personal AI / PantaAI":["pantaai","personal ai","assistant","memory","ai router","copilot","agentic","προσωπικ"],
"Maps / World / Water":["map","geospatial","gis","water","utility","dwg","pipe","city","location","χάρτ","ύδρευ","αγωγ"],
"Marketplace / Work / Business":["marketplace","business","work","job","listing","commerce","service","payment","αγορά","εργασία","επιχείρ"],
"Learning / Knowledge":["learn","learning","education","course","knowledge","school","εκπαίδευ","μάθη"],
"Music / Media / Creation":["music","radio","media","creator","studio","song","podcast","μουσικ"],
"Resilience / Offline / Infrastructure":["offline","resilience","satellite","sms","radio fallback","failover","infrastructure","ανθεκ","δορυφορ"]
};
const normalize=s=>String(s||"").normalize("NFKD").toLowerCase();
const analyze=r=>{
 const text=normalize(JSON.stringify(r));
 const scores=[];
 for(const [module,terms] of Object.entries(taxonomy)){
  const matched=terms.filter(t=>text.includes(normalize(t)));
  if(matched.length) scores.push({module,score:matched.length,matchedTerms:matched});
 }
 scores.sort((a,b)=>b.score-a.score||a.module.localeCompare(b.module));
 const top=scores[0],second=scores[1];
 const confident=!!top&&top.score>=2&&(!second||top.score>=second.score+1);
 return {scores:scores.slice(0,5),suggestedModule:confident?top.module:null,confidence:confident?"RULE_EVIDENCE_SUGGESTED":"HUMAN_DEEP_REVIEW_REQUIRED"};
};
const unclassified=[],dating=[];
for(const file of fs.readdirSync(corpusRoot).filter(x=>x.endsWith(".json")).sort()){
 const batch=JSON.parse(fs.readFileSync(path.join(corpusRoot,file),"utf8"));
 for(const r of batch.records||[]){
  const module=r.classification?.module||"UNCLASSIFIED";
  if(module==="UNCLASSIFIED"){
   const a=analyze(r);
   unclassified.push({id:r.id,batch:file,ordinal:r.ordinal,provenance:r.provenance,originalClassification:r.classification,reviewStatus:r.reviewStatus,...a});
  }
  const a=analyze(r);
  const d=a.scores.find(x=>x.module==="Dating");
  if(d&&d.score>=1) dating.push({id:r.id,batch:file,ordinal:r.ordinal,currentModule:module,datingScore:d.score,matchedTerms:d.matchedTerms,provenance:r.provenance,reviewStatus:r.reviewStatus});
 }
}
const suggested=unclassified.filter(x=>x.suggestedModule);
const byModule={};
for(const x of suggested) byModule[x.suggestedModule]=(byModule[x.suggestedModule]||0)+1;
const manifest={
 id:"pantavion_semantic_reclassification_v1",generatedAt:new Date().toISOString(),
 unclassifiedInput:unclassified.length,suggestedAssignments:suggested.length,
 stillRequiresDeepReview:unclassified.length-suggested.length,
 suggestedByModule:Object.entries(byModule).map(([module,count])=>({module,count})).sort((a,b)=>b.count-a.count),
 datingCandidatesAcrossCorpus:dating.length,
 truth:"Suggestions are deterministic evidence aids. They do not mutate the permanent corpus and require record-level confirmation before canonical classification.",
 corpusMutated:false,verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"unclassified-suggestions.json"),JSON.stringify({manifest,records:unclassified},null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"dating-candidates.json"),JSON.stringify({total:dating.length,records:dating},null,2)+"\n");
console.log(JSON.stringify(manifest,null,2));
