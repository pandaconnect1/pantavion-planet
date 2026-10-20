import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
export const dynamic="force-dynamic";
export const revalidate=0;
export default async function AgentOperationsPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/auth/login?next=/owner/control/agent-operations");
 try{requireFounderIdentity(user.id)}catch{redirect("/")}
 const {data:assurance}=await db.auth.mfa.getAuthenticatorAssuranceLevel();
 if(assurance?.currentLevel!=="aal2")redirect("/owner/safety/verify?next=/owner/control/agent-operations");
 // User-session RLS must remain in force. Never use a service-role key in a page.
 // No misleading '0 jobs' if access is denied.
 const [jobs,alerts]=await Promise.all([
  db.from("pantavion_agent_jobs").select("id,kernel_id,status,created_at",{count:"exact"}).limit(1),
  db.from("pantavion_founder_alerts").select("id,status,severity,created_at",{count:"exact"}).limit(1)
 ]);
 const rows=[
  {name:"AI worker jobs",result:jobs},
  {name:"Founder alerts",result:alerts}
 ];
 return <main className="min-h-screen bg-slate-950 p-6 text-slate-100"><section className="mx-auto max-w-4xl space-y-5">
 <a href="/owner/control" className="text-cyan-300 underline">← Owner Control</a>
 <h1 className="text-3xl font-black">AI Operations · πραγματική κατάσταση</h1>
 <p className="text-slate-300">Founder MFA required. Η πρόσβαση ελέγχεται από RLS· καμία μη διαθέσιμη πληροφορία δεν παρουσιάζεται ως μηδενική δραστηριότητα.</p>
 {rows.map(({name,result})=><article key={name} className="rounded-xl border border-slate-700 p-5">
 <h2 className="font-bold">{name}</h2>
 <p className="mt-2 text-sm">{result.error?"Μη διαθέσιμο στον founder session: "+result.error.message:"Προσβάσιμες εγγραφές: "+String(result.count??"άγνωστο")}</p>
 </article>)}
 <p className="text-amber-300 text-sm">Οι AI workers δεν πιστοποιούνται ως ενεργοί από την παρουσία της ουράς. Απαιτούνται worker heartbeats και end-to-end εκτέλεση.</p>
 </section></main>;
}
