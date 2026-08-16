import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionOriginalDwgViewerBridge,
  listPantavionOriginalDwgViewerSurfaces,
  type PantavionOriginalDwgViewerBridgeInput
} from "@/core/water/original-dwg-viewer-bridge";
import { appendPantavionOriginalDwgViewerBridgeAudit } from "@/core/water/original-dwg-viewer-bridge-audit";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: NextRequest, fallbackActor: string) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: fallbackActor,
      authWarning:
        "Local development mode. Original DWG viewer bridge accepted without production auth.",
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const fallbackActor = "api:kernel:original-dwg-viewer-bridge:get";
  const resolved = resolveActor(request, fallbackActor);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized original DWG viewer bridge access." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const surface = request.nextUrl.searchParams.get("surface") ?? "B";

  const assessment = assessPantavionOriginalDwgViewerBridge({
    surface,
    founderApproved: false,
    licenseAvailable: false,
    cloudApproved: false,
    actor,
    reason: "Read B/C original DWG viewer bridge status"
  });

  await appendPantavionOriginalDwgViewerBridgeAudit({
    event: "original.dwg.viewer.bridge.read",
    actor,
    createdAt: new Date().toISOString(),
    request: { surface, actor },
    assessment
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_b_c_original_dwg_viewer_bridge",
    status: "internal",
    surfaces: listPantavionOriginalDwgViewerSurfaces(),
    assessment,
    policy: {
      original:
        "B and C are bound to GEORGE_MAP_MASTER_B_C_FINAL.dwg as protected source truth.",
      noFake:
        "No PDF, image, screenshot, GeoJSON, Leaflet reconstruction, sampled tile, or simplified derivative may be presented as the original DWG.",
      adapter:
        "Actual original DWG rendering requires a real licensed CAD/DWG viewer adapter.",
      automaticRender:
        "Automatic render remains blocked until approval, vault, adapter, and license checks pass."
    }
  });
}

export async function POST(request: NextRequest) {
  const fallbackActor = "api:kernel:original-dwg-viewer-bridge:post";
  const resolved = resolveActor(request, fallbackActor);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized original DWG viewer bridge assessment." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionOriginalDwgViewerBridgeInput>
    | null;

  const bridgeRequest: PantavionOriginalDwgViewerBridgeInput = {
    surface: body?.surface ?? "B",
    founderApproved: Boolean(body?.founderApproved),
    licenseAvailable: Boolean(body?.licenseAvailable),
    cloudApproved: Boolean(body?.cloudApproved),
    actor,
    reason: body?.reason
  };

  const assessment = assessPantavionOriginalDwgViewerBridge(bridgeRequest);

  await appendPantavionOriginalDwgViewerBridgeAudit({
    event: "original.dwg.viewer.bridge.assessed",
    actor,
    createdAt: new Date().toISOString(),
    request: bridgeRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
