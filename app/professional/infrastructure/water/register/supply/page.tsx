"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

type Evidence = { text?: string; block?: string; layer: string; x: number; y: number; drawingOrientation?: { worldXAxis?: number[] } | null };
type Tank = { number: string; name: string; capacityM3?: number | null; area?: string | null; layer: string; x: number; y: number; proposed?: boolean };
type Inventory = { tanks: Tank[]; flowEvidence: { labelCandidates: Evidence[]; symbolCandidates: Evidence[] }; hiddenLayers: { layer: string; sourceOff: boolean; sourceFrozen: boolean }[]; totals: { layers: number }; sourceSha256: string };
function drawingLink(x: number, y: number) {
  return `/professional/infrastructure/water/master-b-mobile?${new URLSearchParams({ sourceKey: "canonical-2026-andreaspap", viewId: "D", x: String(x), y: String(y) })}`;
}
function normalized(text: string) { return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR"); }

export default function WaterSupplyEvidencePage() {
  const [data, setData] = useState<Inventory | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading"); setData(null);
    fetch("/api/professional/infrastructure/water/register?view=supply-evidence", { credentials: "include", cache: "no-store", headers: pantavionWaterApprovedDeviceHeaders(), signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.ok) { setStatus(response.status === 403 ? "denied" : "error"); return; }
        setData(body); setStatus("ready");
      }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [version]);
  const tokens = normalized(query).split(/\s+/).filter(Boolean);
  const matches = (values: unknown[]) => tokens.every((t) => normalized(values.filter(Boolean).join(" ")).includes(t));
  const tanks = (data?.tanks ?? []).filter((r) => matches([r.number, r.name, r.area, r.layer])).sort((a,b) => a.name.localeCompare(b.name,"el"));
  const evidence = [...(data?.flowEvidence.labelCandidates ?? []), ...(data?.flowEvidence.symbolCandidates ?? [])].filter((r) => matches([r.text, r.block, r.layer]));
  return <main className="min-h-screen bg-[#050b16] p-4 text-white print:bg-white print:text-black"><section className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-2xl border border-slate-700 p-5">
      <Link href="/professional/infrastructure/water/register" className="text-sky-200 print:hidden">← Κατάλογος δικτύου</Link>
      <h1 className="mt-3 text-3xl font-bold">Δεξαμενές και στοιχεία τροφοδοσίας DWG</h1>
      <p className="mt-3">Ονομασίες, χωρητικότητες, κείμενα και σύμβολα από το σχέδιο Β, με το επίπεδο και τη θέση της πηγής. Οι εγγραφές δεξαμενών προέρχονται από επιγραφές και μπορεί να αναφέρονται στην ίδια εγκατάσταση ή σε μελλοντικό έργο.</p>
      <p className="mt-3 text-amber-200 print:text-black">Δεν έχει επαληθευτεί ακόμη ποια δεξαμενή τροφοδοτεί κάθε περιοχή. Τα βέλη και τα κείμενα παρουσιάζονται ως στοιχεία προς αντιστοίχιση με τους συνδεδεμένους αγωγούς.</p>
    </header>
    <section className="rounded-xl border border-cyan-700 p-4"><h2 className="text-xl font-bold">Δεξαμενή Συκαμίνου — δημοσιευμένα στοιχεία</h2>
      <p>Ο ΕΟΑ αναφέρει ολοκληρωμένη δεξαμενή 2.000 m³ στον Άγιο Αθανάσιο. Η δημοσίευση εγκαινίων δίνει οδό Ανδρέα Παπαδόπουλου, Τ.Κ. 4108, και Παρασκευή 23/10/2026, 10:30. Η θέση και η αντιστοίχιση με συγκεκριμένο στοιχείο DWG δεν έχουν επαληθευτεί.</p>
      <p className="mt-2"><a href="https://eoalemesos.org.cy/el/news-details/ανέγερση-υδατοδεξαμενών" target="_blank" rel="noopener noreferrer" className="text-sky-200">ΕΟΑ: στοιχεία έργου ↗</a> · <a href="https://www.elemesos.com/egkainia-tis-ydatodexamenis-sykaminou-ston-agio-athanasio-apo-ton-eoa-lemesou/" target="_blank" rel="noopener noreferrer" className="text-sky-200">Δημοσίευση εγκαινίων ↗</a></p>
    </section>
    <label className="block print:hidden">Αναζήτηση ονομασίας, περιοχής, αριθμού ή επιπέδου<input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#091426] p-3" /></label>
    <p role="status">{status === "loading" ? "Φόρτωση απογραφής…" : status === "denied" ? "Απαιτείται εγκεκριμένη πρόσβαση Ύδρευσης." : status === "error" ? "Η απογραφή δεν φορτώθηκε." : `${data?.totals.layers ?? 0} επίπεδα σχεδίου · ${data?.hiddenLayers.length ?? 0} σβηστά / παγωμένα επίπεδα με περιεχόμενο`}</p>
    {status === "error" ? <button onClick={() => setVersion((v) => v + 1)} className="rounded-xl border p-3">Επανάληψη</button> : null}
    {data ? <>
      <button type="button" onClick={() => window.print()} className="rounded-xl border p-3 print:hidden">Εκτύπωση αποτελεσμάτων</button>
      <h2 className="text-2xl font-bold">Επιγραφές δεξαμενών ({tanks.length})</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Καταγραφή", "Επιγραφή σχεδίου", "Χωρητικότητα επιγραφής", "Ζώνη σχεδίου", "Επίπεδο", "Θέση CAD"].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead><tbody>{tanks.map((r) => <tr key={r.number} className="border-t border-slate-700"><td className="p-3">{r.number}</td><td>{r.name}{r.proposed ? " · προτεινόμενη" : ""}</td><td>{r.capacityM3 == null ? "Δεν αναγράφεται" : `${r.capacityM3} m³`}</td><td>{r.area || "Μη αντιστοιχισμένη"}</td><td>{r.layer}</td><td><Link href={drawingLink(r.x,r.y)} className="text-sky-200 print:text-black">{r.x}, {r.y} ↗</Link></td></tr>)}</tbody></table></div>
      <h2 className="text-2xl font-bold">Κείμενα και σύμβολα πιθανής ροής ({evidence.length})</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Κείμενο / σύμβολο", "Επίπεδο", "Θέση CAD", "Προσανατολισμός συμβόλου"].map((h) => <th scope="col" key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{evidence.map((r,i) => <tr key={`${r.layer}:${r.x}:${r.y}:${i}`} className="border-t border-slate-700"><td className="p-3">{r.text || r.block}</td><td>{r.layer}</td><td><Link href={drawingLink(r.x,r.y)} className="text-sky-200 print:text-black">{r.x}, {r.y} ↗</Link></td><td>{r.drawingOrientation?.worldXAxis?.join(", ") || "Δεν εξήχθη"}</td></tr>)}</tbody></table></div>
      <details className="print:hidden"><summary>Σβηστά / παγωμένα επίπεδα με περιεχόμενο</summary><ul className="mt-3 space-y-1">{data.hiddenLayers.map((l) => <li key={l.layer}>{l.layer} · {l.sourceOff ? "σβηστό " : ""}{l.sourceFrozen ? "παγωμένο" : ""}</li>)}</ul></details>
      <p className="text-xs text-slate-400">Πηγή Β · SHA-256 {data.sourceSha256}</p>
    </> : null}
    <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } table { border-collapse: collapse; width: 100%; font-size: 9pt; } td, th { border: 1px solid #888; padding: 4px; } thead { display: table-header-group; } tr { break-inside: avoid; } }`}</style>
  </section></main>;
}
