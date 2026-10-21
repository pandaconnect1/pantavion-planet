import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import PantavionAIChat from "./pantavion-ai-chat";
export const dynamic = "force-dynamic";
export default async function PantavionAIPage() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/auth/login?next=/owner/control/pantavion-ai");
 try { requireFounderIdentity(user.id); } catch { redirect("/"); }
 const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
 if (assurance?.currentLevel !== "aal2") redirect("/owner/safety/verify?next=/owner/control/pantavion-ai");
 return <main className="min-h-screen bg-slate-950 text-slate-100 p-6"><div className="mx-auto max-w-4xl space-y-6">
 <a href="/owner/control" className="text-cyan-300 underline">← Owner Control</a>
 <h1 className="text-3xl font-bold">Pantavion AI Chat</h1>
 <p className="text-slate-300">Ιδιωτική συνομιλία ιδρυτή με αυτοφιλοξενούμενο μοντέλο. Η συνομιλία δεν εκτελεί ούτε δημοσιεύει κώδικα. Το Water εξαιρείται.</p>
 <PantavionAIChat /></div></main>;
}
