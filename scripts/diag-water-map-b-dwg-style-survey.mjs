// Diagnostic only: surveys how the approved Map B DWG encodes colour, linetype,
// lineweight, OCS/extrusion, hatches and text, so the derived tiles can reproduce
// them faithfully. Reads the verified original; writes nothing anywhere.
import { createClient } from "@supabase/supabase-js";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const source = {
  mapId: "B", byteSize: 205565159, dwgHeader: "AC1032",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
};
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const admin = createClient("https://cxhulvwkagzufbjsdwwu.supabase.co", process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });

const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const top = (o, n = 25) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n));
const r = (v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v);

const original = await loadApprovedOwnerDwg(admin, source);
if (!original) throw new Error("approved_original_not_found");
const lib = await LibreDwg.create(path.join(repoRoot, "node_modules", "@mlightcad", "libredwg-web", "wasm") + path.sep);
const buf = original.buffer;
const dwg = lib.dwg_read_data(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), Dwg_File_Type.DWG);
const db = lib.convertEx(dwg).database;

const h = db.header || {};
const out = {
  header: Object.fromEntries(["LTSCALE", "CELTSCALE", "PSLTSCALE", "LWDISPLAY", "PDMODE", "PDSIZE", "PLINEGEN", "INSUNITS", "EXTMIN", "EXTMAX", "TEXTSTYLE"].map((k) => [k, h[k]])),
  tableKeys: Object.keys(db.tables || {}),
};

const layers = db.tables?.LAYER?.entries || [];
const lcol = {}; let off = 0, frozen = 0; const llw = {}; const llt = {};
for (const l of layers) {
  bump(lcol, `${l.colorIndex}|${l.color}`); if (l.off) off++; if (l.frozen) frozen++;
  bump(llw, String(l.lineweight)); bump(llt, String(l.lineType));
}
out.layers = { count: layers.length, off, frozen, colorTop: top(lcol, 15), lineweight: top(llw), lineType: top(llt),
  sample: layers.slice(0, 6).map((l) => ({ name: l.name, colorIndex: l.colorIndex, color: l.color, lineType: l.lineType, lineweight: l.lineweight, off: l.off, frozen: l.frozen })) };

const lts = db.tables?.LTYPE?.entries || [];
out.ltypes = lts.map((t) => ({ name: t.name, total: r(t.totalPatternLength), n: t.numberOfLineTypes,
  pattern: (t.pattern || []).map((e) => ({ len: r(e.elementLength), flag: e.elementTypeFlag, text: e.text, shape: e.shapeNumber, scale: r(e.scale), rot: r(e.rotation), ox: r(e.offsetX), oy: r(e.offsetY), style: e.styleObjectId })) })).slice(0, 60);

const styles = db.tables?.STYLE?.entries || [];
out.textStyles = styles.slice(0, 20).map((s) => ({ name: s.name, font: s.font || s.fontFile || s.primaryFontFile, height: s.fixedTextHeight ?? s.textHeight, width: s.widthFactor }));

const byType = {}, ext = {}, extNeg = {}, ecol = {}, elw = {}, elt = {}, ltsc = {}, hatch = {}, mt = { withP: 0, withColorCode: 0, withFont: 0 };
const negSample = [];
const allEntities = [...(db.entities || [])];
const blocks = db.tables?.BLOCK_RECORD?.entries || [];
let blockEntityCount = 0;
for (const b of blocks) for (const e of b.entities || []) { blockEntityCount++; allEntities.push(e); }
for (const e of allEntities) {
  const t = e.type; bump(byType, t);
  const n = e.extrusionDirection || e.normal;
  const key = n ? `${r(n.x)},${r(n.y)},${r(n.z)}` : "none";
  bump(ext, `${t}:${key}`);
  if (n && n.z < 0 && negSample.length < 12) {
    const p = e.center || e.insertionPoint || e.startPoint || e.corner1 || e.vertices?.[0] || e.position;
    negSample.push({ t, x: r(p?.x), y: r(p?.y), z: r(p?.z), elevation: r(e.elevation) });
  }
  if (n && n.z < 0) bump(extNeg, t);
  bump(ecol, `${e.colorIndex}|${e.color ?? ""}`); bump(elw, String(e.lineweight)); bump(elt, String(e.lineType)); bump(ltsc, String(r(e.lineTypeScale)));
  if (t === "HATCH") bump(hatch, `${e.solidFill === 1 ? "solid" : "pattern"}:${e.patternName}:${e.definitionLines?.length ?? 0}`);
  if (t === "MTEXT") { const s = String(e.text || ""); if (/\\P/.test(s)) mt.withP++; if (/\\C\d|\\c\d/.test(s)) mt.withColorCode++; if (/\\f/i.test(s)) mt.withFont++; }
}
const firstOf = (type) => allEntities.find((e) => e.type === type);
const strip = (e) => e && Object.fromEntries(Object.entries(e).filter(([k, v]) => !["vertices", "boundaryPaths", "xdata", "entities", "controlPoints", "knots", "definitionLines", "attribs"].includes(k) && typeof v !== "function").map(([k, v]) => [k, typeof v === "object" && v ? JSON.stringify(v).slice(0, 120) : v]));
out.entities = { topLevel: (db.entities || []).length, inBlocks: blockEntityCount, byType: top(byType, 30),
  extrusion: top(ext, 20), extrusionNegZByType: extNeg, negZSample: negSample,
  colorTop: top(ecol, 20), lineweightTop: top(elw, 20), lineTypeTop: top(elt, 25), lineTypeScaleTop: top(ltsc, 10), hatch: top(hatch, 25), mtext: mt };
out.samples = Object.fromEntries(["ATTRIB", "ATTDEF", "DIMENSION", "SOLID", "LEADER", "MTEXT", "TEXT", "INSERT", "WIPEOUT", "POINT", "IMAGE", "MULTILEADER"].map((t) => [t, strip(firstOf(t))]));
const ins = (db.entities || []).find((e) => e.type === "INSERT" && Array.isArray(e.attribs) && e.attribs.length);
out.insertWithAttribs = ins ? { attribCount: ins.attribs.length, first: strip(ins.attribs[0]) } : null;
const dim = allEntities.find((e) => e.type === "DIMENSION");
out.dimensionBlockFound = dim ? Boolean(blocks.find((b) => b.name === dim.name)) : null;
lib.dwg_free(dwg);
console.log("SURVEY_JSON " + JSON.stringify(out));
