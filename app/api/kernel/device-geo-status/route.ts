import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionDeviceGeoStatus,
  listPantavionDeviceGeoStatusPolicy,
  type PantavionDeviceGeoStatusInput,
  type PantavionGeoSource
} from "@/core/geo/device-geo-status";
import { appendPantavionDeviceGeoStatusAudit } from "@/core/geo/device-geo-status-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function nullableNumberValue(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeSource(value: unknown): PantavionGeoSource {
  const raw = String(value || "").trim();

  if (raw === "browser_geolocation" || raw === "manual_search" || raw === "gps_device") {
    return raw;
  }

  return "unknown";
}

export async function GET() {
  const actor = "api:kernel:device-geo-status:get";
  const policy = listPantavionDeviceGeoStatusPolicy();

  await appendPantavionDeviceGeoStatusAudit({
    event: "device.geo.status.policy.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_device_geo_status_current_position_viewport",
    status: "internal",
    policy,
    privacy: {
      consent:
        "Location requires explicit browser/device permission.",
      storage:
        "Precise coordinates are not persisted by default. Audit records use rounded coordinates.",
      tracking:
        "Continuous and background tracking are disabled."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:device-geo-status:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const geoRequest: PantavionDeviceGeoStatusInput = {
    latitude: numberValue(body?.latitude),
    longitude: numberValue(body?.longitude),
    accuracyMeters: numberValue(body?.accuracyMeters),
    altitudeMeters: nullableNumberValue(body?.altitudeMeters),
    headingDegrees: nullableNumberValue(body?.headingDegrees),
    speedMetersPerSecond: nullableNumberValue(body?.speedMetersPerSecond),
    source: normalizeSource(body?.source ?? "browser_geolocation"),
    requestedSurface: typeof body?.requestedSurface === "string" ? body.requestedSurface : "C",
    consentGranted: Boolean(body?.consentGranted),
    ephemeralOnly: body?.ephemeralOnly !== false,
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const assessment = assessPantavionDeviceGeoStatus(geoRequest);

  await appendPantavionDeviceGeoStatusAudit({
    event: "device.geo.status.assessed",
    actor: geoRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: geoRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
