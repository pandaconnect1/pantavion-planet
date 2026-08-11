import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyMediaClient from "./my-media-client";

export const dynamic = "force-dynamic";

export default async function MyMediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/my-media");

  const { data: items, error } = await supabase
    .from("personal_media")
    .select("id,storage_path,original_name,mime_type,media_kind,size_bytes,visibility,caption,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#f5f9fd] px-4 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-7 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/profile" className="font-black text-[#173f72] no-underline">← Το προφίλ μου</Link>
          <Link href="/contacts" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 no-underline">Επαφές</Link>
        </nav>
        <header className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3474b8]">Ο ΠΡΟΣΩΠΙΚΟΣ ΜΟΥ ΧΩΡΟΣ</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#173f72]">Φωτογραφίες, βίντεο και αρχεία — δικά σου.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Ό,τι ανεβάζεις ξεκινά ιδιωτικό. Εσύ αποφασίζεις αργότερα τι θα μοιραστείς, με ποιους και πού.</p>
        </header>
        <MyMediaClient initialItems={items ?? []} backendReady={!error} userId={user.id} />
      </section>
    </main>
  );
}
