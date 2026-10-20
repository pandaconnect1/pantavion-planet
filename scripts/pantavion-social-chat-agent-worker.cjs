// Bounded Social/Chat agent worker. Executes one leased job per invocation.
// Requires service-role credentials and a configured OpenAI-compatible inference endpoint.
// It writes model output as evidence only; it never executes generated code or deploys.
const { createClient } = require("@supabase/supabase-js");
const crypto = require("node:crypto");
const required = ["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","PANTAVION_AGENT_MODEL_URL","PANTAVION_AGENT_MODEL_KEY","PANTAVION_AGENT_MODEL_ID"];
for (const key of required) if (!process.env[key]) { console.error("Missing "+key); process.exit(2); }
const client = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const worker = "social-chat-"+crypto.randomUUID();
async function run() {
 const { data, error } = await client.rpc("pantavion_agent_claim",{p_worker:worker,p_kernel:"social_chat",p_lease_seconds:600});
 if (error) throw error;
 const job = data?.[0]; if (!job) { console.log("No queued social_chat jobs"); return; }
 if (job.risk !== "read_only" && job.risk !== "sandbox_code") throw Error("Risk denied");
 const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(),90000);
 try {
   const response=await fetch(process.env.PANTAVION_AGENT_MODEL_URL,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.PANTAVION_AGENT_MODEL_KEY},body:JSON.stringify({model:process.env.PANTAVION_AGENT_MODEL_ID,messages:[{role:"system",content:"You are a Pantavion Social/Chat development analyst. Produce a concrete review and implementation proposal only. Never claim to have edited code, deployed, queried live systems or run tests. No maps. Do not request secrets."},{role:"user",content:job.objective}],max_tokens:2000})});
   if (!response.ok) throw Error("Model HTTP "+response.status);
   const payload=await response.json();const output=payload.choices?.[0]?.message?.content;
   if (typeof output!=="string" || !output.trim()) throw Error("Empty model output");
   const {error:writeError}=await client.from("pantavion_agent_jobs").update({status:"succeeded",artifact_refs:[{kind:"model_proposal",text:output.slice(0,20000),model:process.env.PANTAVION_AGENT_MODEL_ID}],lease_owner:null,lease_expires_at:null,updated_at:new Date().toISOString()}).eq("id",job.id).eq("lease_owner",worker).eq("status","leased");
   if (writeError) throw writeError;
   console.log("Completed proposal job "+job.id);
 } catch(e) {
   const retry=job.attempts < job.max_attempts;
   await client.from("pantavion_agent_jobs").update({status:retry?"queued":"failed",last_error:String(e).slice(0,500),lease_owner:null,lease_expires_at:null,updated_at:new Date().toISOString()}).eq("id",job.id).eq("lease_owner",worker).eq("status","leased");
   throw e;
 } finally {clearTimeout(timer);}
}
run().catch(e=>{console.error(String(e));process.exitCode=1;});
