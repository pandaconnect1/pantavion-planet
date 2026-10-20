"use strict";
// Pantavion isolated code-generation runner. NEVER operates on production checkout.
// Requires a dedicated disposable git worktree, a reviewed job, and an explicit allowlist.
// Does not deploy, merge, access secrets, or touch Water.
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const root=fs.realpathSync(process.env.PANTAVION_SANDBOX_ROOT||".");
const jobPath=process.env.PANTAVION_JOB_FILE;
if(!jobPath) throw Error("PANTAVION_JOB_FILE required");
const job=JSON.parse(fs.readFileSync(jobPath,"utf8"));
if(job.risk!=="sandbox_code"||!Array.isArray(job.files)||!job.files.length) throw Error("Sandbox-only job with files required");
if(!process.env.PANTAVION_SANDBOX_ROOT||root==="/"||root===process.env.HOME) throw Error("Dedicated sandbox root required");
const git=(args)=>cp.execFileSync("git",args,{cwd:root,encoding:"utf8",timeout:30000}).trim();
if(!fs.existsSync(path.join(root,".git"))) throw Error("Sandbox must be a standalone git checkout");
if(git(["status","--porcelain"])) throw Error("Sandbox must start clean");
if(!git(["branch","--show-current"]).startsWith("ai-sandbox/")) throw Error("Only ai-sandbox/* branches allowed");
const forbidden=/(^|\/)(water|\.github|\.env[^/]*|node_modules|\.git)(\/|$)/i;
const changed=[];
for(const file of job.files){
 if(typeof file.path!=="string"||typeof file.content!=="string") throw Error("Invalid file");
 const name=file.path.replace(/\\/g,"/");
 if(name.startsWith("/")||name.split("/").includes("..")||forbidden.test(name)||/water/i.test(name)) throw Error("Forbidden path: "+name);
 if(!/^(app|components|lib|scripts|tests)\//.test(name)) throw Error("Path outside allowlist: "+name);
 const target=path.resolve(root,name);
 if(!target.startsWith(root+path.sep)) throw Error("Path traversal");
 let cursor=path.dirname(target);
 while(cursor.startsWith(root)&&cursor!==root){if(fs.existsSync(cursor)&&fs.lstatSync(cursor).isSymbolicLink()) throw Error("Symlink path");cursor=path.dirname(cursor);}
 if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink()) throw Error("Symlink target");
 if(file.content.length>200000) throw Error("File too large");
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.content,{flag:"w",mode:0o600});changed.push(name);
}
const diff=git(["diff","--name-only"]);const untracked=git(["ls-files","--others","--exclude-standard"]);
const all=[...new Set([...diff.split("\n"),...untracked.split("\n")].filter(Boolean))];
if(all.some(f=>!changed.includes(f))) throw Error("Unexpected changed paths");
console.log(JSON.stringify({status:"sandbox_changes_only",files:changed,branch:git(["branch","--show-current"]),tests:"not_run",deployment:"not_performed"}));
