"use client";

import { useEffect, useState } from "react";
import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

type Addition = { patch_id: string; asset_type: string; street_name: string | null; area: string | null; status: string; created_at: string; attributes?: { zone?: string; officialAssetId?: string } };
const labels: Record<string, string> = { valve: "Βάνα", network_extension: "Δίκτυο", road_reference: "Οδός" };

export default function WaterFieldAdditions() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Addition[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setStatus("Φόρτωση…");
    fetch("/api/professional/infrastructure/water/changes/patches?mine=1&limit=500", {
      credentials: "include", cache: "no-store", headers: pantavionWaterApprovedDeviceHeaders(), signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("read_failed");
      if (controller.signal.aborted) return;
      setRows((data.patches ?? []).filter((r: Addition) => r.asset_type in labels));
      setStatus(data.patches?.length >= 500 ? "Εμφανίζονται έως 500 πρόσφατες καταγραφές." : "");
    }).catch(() => { if (!controller.signal.aborted) { setRows([]); setStatus("Οι προσθήκες δεν φορτώθηκαν. Πατήστε επανάληψη."); } });
    return () => controller.abort();
  }, [open, version]);
  const key = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR");
  const tokens = key(query).split(/\s+/).filter(Boolean);
  const filtered = rows.filter((r) => tokens.every((t) => key([r.patch_id, r.street_name, r.area, r.attributes?.zone, r.attributes?.officialAssetId].filter(Boolean).join(" ")).includes(t)))
    .sort((a, b) => [a.area, a.street_name, a.patch_id].join(" ").localeCompare([b.area, b.street_name, b.patch_id].join(" "), "el"));
  return <section className="space-y-3 rounded-2xl border border-slate-700 p-4">
    <h2 className="text-xl font-bold">Προσθήκες πεδίου</h2>
    <div className="flex flex-wrap gap-3">{[["road", "Νέα οδός"], ["network-extension", "Νέο δίκτυο"], ["valve", "Νέα βάνα"]].map(([path, label]) => <a key={path} href={`/professional/infrastructure/water/field/${path}`} className="rounded-xl border border-emerald-400 p-3">+ {label}</a>)}</div>
    <p>Επιτρέπεται ελεύθερη καταχώριση περιοχής, χωριού, ζώνης και οδού. Κάθε προσθήκη παίρνει μοναδικό αριθμό καταγραφής. Ο επίσημος SV δηλώνεται χωριστά, αν είναι γνωστός.</p>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-xl border p-3">Πρόσφατες διαθέσιμες προσθήκες {open ? "▴" : "▾"}</button>
    {open ? <>
      <label className="block">Αναζήτηση αριθμού καταγραφής, SV, οδού, περιοχής ή ζώνης<input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3" /></label>
      <p role="status">{status || `${filtered.length} προσθήκες · οι εκκρεμείς καταγραφές εμφανίζονται μόνο στον συντάκτη τους και στους αρμόδιους ελέγχου.`}</p>
      <button type="button" onClick={() => setVersion((v) => v + 1)} className="rounded-xl border p-2">Επανάληψη / ανανέωση</button>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption>Πρόσφατες καταγραφές ανά περιοχή και οδό</caption><thead><tr>{["Αριθμός καταγραφής", "SV", "Είδος", "Περιοχή", "Οδός", "Ζώνη", "Κατάσταση"].map((h) => <th className="p-2" scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{filtered.map((r) => <tr key={r.patch_id} className="border-t border-slate-700"><td className="p-2">{r.patch_id}</td><td>{r.attributes?.officialAssetId || "—"}</td><td>{labels[r.asset_type]}</td><td>{r.area || "—"}</td><td>{r.street_name || "Ανώνυμη οδός / σημείο"}</td><td>{r.attributes?.zone || "—"}</td><td>{r.status === "pending_review" ? "Αναμονή ελέγχου" : r.status}</td></tr>)}</tbody></table></div>
    </> : null}
  </section>;
}
