import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export const dynamic = "force-dynamic";

function label(type: string) {
  const labels: Record<string, string> = { follow: "Νέος ακόλουθος", friend_request: "Αίτημα σύνδεσης", friend_accepted: "Αποδοχή σύνδεσης", reaction: "Νέα αντίδραση", comment: "Νέο σχόλιο", message: "Νέο μήνυμα", community: "Ενημέρωση κοινότητας", system: "Pantavion" };
  return labels[type] || type.replaceAll("_", " ");
}

function text(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Νέα ειδοποίηση.";
  const data = payload as Record<string, unknown>;
  const value = data.message ?? data.text ?? data.body ?? data.title;
  return typeof value === "string" && value.trim() ? value : "Νέα ειδοποίηση.";
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/notifications");

  const readiness = await supabase.from("social_notifications").select("id", { head: true, count: "exact" }).limit(1);
  if (readiness.error) return <main className="min-h-screen bg-[#f4f8fc] p-6"><section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-6"><h1 className="text-3xl font-black text-[#173f72]">Ειδοποιήσεις</h1><p className="mt-3 text-slate-600">Η recovered επιφάνεια είναι έτοιμη, αλλά το notifications schema δεν έχει ακόμη εφαρμοστεί στο ενεργό production database.</p><Link href="/social" className="mt-5 inline-block font-black text-[#2467aa]">← Social</Link></section></main>;

  const { data, error } = await supabase.from("social_notifications").select("id,type,payload,read_at,created_at,actor_id").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100);
  const items = data ?? [];
  const unread = items.filter((item: any) => !item.read_at).length;

  return <main className="min-h-screen bg-[#f4f8fc] px-4 py-6 text-slate-950"><section className="mx-auto max-w-4xl">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#3474b8]">PANTAVION SOCIAL</p><h1 className="mt-2 text-4xl font-black text-[#173f72]">Ειδοποιήσεις</h1><p className="mt-1 text-sm text-slate-500">{unread} αδιάβαστες · {items.length} πρόσφατες</p></div><div className="flex gap-2">{unread > 0 ? <form action={markAllNotificationsRead}><button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black">Όλες διαβασμένες</button></form> : null}<Link href="/social" className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white no-underline">Social</Link></div></header>
    {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div> : null}
    <div className="grid gap-3">{items.length ? items.map((item:any)=><article key={item.id} className={`grid gap-3 rounded-2xl border p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center ${item.read_at ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}><div><div className="flex items-center gap-2"><strong>{label(item.type)}</strong>{!item.read_at ? <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">ΝΕΟ</span> : null}</div><p className="mt-1 text-sm text-slate-600">{text(item.payload)}</p><time className="mt-1 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</time></div>{!item.read_at ? <form action={markNotificationRead}><input type="hidden" name="notificationId" value={item.id}/><button className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white">Διαβάστηκε</button></form> : null}</article>) : <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Δεν υπάρχουν ακόμη ειδοποιήσεις.</div>}</div>
  </section></main>;
}
