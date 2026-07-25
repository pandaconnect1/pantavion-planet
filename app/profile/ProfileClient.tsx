"use client";

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

  return (
    <form className="pv-form pv-panel" onSubmit={save}>
      <span className="pv-status">Pantavion Profile</span>
      <h1>Το προφίλ σου</h1>
      <p className="pv-muted">Συνδεδεμένος ως {email}</p>

      {message ? <div className="pv-result">{message}</div> : null}

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" defaultValue={profile.username ?? ""} required />
        </div>
        <div className="pv-field">
          <label htmlFor="display_name">Display name</label>
          <input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} />
        </div>
        <div className="pv-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" defaultValue={profile.country ?? ""} />
        </div>
        <div className="pv-field">
          <label htmlFor="language">Language</label>
          <select id="language" name="language" defaultValue={profile.language || "el"}>
            <option value="el">Ελληνικά</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="pv-field">
        <label htmlFor="avatar_url">Avatar URL</label>
        <input id="avatar_url" name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ""} />
      </div>

      <div className="pv-field">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={5} defaultValue={profile.bio ?? ""} />
      </div>

      <div className="pv-actions">
        <button className="pv-button gold" type="submit" disabled={saving}>
          {saving ? "Αποθήκευση…" : "Αποθήκευση προφίλ"}
        </button>
        <button className="pv-button" type="button" onClick={logout}>Logout</button>
      </div>
    </form>
  );
}
