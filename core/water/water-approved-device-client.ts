"use client";

export type PantavionWaterApprovedDeviceClaim = {
  deviceId: string;
  deviceToken: string;
};

function clean(value: string | null) {
  return (value || "").trim();
}

export function readPantavionWaterApprovedDeviceClaim():
  | PantavionWaterApprovedDeviceClaim
  | null {
  if (typeof window === "undefined") return null;

  const deviceId =
    clean(window.localStorage.getItem("pantavion_water_device_id")) ||
    clean(window.localStorage.getItem("pantavion-water-device-id")) ||
    clean(window.localStorage.getItem("pantavion:water:device-id:v1")) ||
    clean(window.localStorage.getItem("waterDeviceId"));

  const deviceToken =
    clean(window.localStorage.getItem("pantavion_water_device_token")) ||
    clean(window.localStorage.getItem("pantavion-water-device-token")) ||
    clean(window.localStorage.getItem("pantavion:water:device-token:v1")) ||
    clean(window.localStorage.getItem("waterDeviceToken"));

  if (deviceId && deviceToken) {
    return { deviceId, deviceToken };
  }

  for (const key of [
    "pantavion_water_access_device",
    "pantavion-water-access-device",
    "waterAccessDevice",
    "water-approved-device",
  ]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as {
        deviceId?: unknown;
        id?: unknown;
        deviceToken?: unknown;
        token?: unknown;
      };

      const packedDeviceId =
        typeof parsed.deviceId === "string"
          ? parsed.deviceId.trim()
          : typeof parsed.id === "string"
            ? parsed.id.trim()
            : "";

      const packedDeviceToken =
        typeof parsed.deviceToken === "string"
          ? parsed.deviceToken.trim()
          : typeof parsed.token === "string"
            ? parsed.token.trim()
            : "";

      if (packedDeviceId && packedDeviceToken) {
        return {
          deviceId: packedDeviceId,
          deviceToken: packedDeviceToken,
        };
      }
    } catch {
      // Ignore malformed legacy records and remain fail-closed.
    }
  }

  return null;
}

export function pantavionWaterApprovedDeviceHeaders(): Record<string, string> {
  const claim = readPantavionWaterApprovedDeviceClaim();

  if (!claim) return {};

  return {
    "x-pantavion-water-device-id": claim.deviceId,
    "x-pantavion-water-device-token": claim.deviceToken,
  };
}
