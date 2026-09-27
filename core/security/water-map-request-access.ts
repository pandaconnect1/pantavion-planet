import "server-only";

import { createHash } from "crypto";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";

export type WaterMapRequestAccess =
  | {
      ok: true;
      mode: "admin-session" | "approved-device";
      actorRef: string;
      deviceId: string | null;
    }
  | { ok: false; error: "access_not_approved" };

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function authorizeWaterMapRequest(
  request: Request,
): Promise<WaterMapRequestAccess> {
  if (await hasWaterAdminAuthorization(request)) {
    return {
      ok: true,
      mode: "admin-session",
      actorRef: "admin-session",
      deviceId: null,
    };
  }

  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));

  if (!deviceId || !deviceToken) {
    return { ok: false, error: "access_not_approved" };
  }

  const approved = await migrateLegacyApprovedDeviceIfPresent(
    deviceId,
    hashToken(deviceToken),
  );

  if (approved) {
    return {
      ok: true,
      mode: "approved-device",
      actorRef: deviceId,
      deviceId,
    };
  }

  return { ok: false, error: "access_not_approved" };
}
