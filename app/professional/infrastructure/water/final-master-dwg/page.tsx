import { WATER_MAP_B_SOURCE_CANDIDATES } from "@/core/water/water-map-b-source-candidates";
import FinalMasterDwgUploader from "./final-master-dwg-uploader";

export const dynamic = "force-dynamic";

export default function FinalMasterDwgPage() {
  const canonical = WATER_MAP_B_SOURCE_CANDIDATES["canonical-2026-andreaspap"];
  const legacy = WATER_MAP_B_SOURCE_CANDIDATES["legacy-george-85m"];
  const sizeMB = Math.round((canonical.byteSize / 1024 / 1024) * 100) / 100;

  return (
    <main style={{ minHeight: "100vh", background: "#05070d", color: "#f8e7b0", padding: 24 }}>
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "#d1a84f", letterSpacing: 2, textTransform: "uppercase", fontWeight: 800 }}>
          Pantavion Water / Original DWG
        </p>

        <h1 style={{ fontSize: 36, margin: "8px 0" }}>
          Original Final Master DWG
        </h1>

        <p style={{ color: "#d7d7d7", fontSize: 16, lineHeight: 1.6 }}>
          This is the original DWG master file. It remains private and is delivered only through the
          protected Water Administrator session. No PDF conversion, GeoJSON reconstruction, or
          recolored preview is treated as the editable master.
        </p>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(244,200,91,0.35)",
            background: "rgba(244,200,91,0.08)",
          }}
        >
          <div><strong>Canonical file:</strong> {canonical.fileName}</div>
          <div><strong>Canonical size:</strong> {sizeMB} MB</div>
          <div><strong>Canonical SHA256:</strong> {canonical.sha256}</div>
          <div style={{ marginTop: 10 }}><strong>Legacy candidate:</strong> {legacy.fileName}</div>
          <div><strong>Legacy size:</strong> {Math.round((legacy.byteSize / 1024 / 1024) * 100) / 100} MB</div>
        </div>

        <FinalMasterDwgUploader
          sourceKey={canonical.sourceKey}
          label={canonical.label}
          canonical={canonical.canonical}
          expectedFileName={canonical.fileName}
          expectedSizeBytes={canonical.byteSize}
          expectedSha256={canonical.sha256}
        />

        <FinalMasterDwgUploader
          sourceKey={legacy.sourceKey}
          label={legacy.label}
          canonical={legacy.canonical}
          expectedFileName={legacy.fileName}
          expectedSizeBytes={legacy.byteSize}
          expectedSha256={legacy.sha256}
        />

        <a
          href="/api/professional/infrastructure/water/final-master-dwg"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "14px 22px",
            borderRadius: 12,
            background: "#d1a84f",
            color: "#05070d",
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          Open / Download Original DWG
        </a>
      </section>
    </main>
  );
}
