"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const cp=require("node:child_process");
const path=require("node:path");
const script=path.join(__dirname,"pantavion-excavation-classify.cjs");
function classify(items){
 const run=cp.spawnSync(process.execPath,[script],{input:JSON.stringify(items),encoding:"utf8",timeout:10000});
 assert.equal(run.status,0,run.stderr);
 return JSON.parse(run.stdout).findings;
}
test("classifies one clearly isolated kernel",()=>{
 const [r]=classify([{source:"historical/social/feed.ts",description:"social feed post"}]);
 assert.equal(r.status,"classified");
 assert.equal(r.kernel_id,"social");
 assert.equal(r.automatic_merge,false);
 assert.equal(r.verification,"required");
});
test("does not silently assign cross-kernel discoveries",()=>{
 const [r]=classify([{source:"historical/water/network.dwg",description:"water pipeline GIS map"}]);
 assert.equal(r.status,"manual_review");
 assert.equal(r.kernel_id,null);
 assert.ok(r.candidates.includes("maps"));
 assert.ok(r.candidates.includes("water"));
});
test("preserves source trace and identifies duplicates",()=>{
 const src={source:"old/chat/message.ts",description:"chat message"};
 const [a,b]=classify([src,src]);
 assert.match(a.id,/^[a-f0-9]{64}$/);
 assert.equal(b.status,"duplicate");
 assert.equal(a.id,b.id);
});
test("unclassified discovery is manual review, never silently accepted",()=>{
 const [r]=classify([{source:"legacy/unknown.txt",description:"unmapped function"}]);
 assert.equal(r.status,"manual_review");
 assert.equal(r.kernel_id,null);
});
test("rejects malformed input",()=>{
 const run=cp.spawnSync(process.execPath,[script],{input:JSON.stringify([{source:3,description:"x"}]),encoding:"utf8",timeout:10000});
 assert.notEqual(run.status,0);
});
