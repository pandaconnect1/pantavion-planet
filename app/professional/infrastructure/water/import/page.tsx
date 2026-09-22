import WaterMapNavigation from "../water-map-navigation";
import { getPantavionUniversalFormatRegistrySummary } from "@/core/intake/pantavion-universal-artifact-intake";
import { PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES } from "@/core/intake/pantavion-artifact-storage-policy";

export const metadata = {
  title: "Pantavion Water Universal Import Center",
  description:
    "Universal protected intake for water maps, CAD, GIS, PDF, imagery, databases and future formats.",
};

const highlighted = [
  "DWG / DXF / DGN / DWF",
  "PDF / Office / CSV / XLSX",
  "SHP / GPKG / GML / GPX / OSM / PBF",
  "KML / KMZ / GeoJSON / TopoJSON",
  "GeoTIFF / DEM / HGT / ECW / JP2",
  "MBTiles / PMTiles",
  "STEP / IFC / RVT / 3D exchange",
  "Unknown future formats → preserve + adapter registry",
];

export default function WaterImportCenterPage() {
  const registry = getPantavionUniversalFormatRegistrySummary();
  const maxGiB = (PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES / 1024 / 1024 / 1024).toFixed(1);

  return (
    <>
      <WaterMapNavigation title="Universal Import Center" />
      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Water Universal Artifact Intake
          </p>
          <h1 className="mt-4 text-3xl font-black md:text-5xl">
            Ένας ασφαλής δέκτης για CAD, GIS, PDF και μελλοντικά formats
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
            Το Pantavion δεν απορρίπτει ένα αρχείο επειδή δεν έχει ακόμη parser.
            Το πρωτότυπο διατηρείται immutable, ταξινομείται, ελέγχεται και
            οδηγείται σε native parser, converter, sandbox ή adapter work order.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              ["Format rules", registry.registeredFormatRules],
              ["Extensions", registry.registeredExtensions],
              ["Families", registry.registeredFamilies],
              ["Current upload max", `${maxGiB} GiB`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#f3db9d]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {highlighted.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-slate-200">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Registry coverage σημαίνει classify / preserve / route. Δεν σημαίνει ότι κάθε format έχει ήδη native editor.
            Executables, archives και active content δεν εκτελούνται απευθείας.
          </div>

          <a
            href="/kernel/artifact-upload"
            className="mt-6 inline-block rounded-2xl bg-[#d8b45f] px-6 py-3 text-sm font-black text-[#07101e]"
          >
            Άνοιγμα προστατευμένου Universal Upload
          </a>
        </section>
      </main>
    </>
  );
}
