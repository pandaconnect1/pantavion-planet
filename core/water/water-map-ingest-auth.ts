import { createHash } from "node:crypto";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";

export type WaterMapIngestActor =
  | { ok: true; kind: "admin_session"; actorRef: "pantavion-water-admin"; deviceId: null }
  | { ok: true; kind: "approved_device"; actorRef: string; deviceId: string }
  | { ok: false; error: "water_map_upload_access_denied" };

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function authorizeWaterMapIngestActor(
  request: Request,
): Promise<WaterMapIngestActor> {
  if (hasWaterAdminSession(request)) {
    return {
      ok: true,
      kind: "admin_session",
      actorRef: "pantavion-water-admin",
      deviceId: null,
    };
  }

  const deviceId = clean(
    request.headers.get("x-pantavion-water-device-id"),
    180,
  );
  const deviceToken = clean(
    request.headers.get("x-pantavion-water-device-token"),
    500,
  );

  if (!deviceId || !deviceToken) {
    return { ok: false, error: "water_map_upload_access_denied" };
  }

  const approved = await migrateLegacyApprovedDeviceIfPresent(
    deviceId,
    hashToken(deviceToken),
  );

  if (!approved) {
    return { ok: false, error: "water_map_upload_access_denied" };
  }

  return {
    ok: true,
    kind: "approved_device",
    actorRef: `water-device:${deviceId}`,
    deviceId,
  };
}
