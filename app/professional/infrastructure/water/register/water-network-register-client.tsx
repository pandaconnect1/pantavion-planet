"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WaterFieldAdditions from "./water-field-additions";
import WaterDrawingDiscovery from "./water-drawing-discovery";
import { collectWaterRegisterPrintRows } from "@/core/infrastructure/water/water-register-print";

type Area = { code: string; outline: "closed" | "hull"; area_m2: number; centroid_x: number; centroid_y: number; group_name: string | null };
type Count = { area_code: string | null; kind: string; n: number; streets: number };
type Asset = {
  number: string; kind: string; dn: number | null; x: number; y: number; layer: string | null;
  area_code: string | null; street: string | null; street_distance: number | null; tag: string | null;
  name: string | null; capacity_m3: number | null; proposed: boolean; origin: string;
};

const KIND_LABEL: Record<string, string> = {
  valve: "Βάνα / ρεούλα",
  air_valve: "Αεροβαλβίδα",
  hydrant: "Υδροστόμιο",
  pressure_reducing_valve: "Μειωτής πίεσης",
  tank: "Δεξαμενή",
};

// Same approved-device headers as the water maps; without them the API refuses.
function waterAccessHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const get = (...keys: string[]) => keys.map((k) => { try { return window.localStorage.getItem(k) || ""; } catch { return ""; } }).find(Boolean) || "";
  const deviceId = get("pantavion:water:device-id:v1", "pantavion_water_device_id", "pantavion-water-device-id", "waterDeviceId");
  const deviceToken = get("pantavion:water:device-token:v1", "pantavion_water_device_token", "pantavion-water-device-token", "waterDeviceToken");
  return deviceId && deviceToken
    ? { "x-pantavion-water-device-id": deviceId, "x-pantavion-water-device-token": deviceToken }
    : {};
}

const fmt = (v: number) => new Intl.NumberFormat("el-GR").format(v);

export default function WaterNetworkRegisterClient() {
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaError, setAreaError] = useState(false);
  const [counts, setCounts] = useState<Count[]>([]);
  const [area, setArea] = useState<string>("");
  const [kind, setKind] = useState<string>("valve");
  const [q, setQ] = useState("");
  const [sv, setSv] = useState("");
  const [street, setStreet] = useState("");
  const [printRows, setPrintRows] = useState<Asset[] | null>(null);
  const [printTitle, setPrintTitle] = useState("");
  const [printStatus, setPrintStatus] = useState("");
  const [printing, setPrinting] = useState(false);
  const printAbortRef = useRef<AbortController | null>(null);
  const [zone, setZone] = useState("");
  const [sort, setSort] = useState("area");
  const requestRef = useRef<AbortController | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/professional/infrastructure/water/register?view=areas", { credentials: "include", headers: waterAccessHeaders() })
      .then(async (r) => {
        if (r.status === 403) { if (!cancelled) setStatus("denied"); return; }
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error("REGISTER_AREAS_READ_FAILED");
        if (cancelled) return;
        setAreas(j.areas ?? []);
        setCounts(j.counts ?? []);
      })
      .catch(() => !cancelled && setAreaError(true));
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async (from: number) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    if (from === 0) { setAssets([]); setTotal(0); setOffset(0); }
    const p = new URLSearchParams({ offset: String(from), limit: "500" });
    p.set("sort", sort);
    if (zone) p.set("zone", zone);
    if (area) p.set("area", area);
    if (kind) p.set("kind", kind);
    if (q.trim()) p.set("q", q.trim());
    if (sv.trim()) p.set("sv", sv.trim());
    if (street.trim()) p.set("street", street.trim());
    try {
      const r = await fetch(`/api/professional/infrastructure/water/register?${p}`, { credentials: "include", headers: waterAccessHeaders(), signal: controller.signal });
      if (controller.signal.aborted) return;
      if (r.status === 403) { setAssets([]); setTotal(0); setOffset(0); setStatus("denied"); return; }
      const j = await r.json();
      if (controller.signal.aborted) return;
      if (!r.ok || !j.ok) throw new Error(j.error);
      setAssets(from === 0 ? j.assets : (prev) => [...prev, ...j.assets]);
      setTotal(j.total);
      setOffset(from + j.assets.length);
      setStatus("idle");
    } catch {
      if (controller.signal.aborted) return;
      setAssets([]); setTotal(0); setOffset(0);
      setStatus("error");
    }
  }, [area, kind, q, zone, sort, sv, street]);

  useEffect(() => {
    const t = setTimeout(() => void load(0), 250);
    return () => { clearTimeout(t); requestRef.current?.abort(); };
  }, [load]);

  useEffect(() => () => { printAbortRef.current?.abort(); }, []);

  useEffect(() => {
    if (printRows === null) return;
    const clear = () => { setPrintRows(null); setPrinting(false); };
    window.addEventListener("afterprint", clear);
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => window.print()); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); window.removeEventListener("afterprint", clear); };
  }, [printRows]);

  async function preparePrint(all: boolean) {
    if (printing) return;
    const controller = new AbortController();
    printAbortRef.current = controller;
    setPrinting(true); setPrintRows(null); setPrintStatus("Προετοιμασία όλων των σελίδων…");
    const p = new URLSearchParams({ limit: "500", sort, kind: all ? "valve" : kind });
    if (!all) {
      for (const [key, value] of Object.entries({ q, sv, street, area, zone })) if (value.trim()) p.set(key, value.trim());
    }
    const title = all ? "Πλήρης κατάλογος καταγεγραμμένων βανών" : `Επιλεγμένες καταγραφές · ${[sv, street, area, zone, q].filter(Boolean).join(" · ") || "όλα τα φίλτρα"}`;
    try {
      const rows = await collectWaterRegisterPrintRows<Asset>(async (from) => {
        p.set("offset", String(from));
        const response = await fetch(`/api/professional/infrastructure/water/register?${p}`, {
          credentials: "include", headers: waterAccessHeaders(), signal: controller.signal, cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error("print_read_failed");
        return data;
      });
      if (controller.signal.aborted) return;
      if (!rows.length) { setPrintStatus("Δεν υπάρχουν εγγραφές για εκτύπωση."); setPrinting(false); return; }
      setPrintTitle(title); setPrintStatus(`Έτοιμες ${fmt(rows.length)} εγγραφές.`); setPrintRows(rows);
    } catch {
      if (!controller.signal.aborted) setPrintStatus("Η εκτύπωση δεν προετοιμάστηκε πλήρως. Δοκιμάστε ξανά.");
      setPrinting(false);
    }
  }

  const areaTotals = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const c of counts) {
      const k = c.area_code ?? "none";
      const row = m.get(k) ?? {};
      row[c.kind] = c.n;
      m.set(k, row);
    }
    return m;
  }, [counts]);

  const alphabeticalAreas = useMemo(() => [...areas].sort((a, b) =>
    a.code.localeCompare(b.code, "el", { numeric: true })), [areas]);
  const zones = useMemo(() => [...new Set(areas.map((a) => a.group_name).filter((v): v is string => !!v))]
    .sort((a, b) => a.localeCompare(b, "el")), [areas]);
  const areaByCode = useMemo(() => new Map(areas.map((a) => [a.code, a])), [areas]);

  const mapLink = (a: Asset) =>
    `/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap&viewId=D&x=${a.x}&y=${a.y}&asset=${encodeURIComponent(a.number)}`;

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5 print:hidden">
        <header className="rounded-3xl border border-amber-300/30 bg-[#091426] p-5">
          <a href="/professional/infrastructure/water" className="text-sm font-black text-amber-300">← Πίσω στην Ύδρευση</a>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">Pantavion Water · Μητρώο Δικτύου</p>
          <a href="/professional/infrastructure/water/register/streets" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-xl border border-sky-400 p-3 text-sky-200">Κατάλογος όλων των καταγεγραμμένων οδών ↗</a>
          <a href="/professional/infrastructure/water/register/supply" target="_blank" rel="noopener noreferrer" className="ml-3 mt-3 inline-block rounded-xl border border-cyan-400 p-3 text-cyan-200">Δεξαμενές και στοιχεία τροφοδοσίας ↗</a>
          <h1 className="mt-2 text-3xl font-black">Μητρώο βανών SV και εξαρτημάτων</h1>
          <p className="mt-2 text-sm font-bold text-slate-300">
            Καταγραφές από το DWG Β. Ο αριθμός μητρώου και η αρχική ετικέτα SV εμφανίζονται χωριστά.
            Η πλησιέστερη οδός του σχεδίου δεν αποτελεί επιβεβαιωμένη διεύθυνση.
            Προβολή θέσης στον χάρτη Δ.
          </p>
        </header>

        {status === "denied" ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 font-bold">
            Το μητρώο είναι διαθέσιμο μόνο σε εγκεκριμένες συσκευές Ύδρευσης.
          </p>
        ) : null}

        <WaterFieldAdditions />
        <button type="button" aria-expanded={showDiscovery} onClick={() => setShowDiscovery(v => !v)} className="rounded-xl border border-emerald-400 p-3">Στοιχεία DWG και έλεγχος παραλείψεων {showDiscovery ? "▴" : "▾"}</button>
        {showDiscovery ? <WaterDrawingDiscovery queryValue={q || street || sv} onQueryChange={value => { setQ(value); setStreet(""); setSv(""); }} /> : null}

        {areaError ? <p role="alert" className="text-amber-200">Ο κατάλογος περιοχών και ζωνών δεν φορτώθηκε. Ανανεώστε τη σελίδα για επανάληψη.</p> : null}

        <section className="grid gap-3 rounded-3xl border border-slate-700 bg-[#091426] p-4 sm:grid-cols-3">
          <label className="text-xs font-black uppercase text-slate-400">
            Περιοχή
            <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base font-bold text-white">
              <option value="">Όλες ({areas.length})</option>
              {alphabeticalAreas.filter((a) => !zone || a.group_name === zone).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code}{a.group_name ? ` · ${a.group_name}` : ""} — {fmt(areaTotals.get(a.code)?.[kind || "valve"] ?? 0)}
                </option>
              ))}
              <option value="none">Χωρίς περιοχή</option>
            </select>
          </label>
          <label className="text-xs font-black uppercase text-slate-400">
            Είδος
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base font-bold text-white">
              <option value="">Όλα</option>
              {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs font-black uppercase text-slate-400">Αριθμός SV
            <input value={sv} onChange={(e) => setSv(e.target.value)} placeholder="Μόνο αριθμός ή SV 123" className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base text-white" />
          </label>
          <label className="text-xs font-black uppercase text-slate-400">Οδός
            <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Όνομα οδού" className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base text-white" />
          </label>
          <label className="text-xs font-black uppercase text-slate-400">
            Πρόσθετη αναζήτηση
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SV, αριθμός, οδός, περιοχή ή ζώνη" className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base font-bold text-white" />
          </label>
          <label className="text-xs font-black uppercase text-slate-400">Ζώνη
            <select value={zone} onChange={(e) => { setZone(e.target.value); setArea(""); }} className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base text-white">
              <option value="">Όλες οι καταγεγραμμένες ζώνες</option>
              {zones.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            {!zones.length ? <span className="mt-1 block normal-case">Δεν έχουν καταχωριστεί ονομασίες ζωνών.</span> : null}
          </label>
          <label className="text-xs font-black uppercase text-slate-400">Ταξινόμηση
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base text-white">
              <option value="area">Περιοχή → οδός → αριθμός</option>
              <option value="street">Οδός → περιοχή → αριθμός</option>
              <option value="number">Αριθμός μητρώου</option>
            </select>
          </label>
          <button type="button" onClick={() => { setQ(""); setSv(""); setStreet(""); setArea(""); setZone(""); setKind("valve"); setSort("area"); }} className="self-end rounded-xl border border-slate-600 p-3">Καθαρισμός φίλτρων</button>
          <p role="status" aria-live="polite" className="text-sm font-bold text-slate-300 sm:col-span-3">
            {status === "loading" ? "Φόρτωση…" : status === "error" ? "Το μητρώο δεν φορτώθηκε. Δοκίμασε ξανά." : `${fmt(total)} στοιχεία · εμφανίζονται ${fmt(assets.length)}`}
          </p>
        </section>

        <section className="flex flex-wrap gap-3" aria-label="Εκτύπωση καταλόγου">
          <button type="button" disabled={printing} onClick={() => void preparePrint(false)} className="rounded-xl border border-sky-400 p-3 disabled:opacity-50">Εκτύπωση αποτελεσμάτων</button>
          <button type="button" disabled={printing} onClick={() => void preparePrint(true)} className="rounded-xl border border-amber-300 p-3 disabled:opacity-50">Εκτύπωση όλων των βανών</button>
          {printing ? <button type="button" onClick={() => { printAbortRef.current?.abort(); setPrintRows(null); setPrinting(false); setPrintStatus("Ακυρώθηκε."); }} className="rounded-xl border p-3">Ακύρωση</button> : null}
          <p role="status" aria-live="polite" className="w-full text-sm">{printStatus}</p>
        </section>
        {status === "idle" && !assets.length ? <p className="rounded-2xl border border-slate-700 p-4">Δεν βρέθηκαν καταγραφές με αυτά τα φίλτρα.</p> : null}
        {status === "error" ? <button type="button" onClick={() => void load(0)} className="rounded-xl border border-amber-300 p-3">Επανάληψη φόρτωσης</button> : null}
        {assets.length > 0 ? <section className="overflow-x-auto rounded-3xl border border-slate-700 bg-[#091426] p-4" aria-label="Μητρώο βανών και εξαρτημάτων">
          <table className="w-full text-left text-sm">
            <caption className="mb-3 text-left text-slate-300">Αριθμός μητρώου, αρχική ετικέτα SV, οδός, περιοχή και ζώνη</caption>
            <thead><tr>{["Αριθμός / SV", "Οδός", "Περιοχή", "Ζώνη", "Στοιχεία", "Θέση"].map((title) => <th scope="col" key={title} className="p-3 text-amber-300">{title}</th>)}</tr></thead>
            <tbody>{assets.map((a) => <tr key={a.number} className="border-t border-slate-700">
              <td className="p-3 font-mono font-bold">{a.number}<span className="block text-sky-200">{a.tag || "Χωρίς αρχική ετικέτα"}</span></td>
              <td className="p-3">{a.street || "Χωρίς ονομασία οδού στο σχέδιο"}</td>
              <td className="p-3">{a.area_code || "Μη καταγεγραμμένη"}</td>
              <td className="p-3">{areaByCode.get(a.area_code || "")?.group_name || "Μη καταγεγραμμένη"}</td>
              <td className="p-3">{KIND_LABEL[a.kind] ?? a.kind}{a.dn ? ` · DN${a.dn}` : ""}{a.name ? ` · ${a.name}` : ""}{a.proposed ? " · προτεινόμενη" : ""}</td>
              <td className="p-3"><a href={mapLink(a)} className="font-bold text-sky-200">Στον χάρτη Δ</a><span className="block text-xs text-slate-400">CAD X {a.x.toFixed(2)} · Y {a.y.toFixed(2)}</span></td>
            </tr>)}</tbody>
          </table>
        </section> : null}

        {status === "idle" && offset < total ? (
          <button onClick={() => void load(offset)} className="w-full rounded-2xl border border-amber-300/60 p-4 font-black text-amber-200">
            Περισσότερα ({fmt(total - offset)} ακόμα)
          </button>
        ) : null}
      </div>
      {printRows !== null ? <section className="hidden print:block" aria-label="Εκτυπώσιμος κατάλογος">
        <h1>{printTitle}</h1><p>{new Date().toLocaleDateString("el-GR", { timeZone: "Asia/Nicosia" })} · {printRows.length} εγγραφές</p>
        <table><thead><tr>{["Αριθμός μητρώου", "Ετικέτα SV", "Οδός", "Περιοχή", "Ζώνη", "Είδος / DN"].map((v) => <th scope="col" key={v}>{v}</th>)}</tr></thead>
        <tbody>{printRows.map((a) => <tr key={a.number}><td>{a.number}</td><td>{a.tag || "—"}</td><td>{a.street || "Χωρίς ονομασία"}</td><td>{a.area_code || "—"}</td><td>{areaByCode.get(a.area_code || "")?.group_name || "Μη καταγεγραμμένη"}</td><td>{KIND_LABEL[a.kind] || a.kind}{a.dn ? ` DN${a.dn}` : ""}</td></tr>)}</tbody></table>
      </section> : null}
      <style>{`@media print { @page { size: A4 landscape; margin: 12mm; } body, main { background: white !important; color: black !important; } main table { width: 100%; border-collapse: collapse; font-size: 10pt; } main th, main td { border: 1px solid #888; padding: 4px; text-align: left; } main thead { display: table-header-group; } main tr { break-inside: avoid; } }`}</style>
    </main>
  );
}

