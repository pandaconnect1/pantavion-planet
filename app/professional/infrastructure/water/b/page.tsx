import { OriginalDwgViewerBridgePanel } from "@/components/water/OriginalDwgViewerBridgePanel";
import { assessPantavionOriginalDwgViewerBridge } from "@/core/water/original-dwg-viewer-bridge";

export const dynamic = "force-dynamic";

export default function PantavionWaterSurfaceBPage() {
  const bridge = assessPantavionOriginalDwgViewerBridge({
    surface: "B",
    founderApproved: false,
    licenseAvailable: false,
    cloudApproved: false,
    actor: "page:water:b"
  });

  return (
    <main className="min-h-screen bg-[#02040b] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <OriginalDwgViewerBridgePanel bridge={bridge} />
      </div>
    </main>
  );
}
