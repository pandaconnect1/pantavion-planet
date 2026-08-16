import {
  FINAL_MASTER_DWG_FILE_NAME,
  FINAL_MASTER_DWG_SIZE_BYTES,
  FINAL_MASTER_DWG_SHA256,
} from "@/core/water/final-master-dwg-source";
import FinalMasterDwgUploader from "./final-master-dwg-uploader";

export const dynamic = "force-dynamic";

export default function FinalMasterDwgPage() {
  const sizeMB = Math.round((FINAL_MASTER_DWG_SIZE_BYTES / 1024 / 1024) * 100) / 100;

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
          <div><strong>File:</strong> {FINAL_MASTER_DWG_FILE_NAME}</div>
          <div><strong>Size:</strong> {sizeMB} MB</div>
          <div><strong>SHA256:</strong> {FINAL_MASTER_DWG_SHA256}</div>
        </div>

        <FinalMasterDwgUploader
          expectedFileName={FINAL_MASTER_DWG_FILE_NAME}
          expectedSizeBytes={FINAL_MASTER_DWG_SIZE_BYTES}
          expectedSha256={FINAL_MASTER_DWG_SHA256}
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
