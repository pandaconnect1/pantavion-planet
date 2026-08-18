import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCommunity, joinCommunity } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");

  const readiness = await supabase.from("communities").select("id", { head: true, count: "exact" }).limit(1);
  if (readiness.error) {
    return <main className="min-h-screen bg-[#f4f8fc] p-6"><section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-6"><h1 className="text-3xl font-black text-[#173f72]">Κοινότητες</h1><p className="mt-3 text-slate-600">Το recovered UI είναι συνδεδεμένο, αλλά το Communities backend δεν έχει ακόμη εφαρμοστεί στο ενεργό production database.</p><Link href="/social" className="mt-5 inline-block font-black text-[#2467aa]">← Social</Link></section></main>;
  }

  const { data: communities, error } = await supabase
    .from("communities")
    .select("id,name,slug,description,visibility,age_scope,created_by,created_at,community_members(user_id,status,role)")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = communities ?? [];
  return <main className="min-h-screen bg-[#f4f8fc] px-4 py-6 text-slate-950"><section className="mx-auto max-w-6xl">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#3474b8]">PANTAVION COMMUNITIES</p><h1 className="mt-2 text-4xl font-black text-[#173f72]">Βρες τους ανθρώπους σου. Χτίσε την κοινότητά σου.</h1></div><Link href="/social" className="font-black text-[#2467aa] no-underline">← Social</Link></header>
    {params.error || error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error || error?.message}</div> : null}
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-3 text-xl font-black">Νέα κοινότητα</h2><form action={createCommunity} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input name="name" required minLength={2} maxLength={100} placeholder="Όνομα κοινότητας" className="rounded-xl border border-slate-200 px-3 py-2.5"/><input name="description" maxLength={1000} placeholder="Περιγραφή" className="rounded-xl border border-slate-200 px-3 py-2.5"/><select name="visibility" defaultValue="public" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="public">Δημόσια</option><option value="private">Ιδιωτική</option><option value="secret">Μυστική</option></select><button className="rounded-xl bg-[#2467aa] px-4 py-2.5 font-black text-white">Δημιουργία</button></form></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((community: any) => { const members = community.community_members ?? []; const joined = members.some((m: any) => m.user_id === user.id && m.status === "active"); return <article key={community.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#3474b8]">{community.visibility} · {community.age_scope}</p><h2 className="mt-2 text-2xl font-black text-[#173f72]">{community.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{community.description || "Pantavion community"}</p><p className="mt-3 text-xs text-slate-500">{members.filter((m:any)=>m.status === "active").length} μέλη</p>{joined ? <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Μέλος</span> : community.visibility === "public" ? <form action={joinCommunity} className="mt-4"><input type="hidden" name="communityId" value={community.id}/><button className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white">Συμμετοχή</button></form> : <p className="mt-4 text-xs font-bold text-amber-700">Απαιτείται πρόσκληση ή έγκριση.</p>}</article>; })}</section>
  </section></main>;
}
