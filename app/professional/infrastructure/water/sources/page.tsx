import { WaterSourcesAdminPanel } from "@/components/water/WaterSourcesAdminPanel";
import {
  assessPantavionArtifactIntake,
  listPantavionArtifactIntakeRules
} from "@/core/artifacts/artifact-intake-registry";

export const dynamic = "force-dynamic";

export default function PantavionWaterSourcesPage() {
  const rules = listPantavionArtifactIntakeRules();

  const dwgAssessment = assessPantavionArtifactIntake({
    filename: "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
    sizeBytes: 205877448,
    sha256: "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
    storageProvider: "vercel_blob_private",
    requestedSurface: "B",
    sourceTruth: true,
    founderApproved: false,
    actor: "page:water:sources",
    reason: "Water sources admin page example"
  });

  const geojsonAssessment = assessPantavionArtifactIntake({
    filename: "water-network-mobile.geojson",
    extension: "geojson",
    storageProvider: "vercel_blob_private",
    requestedSurface: "C",
    sourceTruth: false,
    founderApproved: false,
    actor: "page:water:sources",
    reason: "Water sources admin page derivative example"
  });

  return (
    <main className="min-h-screen bg-[#02040b] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <WaterSourcesAdminPanel
          rules={rules}
          dwgAssessment={dwgAssessment}
          geojsonAssessment={geojsonAssessment}
        />
      </div>
    </main>
  );
}
