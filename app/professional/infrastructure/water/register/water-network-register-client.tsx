"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [areas, setAreas] = useState<Area[]>([]);
  const [counts, setCounts] = useState<Count[]>([]);
  const [area, setArea] = useState<string>("");
  const [kind, setKind] = useState<string>("valve");
  const [q, setQ] = useState("");
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
        if (cancelled) return;
        setAreas(j.areas ?? []);
        setCounts(j.counts ?? []);
        setStatus("idle");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async (from: number) => {
    setStatus("loading");
    const p = new URLSearchParams({ offset: String(from), limit: "500" });
    if (area) p.set("area", area);
    if (kind) p.set("kind", kind);
    if (q.trim()) p.set("q", q.trim());
    try {
      const r = await fetch(`/api/professional/infrastructure/water/register?${p}`, { credentials: "include", headers: waterAccessHeaders() });
      if (r.status === 403) { setStatus("denied"); return; }
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setAssets(from === 0 ? j.assets : (prev) => [...prev, ...j.assets]);
      setTotal(j.total);
      setOffset(from + j.assets.length);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [area, kind, q]);

  useEffect(() => {
    const t = setTimeout(() => void load(0), 250);
    return () => clearTimeout(t);
  }, [load]);

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

  // Area → street → assets, in the order the API returns (area, street, number).
  const grouped = useMemo(() => {
    const out: Array<{ area: string; streets: Array<{ street: string; items: Asset[] }> }> = [];
    for (const a of assets) {
      const areaKey = a.area_code ?? "Χωρίς περιοχή";
      let g = out[out.length - 1];
      if (!g || g.area !== areaKey) { g = { area: areaKey, streets: [] }; out.push(g); }
      const streetKey = a.street ?? "Χωρίς όνομα οδού στο σχέδιο";
      let s = g.streets[g.streets.length - 1];
      if (!s || s.street !== streetKey) { s = { street: streetKey, items: [] }; g.streets.push(s); }
      s.items.push(a);
    }
    return out;
  }, [assets]);

  const mapLink = (a: Asset) =>
    `/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap&viewId=D&x=${a.x}&y=${a.y}&asset=${encodeURIComponent(a.number)}`;

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-amber-300/30 bg-[#091426] p-5">
          <a href="/professional/infrastructure/water" className="text-sm font-black text-amber-300">← Πίσω στην Ύδρευση</a>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">Pantavion Water · Μητρώο Δικτύου</p>
          <h1 className="mt-2 text-3xl font-black">Βάνες, ρεούλες, υδροστόμια, δεξαμενές</h1>
          <p className="mt-2 text-sm font-bold text-slate-300">
            Από το αυθεντικό DWG του χάρτη Β. Κάθε στοιχείο έχει αριθμό ανά περιοχή (από ανατολικά προς δυτικά),
            την περιοχή του από τα ροζ όρια του σχεδίου και την πλησιέστερη οδό του σχεδίου.
          </p>
        </header>

        {status === "denied" ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 font-bold">
            Το μητρώο είναι διαθέσιμο μόνο σε εγκεκριμένες συσκευές Ύδρευσης.
          </p>
        ) : null}

        <section className="grid gap-3 rounded-3xl border border-slate-700 bg-[#091426] p-4 sm:grid-cols-3">
          <label className="text-xs font-black uppercase text-slate-400">
            Περιοχή
            <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base font-bold text-white">
              <option value="">Όλες ({areas.length})</option>
              {areas.map((a) => (
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
          <label className="text-xs font-black uppercase text-slate-400">
            Αναζήτηση
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="αριθμός, οδός, ετικέτα" className="mt-1 w-full rounded-xl border border-slate-600 bg-[#050b16] p-3 text-base font-bold text-white" />
          </label>
          <p className="text-sm font-bold text-slate-300 sm:col-span-3">
            {status === "loading" ? "Φόρτωση…" : status === "error" ? "Το μητρώο δεν φορτώθηκε. Δοκίμασε ξανά." : `${fmt(total)} στοιχεία · εμφανίζονται ${fmt(assets.length)}`}
          </p>
        </section>

        {grouped.map((g) => (
          <section key={g.area} className="rounded-3xl border border-slate-700 bg-[#091426] p-4">
            <h2 className="text-xl font-black text-amber-300">Περιοχή {g.area}</h2>
            {g.streets.map((s) => (
              <div key={s.street} className="mt-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-300">{s.street} · {s.items.length}</h3>
                <ul className="mt-2 divide-y divide-slate-800 rounded-2xl border border-slate-800">
                  {s.items.map((a) => (
                    <li key={a.number} className="flex flex-wrap items-center justify-between gap-2 p-3">
                      <div>
                        <p className="font-mono text-base font-black">{a.number}</p>
                        <p className="text-sm font-bold text-slate-300">
                          {KIND_LABEL[a.kind] ?? a.kind}
                          {a.dn ? ` · DN${a.dn}` : ""}
                          {a.name ? ` · ${a.name}` : ""}
                          {a.capacity_m3 ? ` · ${fmt(a.capacity_m3)} m³` : ""}
                          {a.proposed ? " · προτεινόμενη" : ""}
                          {a.tag ? ` · ετικέτα «${a.tag}»` : ""}
                        </p>
                        <p className="text-xs font-bold text-slate-500">CAD X {a.x.toFixed(2)} · Y {a.y.toFixed(2)}{a.layer ? ` · ${a.layer}` : ""}</p>
                      </div>
                      <a href={mapLink(a)} className="rounded-xl border border-sky-400/60 px-3 py-2 text-sm font-black text-sky-200">Στον χάρτη Δ</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

        {offset < total ? (
          <button onClick={() => void load(offset)} className="w-full rounded-2xl border border-amber-300/60 p-4 font-black text-amber-200">
            Περισσότερα ({fmt(total - offset)} ακόμα)
          </button>
        ) : null}
      </div>
    </main>
  );
}
