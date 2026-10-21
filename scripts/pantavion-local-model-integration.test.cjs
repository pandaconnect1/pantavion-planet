'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),http=require('node:http');
const runner=path.join(__dirname,'pantavion-sovereign-improvement-cycle.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pantavion-proof-'));
const git=(...args)=>cp.execFileSync('git',args,{cwd:tmp});
(async()=>{
 let server;
 try{
 git('init','-q');git('config','user.email','proof@example.invalid');git('config','user.name','Proof');
 fs.writeFileSync(path.join(tmp,'README.md'),'fixture');git('add','.');git('commit','-qm','initial');git('checkout','-qb','ai-sandbox/proof');
 server=http.createServer(async(req,res)=>{
 let body='';for await(const chunk of req)body+=chunk;
 const data=JSON.parse(body);assert.equal(data.model,'mock-local-coder');assert.equal(req.headers.authorization,'Bearer test-only');
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({files:[{path:'app/proof.ts',content:'export const pantavionProof = 42;\n'}]})}}]}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const endpoint='http://127.0.0.1:'+server.address().port+'/v1/chat/completions';
 const result=await new Promise(resolve=>{const child=cp.spawn(process.execPath,[runner,'Create a simple module'],{cwd:tmp,env:{...process.env,PANTAVION_SANDBOX_ROOT:tmp,PANTAVION_AI_CODER_ENDPOINT:endpoint,PANTAVION_AI_CODER_MODEL:'mock-local-coder',PANTAVION_AI_CODER_KEY:'test-only'}});let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('close',code=>resolve({code,stdout,stderr}));});
 assert.equal(result.code,0,result.stderr);
 assert.equal(fs.readFileSync(path.join(tmp,'app/proof.ts'),'utf8'),'export const pantavionProof = 42;\n');
 const output=JSON.parse(result.stdout);assert.equal(output.production,false);assert.equal(output.verified,false);
 console.log('PASS local mock inference endpoint -> generated patch -> sandbox file; production=false');
 }finally{if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
