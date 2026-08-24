const fs=require("fs");
const path=require("path");
const root=process.cwd();
const indexRoot=path.join(root,"data","recovery","canonical-ledger","indexes");
const outRoot=path.join(root,"data","recovery","canonical-ledger","innovation-portfolio");
fs.mkdirSync(outRoot,{recursive:true});
const records=[];
for(const f of fs.readdirSync(path.join(indexRoot,"modules")).filter(x=>x.endsWith(".json"))){
 const v=JSON.parse(fs.readFileSync(path.join(indexRoot,"modules",f),"utf8"));
 records.push(...v.records);
}
const groups=new Map();
for(const r of records){
 const key=[r.module||"UNCLASSIFIED",r.topicFamily||"UNSPECIFIED",r.productDomain||"UNSPECIFIED",r.layer||"UNSPECIFIED"].join(" :: ");
 if(!groups.has(key)) groups.set(key,[]);
 groups.get(key).push(r);
}
const candidates=[];
for(const [key,rs] of groups){
 const code=rs.filter(r=>r.implementationStage==="CODE_PRESENT_UNVERIFIED").length;
 const live=rs.filter(r=>r.implementationStage==="LIVE_EVIDENCE_REQUIRES_VERIFICATION").length;
 const gaps=rs.filter(r=>r.implementationStage==="GAP_OR_BLOCKER").length;
 const ideas=rs.filter(r=>r.implementationStage==="IDEA_OR_SPECIFICATION").length;
 const review=rs.filter(r=>r.reviewStatus==="REVIEW_REQUIRED").length;
 const exact=rs.filter(r=>r.exactDuplicateOf).length;
 const uniqueEvidence=rs.length-exact;
 const evidenceScore=Math.round(Math.min(100,
   (Math.min(uniqueEvidence,500)/500)*30+
   (code/Math.max(rs.length,1))*30+
   (live>0?15:0)+
   (1-gaps/Math.max(rs.length,1))*15+
   (1-review/Math.max(rs.length,1))*10
 ));
 const [module,topicFamily,productDomain,layer]=key.split(" :: ");
 candidates.push({
  id:"innovation-"+Buffer.from(key).toString("base64url").slice(0,28),
  module,topicFamily,productDomain,layer,
  evidenceRecords:rs.length,uniqueEvidenceRecords:uniqueEvidence,
  codeEvidenceUnverified:code,liveEvidenceRequiresVerification:live,
  gapsOrBlockers:gaps,ideasOrSpecifications:ideas,reviewRequired:review,
  evidenceScore,
  readiness:live>0?"VERIFY_LIVE_CANDIDATE":code>0&&gaps/rs.length<=0.15?"STRONG_CODE_CANDIDATE_UNVERIFIED":code>0?"PARTIAL_CODE_CANDIDATE":"SPECIFICATION_CANDIDATE",
  grantPromotionStatus:"EVIDENCE_DEVELOPMENT_REQUIRED",
  requiredProof:["clear problem statement","novel differentiator versus current alternatives","working implementation boundary","measurable beneficiary outcome","dated test evidence","IP and freedom-to-operate review","market and global scalability evidence"],
  evidencePointers:rs.slice(0,50).map(r=>({id:r.id,batch:r.batch,ordinal:r.ordinal,sourceFile:r.sourceFile,sourceCommit:r.sourceCommit,canonicalTarget:r.canonicalTarget})),
  verifiedClaim:false
 });
}
candidates.sort((a,b)=>b.evidenceScore-a.evidenceScore||b.uniqueEvidenceRecords-a.uniqueEvidenceRecords);
const summary={
 id:"pantavion_global_innovation_portfolio_v1",
 generatedAt:new Date().toISOString(),
 corpusRecords:records.length,
 candidateClusters:candidates.length,
 topEvidenceCandidates:candidates.filter(x=>x.evidenceScore>=70).length,
 modulesRepresented:[...new Set(candidates.map(x=>x.module))].sort(),
 truth:"Portfolio ranks evidence clusters for further grant substantiation. Scores do not prove novelty, eligibility, implementation completion, or grant entitlement.",
 verifiedClaims:0,verifiedLive:false,deleteAllowed:false
};
fs.writeFileSync(path.join(outRoot,"manifest.json"),JSON.stringify(summary,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"candidates.json"),JSON.stringify({summary,candidates},null,2)+"\n");
const md=["# Pantavion Global Innovation Portfolio","","> Evidence-development portfolio for grant preparation. Independent novelty, eligibility, IP and live implementation checks remain required.","",`Corpus records: **${summary.corpusRecords}** · Candidate clusters: **${summary.candidateClusters}** · High evidence-score candidates: **${summary.topEvidenceCandidates}**`,"","| Rank | Module | Topic | Domain | Layer | Evidence | Code | Live evidence | Gaps | Score | Readiness |","|---:|---|---|---|---|---:|---:|---:|---:|---:|---|"];
candidates.slice(0,200).forEach((c,i)=>md.push(`| ${i+1} | ${c.module} | ${c.topicFamily} | ${c.productDomain} | ${c.layer} | ${c.evidenceRecords} | ${c.codeEvidenceUnverified} | ${c.liveEvidenceRequiresVerification} | ${c.gapsOrBlockers} | ${c.evidenceScore} | ${c.readiness} |`));
fs.writeFileSync(path.join(outRoot,"GRANT_PORTFOLIO.md"),md.join("\n")+"\n");
console.log(JSON.stringify(summary,null,2));
