"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Street = {
  id: string; name_el: string | null; name_lat: string | null;
  district_name: string | null; municipality_or_community: string | null;
  area_or_parish: string | null; zone_or_section: string | null;
  source: string | null; status: string | null;
};

function waterAccessHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const get = (...keys: string[]) => keys.map((k) => { try { return window.localStorage.getItem(k) || ""; } catch { return ""; } }).find(Boolean) || "";
  const deviceId = get("pantavion:water:device-id:v1", "pantavion_water_device_id", "pantavion-water-device-id", "waterDeviceId");
  const deviceToken = get("pantavion:water:device-token:v1", "pantavion_water_device_token", "pantavion-water-device-token", "waterDeviceToken");
  return deviceId && deviceToken
    ? { "x-pantavion-water-device-id": deviceId, "x-pantavion-water-device-token": deviceToken }
    : {};
}


export default function WaterStreetDirectoryPage() {
  const [q, setQ] = useState("");
  const [locality, setLocality] = useState("");
  const [rows, setRows] = useState<Street[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    setRows([]); setTotal(0); setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ view: "streets", q, locality, offset: String(offset), limit: "200" });
        const response = await fetch(`/api/professional/infrastructure/water/register?${p}`, {
          credentials: "include", headers: waterAccessHeaders(), signal: controller.signal,
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !data.ok) { setStatus(response.status === 403 ? "denied" : "error"); return; }
        setRows(data.streets); setTotal(data.total); setStatus("ready");
      } catch { if (!controller.signal.aborted) setStatus("error"); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, locality, offset, version]);

  return <main className="min-h-screen bg-[#050b16] p-4 text-white">
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-3xl border border-slate-700 bg-[#091426] p-5">
        <a href="/professional/infrastructure/water/register" className="text-sky-200">← Μητρώο βανών SV</a>
        <h1 className="mt-4 text-3xl font-bold">Οδοί επαρχίας Λεμεσού</h1>
        <p className="mt-2 text-slate-300">Δήμος / κοινότητα → περιοχή → ζώνη → οδός. Περιλαμβάνει καταγεγραμμένες οδούς ανεξάρτητα από την ύπαρξη βάνας.</p>
        <p className="mt-2 text-amber-200">Η πληρότητα του καταλόγου δεν έχει ακόμη επιβεβαιωθεί. Κενά στοιχεία περιοχής ή ζώνης εμφανίζονται ως μη καταγεγραμμένα.</p>
      </header>
      <Link href="/professional/infrastructure/water/field/road" className="inline-block rounded-xl border border-emerald-400 p-3">+ Προσθήκη οδού σε νέα ή υπάρχουσα περιοχή</Link>
      <label className="block">Περιοχή / δήμος / χωριό
        <input value={locality} onChange={(e) => { setOffset(0); setLocality(e.target.value); }} placeholder="Όνομα περιοχής ή χωριού" className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3" />
      </label>
      <label className="block">Αναζήτηση οδού, δήμου, περιοχής ή ζώνης
        <input value={q} onChange={(e) => { setOffset(0); setQ(e.target.value); }} placeholder="Γράψε όνομα οδού ή περιοχής" className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3" />
      </label>
      <p role="status" aria-live="polite">{status === "loading" ? "Φόρτωση…" : status === "denied" ? "Απαιτείται εγκεκριμένη πρόσβαση Ύδρευσης." : status === "error" ? "Ο κατάλογος δεν φορτώθηκε." : `${total} καταγεγραμμένες οδοί · ${rows.length ? offset + 1 : 0}–${offset + rows.length}`}</p>
      {status === "error" ? <button type="button" onClick={() => setVersion((v) => v + 1)} className="rounded-xl border p-3">Επανάληψη</button> : null}
      {status === "ready" && !rows.length ? <p>Δεν βρέθηκαν καταγεγραμμένες οδοί με αυτή την αναζήτηση.</p> : null}
      {rows.length ? <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <caption className="p-3 text-left">Οδοί ανά δήμο, περιοχή και ζώνη</caption>
          <thead><tr>{["Δήμος / κοινότητα", "Περιοχή", "Ζώνη", "Οδός", "Λατινική ονομασία", "Πηγή"].map((title) => <th scope="col" key={title} className="p-3 text-amber-200">{title}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-slate-700">
            <td className="p-3">{r.municipality_or_community || "Μη καταγεγραμμένος"}</td>
            <td className="p-3">{r.area_or_parish || "Μη καταγεγραμμένη"}</td>
            <td className="p-3">{r.zone_or_section || "Μη καταγεγραμμένη"}</td>
            <td className="p-3 font-bold">{r.name_el || r.name_lat || "Χωρίς ονομασία"}</td>
            <td className="p-3">{r.name_lat || "—"}</td><td className="p-3">{r.source || "Μη καταγεγραμμένη"}</td>
          </tr>)}</tbody>
        </table>
      </div> : null}
      {status === "ready" ? <nav aria-label="Σελίδες καταλόγου οδών" className="flex gap-3">
        <button type="button" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 200))} className="rounded-xl border p-3 disabled:opacity-40">Προηγούμενες</button>
        <button type="button" disabled={offset + rows.length >= total} onClick={() => setOffset(offset + 200)} className="rounded-xl border p-3 disabled:opacity-40">Επόμενες</button>
      </nav> : null}
    </section>
  </main>;
}
