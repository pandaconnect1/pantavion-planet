"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  language: string;
};

const personalAreas = [
  { href: "/contacts", title: "Οι επαφές μου", text: "Επαφές που έχεις μεταφέρει εσύ." },
  { href: "/people", title: "Άνθρωποι στο Pantavion", text: "Profiles, αιτήματα και συνδέσεις." },
  { href: "/messages", title: "Τα μηνύματά μου", text: "Οι πραγματικές συνομιλίες σου." },
  { href: "/my-media", title: "Φωτογραφίες & αρχεία", text: "Ιδιωτικός χώρος για φωτογραφίες, βίντεο, ήχο και έγγραφα." },
];

export default function ProfileClient({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim().toLowerCase();

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setSaving(false);
      setMessage("Το username πρέπει να έχει 3–30 λατινικούς χαρακτήρες, αριθμούς ή underscore.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      username,
      display_name: String(data.get("display_name") ?? "").trim(),
      avatar_url: String(data.get("avatar_url") ?? "").trim() || null,
      bio: String(data.get("bio") ?? "").trim() || null,
      country: String(data.get("country") ?? "").trim() || null,
      language: String(data.get("language") ?? "el")
    });

    setSaving(false);
    setMessage(error ? error.message : "Το προφίλ αποθηκεύτηκε.");
    if (!error) router.refresh();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  const initial = (profile.display_name || profile.username || email || "P").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-5 py-6">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-black text-[#2467aa]">{initial}</div>
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">ΤΟ ΠΡΟΦΙΛ ΜΟΥ</p><h1 className="truncate text-3xl font-black text-[#173f72]">{profile.display_name || profile.username || "Pantavion User"}</h1><p className="truncate text-sm text-slate-500">{email}</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {personalAreas.map((area) => <Link key={area.href} href={area.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50"><h2 className="font-black text-slate-900">{area.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{area.text}</p></Link>)}
        </div>
      </section>

      <form className="pv-form pv-panel" onSubmit={save}>
        <span className="pv-status">Προσωπικά στοιχεία</span>
        <h2>Επεξεργασία προφίλ</h2>
        {message ? <div className="pv-result">{message}</div> : null}

        <div className="pv-grid">
          <div className="pv-field"><label htmlFor="username">Username</label><input id="username" name="username" defaultValue={profile.username ?? ""} required /></div>
          <div className="pv-field"><label htmlFor="display_name">Όνομα εμφάνισης</label><input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} /></div>
          <div className="pv-field"><label htmlFor="country">Χώρα</label><input id="country" name="country" defaultValue={profile.country ?? ""} /></div>
          <div className="pv-field"><label htmlFor="language">Γλώσσα προφίλ</label><select id="language" name="language" defaultValue={profile.language || "el"}><option value="el">Ελληνικά</option><option value="en">English</option></select></div>
        </div>

        <div className="pv-field"><label htmlFor="avatar_url">Φωτογραφία προφίλ — σύνδεσμος</label><input id="avatar_url" name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ""} placeholder="https://…" /></div>
        <div className="pv-field"><label htmlFor="bio">Λίγα λόγια για σένα</label><textarea id="bio" name="bio" rows={5} defaultValue={profile.bio ?? ""} /></div>

        <div className="pv-actions"><button className="pv-button gold" type="submit" disabled={saving}>{saving ? "Αποθήκευση…" : "Αποθήκευση προφίλ"}</button><button className="pv-button" type="button" onClick={logout}>Αποσύνδεση</button></div>
      </form>
    </div>
  );
}
