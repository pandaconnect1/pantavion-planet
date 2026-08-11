"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  linked_user_id: string | null;
  source_external_id: string | null;
  created_at: string;
};

type ParsedContact = { display_name: string | null; email: string | null; phone: string | null };

type DiscoveryMatch = {
  contact_id: string;
  user_id: string;
  match_kind: "email" | "phone";
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  language: string | null;
};

function parseVCard(text: string): ParsedContact[] {
  return text
    .split(/END:VCARD/i)
    .map((chunk) => {
      const name = chunk.match(/(?:^|\n)FN[^:]*:(.+)/i)?.[1]?.trim() ?? null;
      const email = chunk.match(/(?:^|\n)EMAIL[^:]*:(.+)/i)?.[1]?.trim() ?? null;
      const phone = chunk.match(/(?:^|\n)TEL[^:]*:(.+)/i)?.[1]?.trim() ?? null;
      return { display_name: name, email, phone };
    })
    .filter((item) => item.display_name || item.email || item.phone);
}

function parseCsv(text: string): ParsedContact[] {
  const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (!rows.length) return [];
  const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
  const nameIdx = idx(["name", "display_name", "full name", "fullname"]);
  const emailIdx = idx(["email", "e-mail"]);
  const phoneIdx = idx(["phone", "mobile", "telephone", "tel"]);
  return rows.slice(1).map((row) => {
    const cells = row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    return {
      display_name: nameIdx >= 0 ? cells[nameIdx] || null : null,
      email: emailIdx >= 0 ? cells[emailIdx] || null : null,
      phone: phoneIdx >= 0 ? cells[phoneIdx] || null : null,
    };
  }).filter((item) => item.display_name || item.email || item.phone);
}

export default function ContactsClient({ initialContacts, backendReady }: { initialContacts: Contact[]; backendReady: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [contacts, setContacts] = useState(initialContacts);
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [message, setMessage] = useState(backendReady ? "" : "Η βάση επαφών δεν είναι ακόμη διαθέσιμη στο production.");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase.from("contacts").select("id,display_name,email,phone,linked_user_id,source_external_id,created_at").order("display_name");
    if (data) setContacts(data as Contact[]);
  }

  async function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); setMessage("Χρειάζεται σύνδεση."); return; }
    const { error } = await supabase.from("contacts").insert({
      owner_id: auth.user.id,
      display_name: String(form.get("name") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      metadata: { imported_via: "manual" },
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    event.currentTarget.reset();
    await refresh();
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage("");
    const text = await file.text();
    const parsed = file.name.toLowerCase().endsWith(".vcf") ? parseVCard(text) : parseCsv(text);
    if (!parsed.length) { setBusy(false); setMessage("Δεν βρέθηκαν επαφές στο αρχείο."); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); setMessage("Χρειάζεται σύνδεση."); return; }
    const { data: consent, error: consentError } = await supabase.from("consent_records").insert({
      user_id: auth.user.id,
      purpose: "contact_import",
      status: "granted",
      source: "user_file_import",
      granted_at: new Date().toISOString(),
      metadata: { filename: file.name, count: parsed.length },
    }).select("id").single();
    if (consentError) { setBusy(false); setMessage(consentError.message); return; }
    const { data: source, error: sourceError } = await supabase.from("contact_sources").insert({
      owner_id: auth.user.id,
      source_type: file.name.toLowerCase().endsWith(".vcf") ? "vcard" : "csv",
      consent_record_id: consent.id,
      status: "active",
      last_synced_at: new Date().toISOString(),
    }).select("id").single();
    if (sourceError) { setBusy(false); setMessage(sourceError.message); return; }
    const { error } = await supabase.from("contacts").insert(parsed.map((item, index) => ({
      owner_id: auth.user!.id,
      source_id: source.id,
      source_external_id: `${file.name}:${index}`,
      ...item,
      metadata: { imported_via: "file", filename: file.name },
    })));
    setBusy(false);
    if (error) return setMessage(error.message);
    setMessage(`Μεταφέρθηκαν ${parsed.length} επαφές.`);
    event.target.value = "";
    await refresh();
  }

  async function findMyPeople() {
    if (!contacts.length || busy) return;
    setBusy(true); setMessage(""); setMatches([]);
    const response = await fetch("/api/people/find-from-contacts", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(json.detail || "Δεν ολοκληρώθηκε η αναζήτηση.");
    setMatches((json.matches ?? []) as DiscoveryMatch[]);
    await refresh();
    setMessage(json.matches?.length ? `Βρέθηκαν ${json.matches.length} επαφές που είναι ήδη στο Pantavion.` : "Δεν βρέθηκε ακόμη κάποια από αυτές τις επαφές στο Pantavion.");
  }

  const matchByContact = useMemo(() => new Map(matches.map((match) => [match.contact_id, match])), [matches]);

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-[#173f72]">Προσθήκη επαφών</h2>
        <form className="mt-4 space-y-3" onSubmit={addManual}>
          <input name="name" placeholder="Όνομα" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          <input name="phone" placeholder="Τηλέφωνο" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          <button disabled={busy || !backendReady} className="w-full rounded-full bg-[#2467aa] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">Προσθήκη</button>
        </form>
        <div className="my-5 h-px bg-slate-100" />
        <label className="block text-sm font-black text-slate-700">Μεταφορά από αρχείο</label>
        <p className="mt-1 text-xs leading-5 text-slate-500">Δέχεται vCard (.vcf) ή CSV που έχεις εξαγάγει εσύ από κινητό ή άλλη υπηρεσία.</p>
        <input className="mt-3 block w-full text-xs" type="file" accept=".vcf,.csv,text/vcard,text/csv" disabled={busy || !backendReady} onChange={importFile} />

        <div className="my-5 h-px bg-slate-100" />
        <h3 className="text-sm font-black text-slate-800">Βρες τους ανθρώπους σου</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Με δική σου επιλογή, το Pantavion ελέγχει ιδιωτικά ποιες επαφές σου έχουν λογαριασμό. Δεν εμφανίζει email ή τηλέφωνα άλλων χρηστών.</p>
        <button type="button" disabled={busy || !backendReady || !contacts.length} onClick={findMyPeople} className="mt-3 w-full rounded-full bg-[#123b67] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">{busy ? "Αναζήτηση…" : "Βρες φίλους στο Pantavion"}</button>
        {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">{message}</p>}
      </aside>

      <section className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="text-xl font-black text-[#173f72]">Οι επαφές μου</h2><span className="text-xs font-black text-slate-400">{contacts.length}</span></div>
        <div className="mt-4 divide-y divide-slate-100">
          {contacts.map((contact) => {
            const match = matchByContact.get(contact.id);
            return (
              <div key={contact.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate font-black text-slate-900">{match?.display_name || match?.username || contact.display_name || contact.email || contact.phone || "Επαφή"}</p><p className="truncate text-xs text-slate-500">{match ? [match.country, match.language].filter(Boolean).join(" · ") || "Στο Pantavion" : [contact.email, contact.phone].filter(Boolean).join(" · ")}</p></div>
                <div className="flex shrink-0 items-center gap-2">
                  {contact.linked_user_id || match ? <><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Στο Pantavion</span><Link href="/people" className="rounded-full bg-[#2467aa] px-3 py-2 text-[10px] font-black text-white no-underline">Άνοιγμα</Link></> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">Εισαγμένη επαφή</span>}
                </div>
              </div>
            );
          })}
          {!contacts.length && <p className="py-8 text-sm text-slate-500">Δεν έχεις μεταφέρει ακόμη επαφές.</p>}
        </div>
      </section>
    </div>
  );
}
