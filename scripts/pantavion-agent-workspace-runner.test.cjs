"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),cp=require("node:child_process");
const runner=path.resolve(__dirname,"pantavion-agent-workspace-runner.cjs");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"pantavion-agent-test-"));
const git=(...args)=>cp.execFileSync("git",args,{cwd:root,stdio:"pipe"});
try{
 git("init","-q");git("config","user.email","test@example.invalid");git("config","user.name","Pantavion Test");
 fs.writeFileSync(path.join(root,"README.md"),"fixture\n");git("add",".");git("commit","-qm","fixture");git("checkout","-qb","ai-sandbox/test");
 const jobFile=path.join(os.tmpdir(),"pantavion-job-"+process.pid+"-"+Date.now()+".json");
 function run(job){fs.writeFileSync(jobFile,JSON.stringify(job));return cp.spawnSync(process.execPath,[runner],{cwd:root,env:{...process.env,PANTAVION_SANDBOX_ROOT:root,PANTAVION_JOB_FILE:jobFile},encoding:"utf8"});}
 const ok=run({risk:"sandbox_code",files:[{path:"app/agent-proof.txt",content:"proof\n"}]});
 assert.equal(ok.status,0,ok.stderr);assert.equal(fs.readFileSync(path.join(root,"app/agent-proof.txt"),"utf8"),"proof\n");
 // Reset sandbox to clean state between adversarial cases.
 fs.rmSync(path.join(root,"app"),{recursive:true,force:true});
 for(const bad of ["app/water/test.ts","../escape.ts",".github/workflows/ci.yml","app/../lib/trick.ts","app/.env.local"]){
  const res=run({risk:"sandbox_code",files:[{path:bad,content:"unsafe"}]});
  assert.notEqual(res.status,0,"must reject "+bad);
 }
 const denied=run({risk:"read_only",files:[{path:"app/deny.txt",content:"no"}]});
 assert.notEqual(denied.status,0);
 console.log("PASS: sandbox writes approved file; Water, traversal, .github, secrets and wrong risk rejected");
}finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(jobFile,{force:true});}
