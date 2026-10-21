"use strict";
const assert=require("node:assert/strict");
const {validateFile}=require("./pantavion-sovereign-improvement-cycle.cjs");
assert.equal(validateFile({path:"app/sandbox-demo.ts",content:"export const proof=true;"}),"app/sandbox-demo.ts");
for(const p of ["app/water/map.ts","app/auth/route.ts","lib/guardian.ts","app/../evil.ts",".github/workflows/ci.yml","app/.env.ts","app/agent-runner.ts","/tmp/hack.ts"]){
 assert.throws(()=>validateFile({path:p,content:"bad"}),undefined,p);
}
assert.throws(()=>validateFile({path:"app/ok.ts",content:"x".repeat(100001)}));
console.log("PASS sovereign improvement patch validation: approved path accepted, 9 unsafe cases rejected");
