import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionLicensedDwgAdapterRuntime,
  listPantavionLicensedDwgAdapterRuntimeContracts,
  type PantavionDwgAdapterKind,
  type PantavionDwgAdapterRequiredMethod,
  type PantavionLicensedDwgAdapterRuntimeInput
} from "@/core/water/licensed-dwg-adapter-runtime-contract";
import { appendPantavionLicensedDwgAdapterRuntimeAudit } from "@/core/water/licensed-dwg-adapter-runtime-audit";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: NextRequest, fallbackActor: string) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: fallbackActor,
      authWarning:
        "Local development mode. Licensed DWG adapter runtime contract accessed without production auth."
    };
  }

  return null;
}

function normalizeAdapterKind(value: unknown): PantavionDwgAdapterKind {
  const allowed: PantavionDwgAdapterKind[] = [
    "oda_inweb",
    "oda_mcp_future",
    "autodesk_aps_cloud",
    "custom_local",
    "unknown"
  ];

  return allowed.includes(value as PantavionDwgAdapterKind)
    ? (value as PantavionDwgAdapterKind)
    : "unknown";
}

function normalizeMethods(value: unknown): PantavionDwgAdapterRequiredMethod[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const allowed: PantavionDwgAdapterRequiredMethod[] = [
    "initialize",
    "loadOriginalDwgReadOnly",
    "renderEmbedded",
    "dispose"
  ];

  return value.filter((item): item is PantavionDwgAdapterRequiredMethod =>
    allowed.includes(item as PantavionDwgAdapterRequiredMethod)
  );
}

export async function GET(request: NextRequest) {
  const resolved = resolveActor(
    request,
    "api:kernel:licensed-dwg-adapter-runtime-contract:get"
  );

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized licensed DWG adapter runtime contract access." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const contracts = listPantavionLicensedDwgAdapterRuntimeContracts();

  await appendPantavionLicensedDwgAdapterRuntimeAudit({
    event: "licensed.dwg.adapter.contracts.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_licensed_dwg_adapter_runtime_contract",
    status: "internal",
    authWarning: resolved.authWarning,
    contracts,
    policy: {
      noFakeRender:
        "No adapter may return a fake canvas, static screenshot, PDF, image, GeoJSON, Leaflet reconstruction, sampled tiles, or simplified map as the original DWG.",
      sourceTruth:
        "The original DWG remains read-only, immutable, and source-truth protected.",
      adapter:
        "A runtime adapter must provide initialize, loadOriginalDwgReadOnly, renderEmbedded, and dispose methods before internal testing.",
      production:
        "Production rendering remains disabled until founder approval, license proof, vault, CAD adapter, source binding, and deployment checks pass."
    }
  });
}

export async function POST(request: NextRequest) {
  const resolved = resolveActor(
    request,
    "api:kernel:licensed-dwg-adapter-runtime-contract:post"
  );

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized licensed DWG adapter runtime contract assessment." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const contractRequest: PantavionLicensedDwgAdapterRuntimeInput = {
    adapterKind: normalizeAdapterKind(body?.adapterKind),
    surface: typeof body?.surface === "string" ? body.surface : "B",
    founderApproved: Boolean(body?.founderApproved),
    licenseAvailable: Boolean(body?.licenseAvailable),
    adapterPackageAvailable: Boolean(body?.adapterPackageAvailable),
    cloudApproved: Boolean(body?.cloudApproved),
    verifiedMethods: normalizeMethods(body?.verifiedMethods),
    production: Boolean(body?.production),
    actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const assessment = assessPantavionLicensedDwgAdapterRuntime(contractRequest);

  await appendPantavionLicensedDwgAdapterRuntimeAudit({
    event: "licensed.dwg.adapter.contract.assessed",
    actor: contractRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: contractRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    authWarning: resolved.authWarning,
    assessment
  });
}
