const fs=require('fs');const path=require('path');
const root=process.cwd();
const candidates=[
 'data/recovery/innovation-master-register/innovation-master-register.json',
 'data/recovery/canonical-knowledge-v2/full-corpus.json'
];
const input=candidates.find(p=>fs.existsSync(path.join(root,p)));
if(!input) throw new Error('No innovation/canonical corpus found');
const raw=JSON.parse(fs.readFileSync(path.join(root,input),'utf8'));
const records=raw.records||raw.candidates||[];
const families={
 FOUNDATION:['foundation','identity','auth','canonical','kernel','runtime'],
 COMMUNICATION:['chat','message','voice','video','communication','conversation'],
 'PEOPLE-GRAPH':['people','relationship','contact','profile','social graph','nearby'],
 'PERSONAL-AI':['personal ai','pantaai','assistant','companion','personal agent'],
 AGENTS:['agent','delegation','orchestration','supervisor','worker'],
 'APP-SERVICE-CREATION':['app/service','app creation','service creation','workflow creation','blueprint','foundry'],
 INVENTION:['invention','invent','novel','innovation','research'],
 'TECHNOLOGY-FACTORY':['technology factory','prototype','benchmark','sandbox','build factory','evolution'],
 'PRODUCT-ABSORPTION':['product absorption','absorb','replacement','provider','self-hosted','alternate provider'],
 LANGUAGE:['translation','interpreter','language','dialect','subtitle','stt','tts'],
 'SOS-RESILIENCE':['sos','emergency','crisis','offline','satellite','sms','resilience','failover'],
 'TRUST-SECURITY':['trust','security','moderation','minor','guardian','verification','consent','abuse'],
 'MEMORY-CONTINUITY':['memory','continuity','provenance','fingerprint','ledger','zero-loss','rollback'],
 'GLOBAL-POLICY':['jurisdiction','country','policy','legal','governance','rights'],
 'DEVICES-IOT':['device','iot','sensor','wearable','proximity','gps'],
 'MARKET-WORK':['marketplace','business','work','job','income','ads'],
 INSTITUTIONAL:['institutional','municipal','utility','government','organization','workflow'],
 'HUMAN-ADAPTATION':['adaptive','accessibility','elderly','literacy','human intent','personalized','context-aware']
};
function text(r){return JSON.stringify([r.text,r.context,r.title,r.mechanism,r.classification,r.evidence]).toLowerCase()}
function score(t,terms){return terms.reduce((n,x)=>n+(t.includes(x)?(x.includes(' ')?3:1):0),0)}
const mapped=[];const counts={};let unresolved=0;
for(const r of records){const t=text(r);const ranked=Object.entries(families).map(([f,terms])=>[f,score(t,terms)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);const top=ranked[0];const second=ranked[1];const confident=top&&(!second||top[1]>=second[1]+2||top[1]>=4);const family=confident?top[0]:'REVIEW_REQUIRED';counts[family]=(counts[family]||0)+1;if(!confident)unresolved++;mapped.push({id:r.id||r.candidateId||null,family,familyScore:top?.[1]||0,alternateFamilies:ranked.slice(1,4).map(([family,score])=>({family,score})),source:r.provenance||r.evidence||null,truthState:'SOURCE_GROUNDED_NOVELTY_UNVERIFIED',original:r});}
const out=path.join(root,'data/recovery/innovation-master-register');fs.mkdirSync(out,{recursive:true});
const result={generatedAt:new Date().toISOString(),source:input,total:mapped.length,counts,unresolved,truthRule:'Family assignment is classification only. It is never evidence of novelty, patentability, implementation completeness, deployment, or VERIFIED_LIVE.',records:mapped};
fs.writeFileSync(path.join(out,'innovation-family-map.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({total:mapped.length,counts,unresolved},null,2));
