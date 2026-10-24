"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { uploadFieldArtifact } from "../field/water-field-spatial-client";
import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";
import { drawingGeometry, patchDrawing, WATER_DRAWING_SYMBOLS, type DrawingPoint, type DrawingShape, type DrawingStyle, type DrawingTool } from "@/core/infrastructure/water/water-map-drawing";

const defaults: DrawingStyle = { color: "#22d3ee", width: 3, dashed: false, text: "", symbol: "valve" };
const tools: Array<[DrawingTool, string]> = [["navigate", "Μετακίνηση"], ["line", "Γραμμή / αγωγός"], ["polygon", "Περίγραμμα"], ["arrow", "Βέλος"], ["text", "Κείμενο"], ["symbol", "Σύμβολο"]];
const actions: Array<[string, string]> = [["create", "Νέα τοποθέτηση"], ["replace", "Αντικατάσταση"], ["close", "Κλείσιμο βάνας"], ["open", "Άνοιγμα βάνας"], ["isolate", "Απομόνωση αγωγού"], ["restore", "Επαναφορά αγωγού"], ["retire", "Κατάργηση"], ["annotate", "Σημείωση / εργασία"]];

export function useWaterMapDrawing(mapId: string, sourceKey: string | null, enabled = true) {
  const [tool, setTool] = useState<DrawingTool>("navigate");
  const [points, setPoints] = useState<DrawingPoint[]>([]);
  const [style, setStyle] = useState<DrawingStyle>(defaults);
  const [rows, setRows] = useState<DrawingShape[]>([]);
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [zone, setZone] = useState("");
  const [lineAssetType, setLineAssetType] = useState<"pipe" | "road_reference">("pipe");
  const [assetId, setAssetId] = useState("");
  const [action, setAction] = useState("create");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const uploaded = useRef<{ file: File; ref: string } | null>(null);
  const mutation = useRef<string | null>(null);
  const mutationSignature = useRef("");
  const scope = `${mapId}:${sourceKey || "EPSG:4326"}`;
  const latestScope = useRef(scope);
  const requestSequence = useRef(0);
  latestScope.current = scope;

  const reload = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++requestSequence.current;
    const params = new URLSearchParams({ limit: "1000", shared: "1" });
    if (sourceKey) params.set("sourceKey", sourceKey);
    const response = await fetch(`/api/professional/infrastructure/water/changes/patches?${params}`, { cache: "no-store", credentials: "include", headers: pantavionWaterApprovedDeviceHeaders(), signal });
    const body = await response.json();
    if (!response.ok || !body.ok) throw new Error("Δεν φορτώθηκαν οι καταγραφές. Ελέγξτε την πρόσβαση και δοκιμάστε ανανέωση.");
    if (signal?.aborted || latestScope.current !== scope || sequence !== requestSequence.current) return;
    setRows((body.patches || []).filter((p: Record<string, unknown>) => ["pending_review", "approved_overlay", "officialization_candidate", "officialized"].includes(String(p.status))).map((p: Record<string, unknown>) => patchDrawing(p, sourceKey)).filter(Boolean));
    if (body.patches?.length >= 1000) setMessage("Εμφανίζονται οι 1.000 πρόσφατες καταγραφές· ο κατάλογος ελέγχου περιέχει περισσότερες.");
  }, [scope, sourceKey]);

  useEffect(() => {
    const controller = new AbortController();
    setRows([]); setPoints([]); mutation.current = null;
    if (!enabled) return () => controller.abort();
    const refresh = () => { if (!document.hidden) void reload(controller.signal).catch((error) => { if (!controller.signal.aborted) setMessage(error.message); }); };
    refresh();
    const timer = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [reload, enabled]);

  const pick = useCallback((point: { x: number; y: number }) => {
    if (tool === "navigate" || busy) return;
    mutation.current = null;
    setPoints((previous) => tool === "text" || tool === "symbol" ? [[point.x, point.y]] : previous.length < 500 ? [...previous, [point.x, point.y]] : previous);
  }, [tool, busy]);

  function changeTool(value: DrawingTool) { setTool(value); setPoints([]); mutation.current = null; }
  function changeStyle(value: DrawingStyle) { setStyle(value); mutation.current = null; }

  async function submit() {
    if (busy) return;
    try {
      const geometry = drawingGeometry(tool, points, sourceKey);
      if (!area.trim()) throw new Error("Συμπλήρωσε περιοχή / χωριό.");
      if (tool === "text" && !style.text.trim()) throw new Error("Γράψε το κείμενο της σημείωσης.");
      if (tool === "line" && lineAssetType === "road_reference" && !street.trim()) throw new Error("Δήλωσε ονομασία ή περιγραφή ανώνυμης οδού.");
      if (["replace", "close", "open", "isolate", "restore", "retire"].includes(action) && !assetId.trim()) throw new Error("Δήλωσε το αναγνωριστικό της υπάρχουσας βάνας / αγωγού.");
      if (["close", "open"].includes(action) && (tool !== "symbol" || style.symbol !== "valve")) throw new Error("Για άνοιγμα / κλείσιμο επίλεξε σύμβολο βάνας.");
      if (["isolate", "restore"].includes(action) && tool !== "line") throw new Error("Για απομόνωση / επαναφορά επίλεξε γραμμή αγωγού.");
      setBusy(true); setMessage("Αποστολή για έλεγχο…");
      const artifactRefs: string[] = [];
      if (file) {
        if (uploaded.current?.file !== file) {
          const result = await uploadFieldArtifact(file, (percent) => setMessage(`Ανέβασμα φωτογραφίας ${percent}%…`));
          if (!result.artifactRef) throw new Error("Η φωτογραφία δεν επιβεβαιώθηκε.");
          uploaded.current = { file, ref: result.artifactRef };
        }
        artifactRefs.push(uploaded.current!.ref);
      }
      const operation = ["create", "replace", "retire"].includes(action) ? action : "annotate";
      const assetType = tool === "symbol" && style.symbol !== "tank" ? style.symbol : tool === "line" ? lineAssetType : "general_update";
      const signature = JSON.stringify({ mapId, sourceKey, tool, points, style, area, street, zone, lineAssetType, assetId, action, note, artifactRefs });
      if (!mutation.current || mutationSignature.current !== signature) { mutation.current = crypto.randomUUID(); mutationSignature.current = signature; }
      const response = await fetch("/api/professional/infrastructure/water/changes/patches", { method: "POST", cache: "no-store", credentials: "include", headers: { "content-type": "application/json", ...pantavionWaterApprovedDeviceHeaders() }, body: JSON.stringify({
        clientMutationId: mutation.current, mapId, sourceKey, assetType, operation, geometry,
        location: { source: "manual_map", accuracyState: "estimated", streetName: street.trim() || null, area: area.trim(), snappedAssetId: assetId.trim() || null },
        attributes: { drawing: { tool, style }, zone: zone.trim() || null, fieldAction: action, officialAssetId: assetId.trim() || null, note: note.trim() || null, reportedStateOnly: ["close", "open", "isolate", "restore"].includes(action), verifiedWaterFlow: false },
        evidenceRefs: [], artifactRefs, relatedJobIds: [], relatedReportIds: [],
      }) });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.patch?.patch_id) throw new Error(body.error || "Η καταχώριση δεν επιβεβαιώθηκε. Δοκίμασε ξανά.");
      const shape = patchDrawing(body.patch, sourceKey);
      if (shape) setRows((old) => [...old.filter((p) => p.id !== shape.id), shape]);
      setPoints([]); setFile(null); uploaded.current = null; mutation.current = null;
      setMessage(`Αποθηκεύτηκε προς έγκριση · ${body.patch.patch_id}.`);
      void reload().catch(() => setMessage(`Αποθηκεύτηκε · ${body.patch.patch_id}. Η ανανέωση προβολής απέτυχε· πάτησε Ανανέωση.`));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Η αποθήκευση απέτυχε."); }
    finally { setBusy(false); }
  }

  const shapes = useMemo<DrawingShape[]>(() => [...rows, ...(points.length && tool !== "navigate" ? [{ id: "draft", tool, points, style, status: "draft" }] : [])], [rows, points, tool, style]);
  return { tool, changeTool, points, style, changeStyle, area, setArea, street, setStreet, zone, setZone, lineAssetType, setLineAssetType, assetId, setAssetId, action, setAction, note, setNote, file, setFile, busy, message, shapes, pick,
    undo: () => { setPoints((old) => old.slice(0, -1)); mutation.current = null; }, clear: () => { setPoints([]); mutation.current = null; }, submit,
    refresh: () => void reload().catch((error) => setMessage(error.message)),
  };
}

/** Thin tool bar placed above the map, outside it, so the map keeps the whole surface. */
export function WaterMapDrawingBar({
  drawing,
  panelOpen,
  onTogglePanel,
  fullscreen,
  onToggleFullscreen,
  children,
}: {
  drawing: ReturnType<typeof useWaterMapDrawing>;
  panelOpen: boolean;
  onTogglePanel: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  children?: ReactNode;
}) {
  const d = drawing;
  const off = "border-slate-600 bg-[#091426] text-slate-200";
  const on = "border-[#f2c766] bg-[#f2c766] text-black";
  const chip = "whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-black";
  return <div role="group" aria-label="Εργαλεία χάρτη" className="flex flex-wrap items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-[#071426] p-2 text-white">
    {tools.map(([value, label]) => <button type="button" key={value} aria-pressed={d.tool === value} disabled={d.busy} onClick={() => d.changeTool(value)} className={`${chip} ${d.tool === value ? on : off}`}>{label}</button>)}
    {d.points.length ? <button type="button" onClick={d.undo} className={`${chip} ${off}`}>Αναίρεση σημείου ({d.points.length})</button> : null}
    <button type="button" aria-expanded={panelOpen} aria-controls="water-map-drawing-panel" onClick={onTogglePanel} className={`${chip} ${panelOpen ? on : off} sm:ml-auto`}>{panelOpen ? "Κλείσιμο στοιχείων" : "Στοιχεία εργασίας"}</button>
    <button type="button" aria-pressed={fullscreen} onClick={onToggleFullscreen} className={`${chip} ${fullscreen ? on : off}`}>{fullscreen ? "Έξοδος πλήρους οθόνης" : "Πλήρης οθόνη"}</button>
    {children}
    {!panelOpen && d.message ? <p role="status" className="w-full break-words text-xs text-amber-200">{d.message}</p> : null}
  </div>;
}

export default function WaterMapDrawingTools({ drawing, localCad = false, inBar = false }: { drawing: ReturnType<typeof useWaterMapDrawing>; localCad?: boolean; inBar?: boolean }) {
  const d = drawing;
  const input = "rounded-lg border border-slate-600 bg-[#091426] p-2 text-white";
  return <section id={inBar ? "water-map-drawing-panel" : undefined} aria-label={inBar ? "Στοιχεία εργασίας στον χάρτη" : "Εργαλεία καταγραφής στον χάρτη"} className={`space-y-3 rounded-xl border border-cyan-400/40 bg-[#071426] p-3 text-sm text-white${inBar ? " max-h-[45dvh] overflow-y-auto" : ""}`}>
    <details open={inBar}>
      <summary className={inBar ? "hidden" : "cursor-pointer font-bold text-cyan-200"}>Σχεδίαση / καταγραφή εργασίας στον χάρτη</summary>
      <fieldset disabled={d.busy} className="mt-3 space-y-3 disabled:opacity-60">
        <legend className="sr-only">Εργαλεία και στοιχεία εργασίας</legend>
        {inBar ? null : <div className="flex flex-wrap gap-2">{tools.map(([value, label]) => <button type="button" key={value} aria-pressed={d.tool === value} onClick={() => d.changeTool(value)} className={`${input} ${d.tool === value ? "ring-2 ring-cyan-300" : ""}`}>{label}</button>)}</div>}
        {d.tool === "line" ? <label className="grid gap-1">Είδος γραμμής<select className={input} value={d.lineAssetType} onChange={(e) => d.setLineAssetType(e.target.value as "pipe" | "road_reference")}><option value="pipe">Αγωγός δικτύου</option><option value="road_reference">Νέα οδός / επέκταση οδού</option></select></label> : null}
        <p>{inBar ? "Επίλεξε εργαλείο από τη μπάρα πάνω από τον χάρτη και πάτησε διαδοχικά σημεία στον χάρτη. Σύρε για μετακίνηση." : "Επίλεξε εργαλείο και πάτησε διαδοχικά σημεία στον χάρτη. Σύρε για μετακίνηση."}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label>Χρώμα <input aria-label="Χρώμα σχεδίασης" type="color" value={d.style.color} onChange={(e) => d.changeStyle({ ...d.style, color: e.target.value })} /></label>
          <label>Πάχος <input className={`${input} w-16`} type="number" min={1} max={10} value={d.style.width} onChange={(e) => d.changeStyle({ ...d.style, width: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} /></label>
          <label><input type="checkbox" checked={d.style.dashed} onChange={(e) => d.changeStyle({ ...d.style, dashed: e.target.checked })} /> Διακεκομμένη</label>
        </div>
        {d.tool === "text" ? <label className="grid gap-1">Κείμενο<input className={input} maxLength={300} value={d.style.text} onChange={(e) => d.changeStyle({ ...d.style, text: e.target.value })} /></label> : null}
        {d.tool === "symbol" ? <label className="grid gap-1">Σύμβολο<select className={input} value={d.style.symbol} onChange={(e) => d.changeStyle({ ...d.style, symbol: e.target.value })}>{Object.entries({ valve: "Βάνα", hydrant: "Υδροστόμιο", meter: "Μετρητής", tank: "Δεξαμενή", fault: "Βλάβη", repair: "Επισκευή" }).map(([key, label]) => <option key={key} value={key}>{WATER_DRAWING_SYMBOLS[key]} {label}</option>)}</select></label> : null}
        <div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1">Περιοχή / χωριό<input className={input} maxLength={500} value={d.area} onChange={(e) => d.setArea(e.target.value)} /></label><label className="grid gap-1">Οδός / ανώνυμη θέση<input className={input} maxLength={500} value={d.street} onChange={(e) => d.setStreet(e.target.value)} /></label></div>
        <label className="grid gap-1">Εργασία<select className={input} value={d.action} onChange={(e) => d.setAction(e.target.value)}>{actions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="grid gap-1">Ζώνη (αν είναι γνωστή)<input className={input} maxLength={200} value={d.zone} onChange={(e) => d.setZone(e.target.value)} /></label>
        <label className="grid gap-1">Υφιστάμενος αριθμός SV / αναγνωριστικό αγωγού<input className={input} maxLength={200} value={d.assetId} onChange={(e) => d.setAssetId(e.target.value)} /></label>
        <label className="grid gap-1">Τι έγινε / υλικά / διάμετρος<textarea className={input} maxLength={2000} value={d.note} onChange={(e) => d.setNote(e.target.value)} /></label>
        <label className="grid gap-1">Φωτογραφία εργασίας<input className={input} type="file" accept="image/*" capture="environment" onChange={(e) => d.setFile(e.target.files?.[0] || null)} />{d.file ? <span>{d.file.name}</span> : null}</label>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={d.undo} disabled={!d.points.length} className={input}>Αναίρεση σημείου</button><button type="button" onClick={d.clear} disabled={!d.points.length} className={input}>Καθαρισμός πρόχειρου</button><button type="button" onClick={() => void d.submit()} disabled={!d.points.length} className="rounded-lg bg-cyan-300 p-3 font-bold text-black disabled:opacity-40">Αποστολή για έγκριση ({d.points.length} σημεία)</button></div>
      </fieldset>
    <p className="text-xs text-slate-300">Οι εκκρεμείς και εγκεκριμένες καταγραφές ανανεώνονται στους εγκεκριμένους χρήστες ανά 20 δευτερόλεπτα. Τα βέλη είναι σημειώσεις χρήστη, όχι επιβεβαιωμένη ροή νερού.{localCad ? " Οι θέσεις αποθηκεύονται στο σχέδιο· η μεταφορά στον Α αναμένει επαληθευμένη γεωαναφορά." : ""}</p>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={d.refresh} disabled={d.busy} className={input}>Ανανέωση</button><Link className={input} href="/professional/infrastructure/water/admin/changes">Έλεγχος / εγκρίσεις</Link></div>
    </details>
    <p role="status" className="break-words text-amber-200">{d.message}</p>
  </section>;
}
