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
  user_id: string; display_name: string | null; avatar_url: string | null;
  country_code: string | null; region: string | null; city: string | null;
  matched_by: "email" | "phone";
};
type ImportPreview = {
  filename: string;
  source: "csv" | "vcard";
  contacts: ParsedContact[];
};
const MAX_FILE_BYTES = 1_000_000;
const MAX_BATCH = 500;

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = content.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (inQuotes && input[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(field.trim()); field = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = "";
    } else field += ch;
  }
  if (inQuotes) throw new Error("Μη έγκυρο αρχείο CSV: εισαγωγικά χωρίς κλείσιμο.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseCsv(text: string): ParsedContact[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(v => v.toLowerCase().trim());
  const column = (labels: string[]) => headers.findIndex(h => labels.includes(h));
  const nameIndex = column(["name", "display_name", "full name", "fullname", "όνομα", "όνομα επαφής"]);
  const emailIndex = column(["email", "e-mail", "email address", "ηλεκτρονικό ταχυδρομείο"]);
  const phoneIndex = column(["phone", "mobile", "telephone", "tel", "phone 1 - value", "τηλέφωνο"]);
  if (nameIndex < 0 && emailIndex < 0 && phoneIndex < 0) return [];
  return rows.slice(1).map(row => ({
    display_name: nameIndex >= 0 ? row[nameIndex] || null : null,
    email: emailIndex >= 0 ? row[emailIndex] || null : null,
    phone: phoneIndex >= 0 ? row[phoneIndex] || null : null,
  })).filter(item => item.display_name || item.email || item.phone);
}

function parseVCard(text: string): ParsedContact[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  return unfolded.split(/BEGIN:VCARD/i).slice(1).map(raw => {
    const part = raw.split(/END:VCARD/i)[0] ?? "";
    const lines = part.split(/\r?\n/);
    const value = (property: string): string | null => {
      const line = lines.find(x => x.split(/[:;]/, 1)[0]?.toUpperCase() === property);
      const colon = line?.indexOf(":") ?? -1;
      return colon >= 0 ? line!.slice(colon + 1).replace(/\\n/gi, " ").trim() || null : null;
    };
    return {
      display_name: value("FN") || value("N")?.replace(/;/g, " ") || null,
      email: value("EMAIL"),
      phone: value("TEL"),
    };
  }).filter(item => item.display_name || item.email || item.phone);
}

export default function ContactsClient({
  currentUserId, initialContacts, backendReady,
}: {
  currentUserId: string;
  initialContacts: Contact[];
  backendReady: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [contacts, setContacts] = useState(initialContacts);
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [message, setMessage] = useState(backendReady ? "" : "Η βάση επαφών δεν είναι διαθέσιμη.");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [query, setQuery] = useState("");

  async function refresh() {
    const { data } = await supabase.from("contacts")
      .select("id,display_name,email,phone,linked_user_id,source_external_id,created_at")
      .eq("owner_id", currentUserId).order("display_name");
    if (data) setContacts(data as Contact[]);
  }

  async function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.rpc("pantavion_add_manual_contact", {
      p_display_name: String(form.get("name") || "").trim() || null,
      p_email: String(form.get("email") || "").trim() || null,
      p_phone: String(form.get("phone") || "").trim() || null,
    });
    setBusy(false);
    if (error) return setMessage("Δεν ολοκληρώθηκε η προσθήκη επαφής.");
    event.currentTarget.reset();
    await refresh();
  }

  async function inspectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(null);
    setConfirmed(false);
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES || file.size === 0) {
      setMessage("Το αρχείο πρέπει να είναι έως 1 MB και να μην είναι κενό.");
      return;
    }
    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".vcf") && !filename.endsWith(".csv")) {
      setMessage("Επίλεξε μόνο αρχείο .vcf ή .csv που εξήγαγες νόμιμα.");
      return;
    }
    try {
      const text = await file.text();
      const source = filename.endsWith(".vcf") ? "vcard" : "csv";
      const parsed = source === "vcard" ? parseVCard(text) : parseCsv(text);
      if (!parsed.length || parsed.length > MAX_BATCH) {
        setMessage("Επίλεξε αρχείο με 1 έως 500 επαφές και γνωστές στήλες ονόματος, email ή τηλεφώνου.");
        return;
      }
      setPreview({ filename: file.name, source, contacts: parsed });
      setMessage(`Εντοπίστηκαν ${parsed.length} επαφές. Εξέτασέ τες πριν επιβεβαιώσεις.`);
    } catch {
      setMessage("Το αρχείο δεν αναγνωρίστηκε. Δεν μεταφέρθηκε κανένα δεδομένο.");
    }
  }

  async function importApproved() {
    if (!preview || !confirmed || busy || !backendReady) return;
    setBusy(true); setMessage("");
    try {
      // The opt-in is explicit. No upload occurred during file inspection.
      const { error: permissionError } = await supabase
        .from("user_privacy_settings")
        .upsert({ user_id: currentUserId, contact_import_enabled: true }, { onConflict: "user_id" });
      if (permissionError) { setMessage("Δεν ενεργοποιήθηκε η επιλογή εισαγωγής επαφών."); return; }
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType: preview.source,
          filename: preview.filename,
          contacts: preview.contacts,
          confirmed: true,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        setMessage("Δεν ολοκληρώθηκε η εισαγωγή. Έλεγξε τα δικαιώματα και τη μορφή αρχείου.");
        return;
      }
      setMessage(`Εισήχθησαν ${Number(result.importedCount ?? 0)} νέες ιδιωτικές επαφές. Τυχόν διπλότυπα παραλείφθηκαν.`);
      setPreview(null); setConfirmed(false);
      await refresh();
    } finally { setBusy(false); }
  }

  async function disableImports() {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("pantavion_revoke_contact_import");
    setBusy(false);
    setMessage(error
      ? "Δεν έγινε απενεργοποίηση. Έλεγξε τις ρυθμίσεις ιδιωτικότητας."
      : "Η μελλοντική εισαγωγή επαφών απενεργοποιήθηκε. Οι ήδη εισαγμένες επαφές δεν διαγράφονται αυτόματα.");
    setPreview(null); setConfirmed(false);
  }

  async function findMyPeople() {
    if (!contacts.length || busy) return;
    setBusy(true); setMessage(""); setMatches([]);
    try {
      const response = await fetch("/api/people/find-from-contacts", { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage("Δεν ολοκληρώθηκε η ιδιωτική αναζήτηση.");
      const found = (json.matches ?? []) as DiscoveryMatch[];
      setMatches(found);
      setMessage(found.length
        ? `Βρέθηκαν ${found.length} επαφές που είναι ήδη στο Pantavion.`
        : "Δεν βρέθηκε ακόμη κάποια από αυτές τις επαφές στο Pantavion.");
    } finally { setBusy(false); }
  }

  const filteredContacts = contacts.filter(c => {
    const q = query.trim().toLowerCase();
    return !q || [c.display_name, c.email, c.phone].some(s => s?.toLowerCase().includes(q));
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <section>
          <h2 className="text-xl font-black text-[#173f72]">Προσθήκη επαφής</h2>
          <form className="mt-3 space-y-3" onSubmit={addManual}>
            <input name="name" placeholder="Όνομα" className="w-full rounded-xl border border-slate-200 p-3" />
            <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 p-3" />
            <input name="phone" placeholder="Τηλέφωνο" className="w-full rounded-xl border border-slate-200 p-3" />
            <button disabled={busy || !backendReady} className="w-full rounded-full bg-[#2467aa] p-3 font-black text-white disabled:opacity-40">Προσθήκη</button>
          </form>
        </section>
        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-lg font-black text-[#173f72]">Μεταφορά από κινητό ή εφαρμογή</h3>
          <p className="mt-2 text-sm text-slate-600">
            Επίλεξε προσωπικό αρχείο .vcf ή .csv. Θα δεις πρώτα τα ονόματα και θα αποφασίσεις
            εσύ αν θα εισαχθούν. Καμία επαφή δεν αποστέλλεται όταν απλώς διαλέγεις το αρχείο.
          </p>
          <input className="mt-3 block w-full text-xs" type="file" accept=".vcf,.csv,text/vcard,text/csv"
            disabled={busy || !backendReady} onChange={inspectImport} />
          {preview && (
            <div className="mt-4 rounded-xl border border-blue-200 p-3">
              <p className="font-bold text-[#173f72]">{preview.contacts.length} επαφές · {preview.filename}</p>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-700">
                {preview.contacts.slice(0, 12).map((c, i) => (
                  <p key={i} className="border-b border-slate-100 py-1">
                    {c.display_name || c.email || c.phone || "Επαφή"}
                  </p>
                ))}
                {preview.contacts.length > 12 && <p>Και {preview.contacts.length - 12} ακόμη…</p>}
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  className="mt-1" />
                <span>
                  Επιβεβαιώνω ότι έχω δικαίωμα να εισαγάγω αυτές τις επαφές και ενεργοποιώ
                  ρητά την ιδιωτική εισαγωγή στο Pantavion. Η επιλογή παραμένει ενεργή
                  μέχρι να την απενεργοποιήσω. Δεν συνδέονται αυτόματα εξωτερικοί λογαριασμοί
                  ούτε αποστέλλονται προσκλήσεις.
                </span>
              </label>
              <div className="mt-3 flex gap-2">
                <button disabled={!confirmed || busy} onClick={importApproved} type="button"
                  className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white disabled:opacity-40">
                  Επιβεβαίωση και εισαγωγή
                </button>
                <button onClick={() => { setPreview(null); setConfirmed(false); }} type="button"
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs">Ακύρωση</button>
              </div>
            </div>
          )}
          <button type="button" onClick={disableImports} disabled={busy}
            className="mt-3 text-xs font-semibold text-slate-600 underline">
            Απενεργοποίηση μελλοντικής εισαγωγής
          </button>
        </section>
        <section className="border-t border-slate-100 pt-4">
          <h3 className="font-black text-[#173f72]">Βρες τους ανθρώπους σου</h3>
          <p className="mt-1 text-xs text-slate-600">Προαιρετική αναζήτηση με δική σου ενέργεια, χωρίς δημοσίευση των επαφών.</p>
          <button type="button" disabled={busy || !backendReady || !contacts.length}
            onClick={findMyPeople} className="mt-3 rounded-full bg-[#123b67] p-3 text-xs font-bold text-white disabled:opacity-40">
            {busy ? "Εργασία…" : "Βρες φίλους στο Pantavion"}
          </button>
        </section>
        {message && <p role="status" className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700">{message}</p>}
      </aside>
      <section className="space-y-5">
        {matches.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Άνθρωποι που βρέθηκαν</h2>
            {matches.map(m => (
              <div key={m.user_id + m.matched_by} className="flex items-center justify-between border-b py-3">
                <div>
                  <p className="font-bold">{m.display_name || "Pantavion user"}</p>
                  <p className="text-xs text-slate-500">{[m.city,m.region,m.country_code].filter(Boolean).join(" · ")}</p>
                </div>
                <Link className="rounded-full bg-[#2467aa] px-3 py-2 text-xs text-white" href="/people">Άνοιγμα</Link>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Οι ιδιωτικές επαφές μου ({contacts.length})</h2>
          </div>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Αναζήτηση ονόματος, email ή τηλεφώνου"
            className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" />
          <div className="mt-4 divide-y divide-slate-100">
            {filteredContacts.map(c => (
              <div key={c.id} className="py-3">
                <p className="truncate font-bold">{c.display_name || c.email || c.phone || "Επαφή"}</p>
                <p className="truncate text-xs text-slate-500">{[c.email,c.phone].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
            {!filteredContacts.length && <p className="py-8 text-sm text-slate-500">Δεν υπάρχουν επαφές για εμφάνιση.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
