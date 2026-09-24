import {
  LEGACY_MAP_BC_DWG_HEADER,
  LEGACY_MAP_BC_FILE_NAME,
  LEGACY_MAP_BC_SHA256,
  LEGACY_MAP_BC_SIZE_BYTES,
} from "@/core/water/legacy-map-bc-source";
import LegacyMapBcUploader from "./legacy-map-bc-uploader";

export const dynamic = "force-dynamic";

export default function LegacyMapBcPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070d", color: "#f8e7b0", padding: 24 }}>
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "#5eead4", letterSpacing: 2, textTransform: "uppercase", fontWeight: 800 }}>
          Pantavion Water / Map A authentic source
        </p>
        <h1>Map A authentic original</h1>
        <p>
          Owner-confirmed Map A. The historical filename is retained exactly as-is; the DWG bytes are never converted, merged or edited. Canonical Map B remains separate.
        </p>
        <div style={{ marginTop: 18, padding: 16, border: "1px solid rgba(244,200,91,0.35)", borderRadius: 14 }}>
          <div><strong>File:</strong> {LEGACY_MAP_BC_FILE_NAME}</div>
          <div><strong>Bytes:</strong> {LEGACY_MAP_BC_SIZE_BYTES}</div>
          <div><strong>SHA-256:</strong> {LEGACY_MAP_BC_SHA256}</div>
          <div><strong>DWG header:</strong> {LEGACY_MAP_BC_DWG_HEADER}</div>
        </div>
        <LegacyMapBcUploader
          expectedFileName={LEGACY_MAP_BC_FILE_NAME}
          expectedSizeBytes={LEGACY_MAP_BC_SIZE_BYTES}
        />
      </section>
    </main>
  );
}
