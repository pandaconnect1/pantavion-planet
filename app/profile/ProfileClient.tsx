"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPantavionPersonalizedSections, type PantavionSectionState } from "@/core/personalization/pantavion-personalized-sections";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  language: string;
};

const stateLabel: Record<PantavionSectionState, string> = {
  connected: "Συνδεδεμένο",
  building: "Σε υλοποίηση",
  foundation: "Ανακτημένο foundation",
};

const stateClass: Record<PantavionSectionState, string> = {
  connected: "bg-emerald-50 text-emerald-800",
  building: "bg-amber-50 text-amber-800",
  foundation: "bg-slate-100 text-slate-600",
};

export default function ProfileClient({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const sections = useMemo(
    () => getPantavionPersonalizedSections({ language: profile.language, country: profile.country }),
    [profile.language, profile.country],
  );

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
      language: String(data.get("language") ?? "el"),
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
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">ΤΟ PANTAVION ΜΟΥ</p>
            <h1 className="truncate text-3xl font-black text-[#173f72]">{profile.display_name || profile.username || "Pantavion User"}</h1>
            <p className="truncate text-sm text-slate-500">{email}</p>
            <p className="mt-1 text-xs text-slate-400">Η σειρά προσαρμόζεται από τη γλώσσα και τη χώρα του προφίλ σου, χωρίς να παρουσιάζει unfinished δυνατότητες ως ολοκληρωμένες.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <article key={section.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl font-black text-[#173f72]">{section.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.capabilities.map((capability) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-slate-900">{capability.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${stateClass[capability.state]}`}>{stateLabel[capability.state]}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{capability.description}</p>
                    <p className="mt-3 text-[10px] font-bold text-slate-400">Recovery provenance: PR {capability.donorPrs.map((pr) => `#${pr}`).join(", ")}</p>
                  </>
                );

                return capability.href ? (
                  <Link key={capability.id} href={capability.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50">
                    {content}
                  </Link>
                ) : (
                  <div key={capability.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {content}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
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
