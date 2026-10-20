// Pantavion independent kernel proposal worker; one leased job per invocation.
// Safe bootstrap: produces review artifacts only; does not execute code or deploy.
// Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PANTAVION_AGENT_MODEL_URL,
// PANTAVION_AGENT_MODEL_KEY, PANTAVION_AGENT_MODEL_ID, PANTAVION_KERNEL_ID.
"use strict";
const { createClient } = require("@supabase/supabase-js");
const crypto = require("node:crypto");
const required = ["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","PANTAVION_AGENT_MODEL_URL","PANTAVION_AGENT_MODEL_KEY","PANTAVION_AGENT_MODEL_ID","PANTAVION_KERNEL_ID"];
for (const key of required) if (!process.env[key]) { console.error("Missing "+key); process.exit(2); }
const kernel = process.env.PANTAVION_KERNEL_ID;
if (!/^[a-z][a-z0-9_-]{1,79}$/.test(kernel) || kernel === "water" || kernel.startsWith("water_") || kernel.startsWith("water-")) throw Error("Invalid or excluded kernel");
const client = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owner = kernel+"-"+crypto.randomUUID();
async function run() {
 const {data,error} = await client.rpc("pantavion_agent_claim",{p_worker:owner,p_kernel:kernel,p_lease_seconds:600});
 if (error) throw error;
 const job=data?.[0]; if (!job) {console.log("No job for "+kernel);return;}
 if (job.kernel_id!==kernel || job.risk!=="read_only") throw Error("Job isolation/risk mismatch");
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),90000);
 try {
  const response=await fetch(process.env.PANTAVION_AGENT_MODEL_URL,{method:"POST",signal:abort.signal,headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.PANTAVION_AGENT_MODEL_KEY},body:JSON.stringify({model:process.env.PANTAVION_AGENT_MODEL_ID,messages:[{role:"system",content:"You are the Pantavion "+kernel+" kernel development reviewer. Produce an evidence-limited implementation proposal only. Never claim code edits, tests, deployments or live verification. Never request secrets. Never cross into other kernels. No map/geolocation capabilities in social or chat."},{role:"user",content:job.objective}],max_tokens:2000})});
  if (!response.ok) throw Error("Model HTTP "+response.status);
  const result=await response.json(),output=result.choices?.[0]?.message?.content;
  if(typeof output!=="string" || !output.trim()) throw Error("Empty model response");
  const {data:updated,error:writeError}=await client.from("pantavion_agent_jobs").update({status:"succeeded",artifact_refs:[{kind:"model_proposal",kernel_id:kernel,text:output.slice(0,16000),model:process.env.PANTAVION_AGENT_MODEL_ID}],lease_owner:null,lease_expires_at:null,updated_at:new Date().toISOString()}).eq("id",job.id).eq("kernel_id",kernel).eq("lease_owner",owner).eq("status","leased").gt("lease_expires_at",new Date().toISOString()).select("id");
  if(writeError) throw writeError;
  if(updated?.length!==1) throw Error("Lost job lease; completion not recorded");
  console.log("Completed "+kernel+" job "+job.id);
 } catch(err) {
  const retry=job.attempts<job.max_attempts;
  const {error:failError}=await client.from("pantavion_agent_jobs").update({status:retry?"queued":"failed",last_error:String(err).slice(0,300),lease_owner:null,lease_expires_at:null,updated_at:new Date().toISOString()}).eq("id",job.id).eq("kernel_id",kernel).eq("lease_owner",owner).eq("status","leased").gt("lease_expires_at",new Date().toISOString());
  if(failError) console.error("Failed to record error: "+failError.message);
  throw err;
 } finally {clearTimeout(timer);}
}
run().catch(e=>{console.error(String(e));process.exitCode=1;});
