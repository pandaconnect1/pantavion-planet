"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  media_kind: "photo" | "video" | "audio" | "document" | "other";
  size_bytes: number;
  visibility: "private" | "connections" | "public";
  caption: string | null;
  created_at: string;
};

function mediaKind(type: string): MediaItem["media_kind"] {
  if (type.startsWith("image/")) return "photo";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf") || type.includes("document") || type.startsWith("text/")) return "document";
  return "other";
}

function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "file";
}

export default function MyMediaClient({ initialItems, backendReady, userId }: { initialItems: MediaItem[]; backendReady: boolean; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(backendReady ? "" : "Η προσωπική βιβλιοθήκη δεν έχει ακόμη ενεργοποιηθεί στη production βάση.");

  async function refresh() {
    const { data } = await supabase.from("personal_media").select("id,storage_path,original_name,mime_type,media_kind,size_bytes,visibility,caption,created_at").order("created_at", { ascending: false });
    if (data) setItems(data as MediaItem[]);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setMessage("");

    let uploaded = 0;
    for (const file of files) {
      const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: storageError } = await supabase.storage.from("personal-media").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (storageError) { setMessage(`Αποτυχία στο ${file.name}: ${storageError.message}`); continue; }
      const { error: dbError } = await supabase.from("personal_media").insert({
        owner_id: userId,
        storage_path: path,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        media_kind: mediaKind(file.type),
        size_bytes: file.size,
        visibility: "private",
      });
      if (dbError) {
        await supabase.storage.from("personal-media").remove([path]);
        setMessage(`Αποτυχία καταχώρισης ${file.name}: ${dbError.message}`);
        continue;
      }
      uploaded += 1;
    }

    setBusy(false);
    event.target.value = "";
    if (uploaded) setMessage(`Αποθηκεύτηκαν ${uploaded} αρχεία στον ιδιωτικό σου χώρο.`);
    await refresh();
  }

  async function remove(item: MediaItem) {
    if (!confirm(`Διαγραφή του ${item.original_name};`)) return;
    setBusy(true); setMessage("");
    const { error: storageError } = await supabase.storage.from("personal-media").remove([item.storage_path]);
    if (storageError) { setBusy(false); setMessage(storageError.message); return; }
    const { error } = await supabase.from("personal_media").delete().eq("id", item.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    await refresh();
  }

  async function open(item: MediaItem) {
    const { data, error } = await supabase.storage.from("personal-media").createSignedUrl(item.storage_path, 60);
    if (error || !data?.signedUrl) return setMessage(error?.message || "Δεν άνοιξε το αρχείο.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const groups = [
    ["photo", "Φωτογραφίες"],
    ["video", "Βίντεο"],
    ["audio", "Ήχος"],
    ["document", "Έγγραφα"],
    ["other", "Άλλα"],
  ] as const;

  return (
    <div>
      <section className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-black text-[#173f72]">Μεταφορά αρχείων</h2><p className="mt-1 text-xs leading-5 text-slate-500">Επίλεξε φωτογραφίες, βίντεο, ήχο ή έγγραφα από τη συσκευή σου. Ξεκινούν όλα ως ιδιωτικά.</p></div>
          <label className="cursor-pointer rounded-full bg-[#2467aa] px-5 py-3 text-center text-sm font-black text-white">
            {busy ? "Μεταφορά…" : "Επιλογή αρχείων"}
            <input hidden type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" disabled={busy || !backendReady} onChange={upload} />
          </label>
        </div>
        {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">{message}</p>}
      </section>

      <div className="mt-5 space-y-5">
        {groups.map(([kind, label]) => {
          const group = items.filter((item) => item.media_kind === kind);
          if (!group.length) return null;
          return <section key={kind} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-[#173f72]">{label}</h2><span className="text-xs font-black text-slate-400">{group.length}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="truncate font-black text-slate-900">{item.original_name}</p><p className="mt-1 text-xs text-slate-500">{Math.max(1, Math.round(item.size_bytes / 1024))} KB · Ιδιωτικό</p><div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => open(item)} className="rounded-full bg-[#123b67] px-3 py-2 text-xs font-black text-white">Άνοιγμα</button><button disabled={busy} onClick={() => remove(item)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Διαγραφή</button></div></article>)}</div></section>;
        })}
        {!items.length && <section className="rounded-[1.4rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Ο προσωπικός σου χώρος είναι ακόμη άδειος.</section>}
      </div>
    </div>
  );
}
