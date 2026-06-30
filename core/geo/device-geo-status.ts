export type PantavionDeviceGeoStatus =
  | "permission_required"
  | "available"
  | "invalid"
  | "blocked";

export type PantavionGeoSource =
  | "browser_geolocation"
  | "manual_search"
  | "gps_device"
  | "unknown";

export type PantavionGeoSurface = "B" | "C" | "unknown";

export type PantavionDeviceGeoStatusInput = {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  altitudeMeters?: number | null;
  headingDegrees?: number | null;
  speedMetersPerSecond?: number | null;
  source?: PantavionGeoSource;
  requestedSurface?: PantavionGeoSurface | string;
  consentGranted?: boolean;
  ephemeralOnly?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionGeoViewportBBox = {
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
  radiusMeters: number;
};

export type PantavionDeviceGeoStatusAssessment = {
  ok: true;
  requestId: string;
  status: PantavionDeviceGeoStatus;
  source: PantavionGeoSource;
  requestedSurface: PantavionGeoSurface;
  consentGranted: boolean;
  latitudeRounded?: number;
  longitudeRounded?: number;
  accuracyMeters?: number;
  viewport?: PantavionGeoViewportBBox;
  canOpenCurrentArea: boolean;
  canSearchNearbyRoads: boolean;
  canBindToDwgViewport: boolean;
  requiresUserConsent: true;
  preciseLocationStored: false;
  continuousTracking: false;
  backgroundTracking: false;
  ephemeralOnly: boolean;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(5));
}

function normalizeSurface(value: unknown): PantavionGeoSurface {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "B") {
    return "B";
  }
  if (raw === "C") {
    return "C";
  }
  return "unknown";
}

function normalizeSource(value: unknown): PantavionGeoSource {
  const raw = String(value || "").trim();

  if (
    raw === "browser_geolocation" ||
    raw === "manual_search" ||
    raw === "gps_device"
  ) {
    return raw;
  }

  return "unknown";
}

function buildViewport(latitude: number, longitude: number, accuracyMeters?: number): PantavionGeoViewportBBox {
  const safeAccuracy = typeof accuracyMeters === "number" && Number.isFinite(accuracyMeters)
    ? accuracyMeters
    : 50;

  const radiusMeters = Math.min(Math.max(safeAccuracy, 25), 2000);
  const latDelta = radiusMeters / 111320;
  const lngScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
  const lngDelta = radiusMeters / (111320 * lngScale);

  return {
    minLatitude: roundCoordinate(latitude - latDelta),
    minLongitude: roundCoordinate(longitude - lngDelta),
    maxLatitude: roundCoordinate(latitude + latDelta),
    maxLongitude: roundCoordinate(longitude + lngDelta),
    radiusMeters: Math.round(radiusMeters)
  };
}

export function assessPantavionDeviceGeoStatus(
  input: PantavionDeviceGeoStatusInput
): PantavionDeviceGeoStatusAssessment {
  const source = normalizeSource(input.source ?? "browser_geolocation");
  const requestedSurface = normalizeSurface(input.requestedSurface ?? "C");
  const consentGranted = Boolean(input.consentGranted);
  const ephemeralOnly = input.ephemeralOnly !== false;

  const validLat = isValidLatitude(input.latitude);
  const validLng = isValidLongitude(input.longitude);

  const blocked = !consentGranted;
  const invalid = consentGranted && (!validLat || !validLng);

  const status: PantavionDeviceGeoStatus = blocked
    ? "permission_required"
    : invalid
      ? "invalid"
      : "available";

  const latitudeRounded = validLat ? roundCoordinate(input.latitude as number) : undefined;
  const longitudeRounded = validLng ? roundCoordinate(input.longitude as number) : undefined;

  const viewport =
    status === "available" && typeof latitudeRounded === "number" && typeof longitudeRounded === "number"
      ? buildViewport(latitudeRounded, longitudeRounded, input.accuracyMeters)
      : undefined;

  const notes: string[] = [
    "Device geo status uses explicit browser/device permission.",
    "Precise coordinates are not persisted by default.",
    "The current position is used to calculate a viewport so Pantavion can open only the requested area.",
    "Continuous/background tracking is disabled."
  ];

  if (!consentGranted) {
    notes.push("Location permission is required before Pantavion can open the current area.");
  }

  if (invalid) {
    notes.push("Invalid latitude or longitude received from the client.");
  }

  if (viewport) {
    notes.push("Viewport bbox calculated from current position and GPS accuracy.");
  }

  if (requestedSurface === "B") {
    notes.push("Surface B remains original DWG only. Geo status may request viewport, but overlays remain blocked.");
  }

  if (requestedSurface === "C") {
    notes.push("Surface C may use current position for future search/viewport controls after adapter/index checks.");
  }

  return {
    ok: true,
    requestId: `geo_status_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    status,
    source,
    requestedSurface,
    consentGranted,
    latitudeRounded,
    longitudeRounded,
    accuracyMeters: input.accuracyMeters,
    viewport,
    canOpenCurrentArea: status === "available",
    canSearchNearbyRoads: status === "available",
    canBindToDwgViewport: status === "available",
    requiresUserConsent: true,
    preciseLocationStored: false,
    continuousTracking: false,
    backgroundTracking: false,
    ephemeralOnly,
    blocked: status !== "available",
    notes,
    auditTags: [
      "geo_status",
      "device_location",
      source,
      `surface_${requestedSurface.toLowerCase()}`,
      status,
      "no_background_tracking",
      "ephemeral_location"
    ],
    assessedAt: new Date().toISOString()
  };
}

export function listPantavionDeviceGeoStatusPolicy() {
  return {
    requiresUserConsent: true,
    preciseLocationStored: false,
    continuousTracking: false,
    backgroundTracking: false,
    supportedSources: ["browser_geolocation", "manual_search", "gps_device"],
    supportedSurfaces: ["B", "C"],
    purpose:
      "Use current device position to calculate a viewport/search bbox so Pantavion opens only the relevant map/DWG area."
  };
}
