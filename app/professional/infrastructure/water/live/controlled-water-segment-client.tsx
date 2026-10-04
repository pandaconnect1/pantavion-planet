"use client";

import { useEffect, useRef, useState } from "react";
import { WATER_MATERIAL_SAMPLE_CATALOG } from "@/core/water/water-material-catalog";
import {
  PANTAVION_LANGUAGE_CATALOG,
  getPantavionUiLanguage,
  getSupportedPantavionLanguage,
} from "@/core/language/pantavion-language-catalog";

declare global {
  interface Window {
    L?: any;
  }
}

type Lang = string;

type AccessState = "checking" | "approved" | "denied" | "error";

type SegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: any[];
  };
  segmentCount?: number;
  segmentTruncated?: boolean;
  pipeSegmentCount?: number;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
  diagnosticCode?: string;
};

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type NetworkXyzTile = {
  key: string;
  z: number;
  x: number;
  y: number;
  bbox: Bbox;
};

type ApprovedMapAPatch = {
  patch_id: string;
  asset_type: string;
  operation: string;
  status: string;
  map_id: string;
  source_key?: string | null;
  geometry_type: "Point" | "LineString" | "Polygon";
  geometry: {
    type?: string;
    coordinates?: unknown;
  };
  crs_authority?: string | null;
  crs_code?: string | null;
  street_name?: string | null;
  artifact_refs?: string[] | null;
  attributes?: Record<string, unknown> | null;
};

type ApprovedMapAEvidencePin = {
  pin_id: string;
  review_state: string;
  map_id: string;
  source_key?: string | null;
  x: number;
  y: number;
  crs_authority?: string | null;
  crs_code?: string | null;
  street_name?: string | null;
  note?: string | null;
  artifact_refs?: string[] | null;
};

type ApprovedPatchResponse = {
  ok?: boolean;
  error?: string;
  patches?: ApprovedMapAPatch[];
};

type ApprovedPinResponse = {
  ok?: boolean;
  error?: string;
  pins?: ApprovedMapAEvidencePin[];
};

type RemovableWaterLayer = {
  remove: () => void;
};

function coordinatePair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const x = Number(value[0]);
  const y = Number(value[1]);

  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function lineCoordinates(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => coordinatePair(item))
    .filter((item): item is [number, number] => item !== null);
}

function polygonCoordinates(value: unknown): Array<Array<[number, number]>> {
  if (!Array.isArray(value)) return [];

  return value
    .map((ring) => lineCoordinates(ring))
    .filter((ring) => ring.length >= 3);
}

function fieldArtifactRequestId(reference: string) {
  const prefix = "water-field-artifact:";
  return reference.startsWith(prefix) ? reference.slice(prefix.length) : null;
}

const UI = {
  el: {
    title: "Δίκτυο Ύδρευσης Pantavion",
    subtitle:
      "Αληθινό δίκτυο αγωγών από το αυθεντικό KMZ. Δεν αλλάζουμε χρώματα, γραμμές ή αγωγούς. Ο browser φορτώνει μόνο ελεγχόμενα τμήματα.",
    language: "Γλώσσα",
    street: "Οδός",
    number: "Αριθμός",
    area: "Περιοχή",
    postal: "Ταχυδρομικός",
    load: "Φόρτωσε αγωγούς στην ορατή περιοχή",
    loading: "Φόρτωση...",
    ready: "Ο χάρτης είναι έτοιμος. Μετακίνησε ή κάνε zoom. Οι αγωγοί φορτώνουν τμηματικά.",
    loaded: "Φορτώθηκαν αγωγοί",
    failed:
      "Προσωρινό σφάλμα φόρτωσης. Οι σωληνώσεις δεν έχουν διαγραφεί. Δοκίμασε ξανά ή μετακίνησε λίγο τον χάρτη.",
    map: "Χάρτης ύδρευσης",
    protected: "Το πλήρες δίκτυο δεν φορτώνεται στον browser.",
    accessTitle: "Προστατευμένος χάρτης",
    accessText:
      "Η πρόσβαση στους χάρτες ύδρευσης απαιτεί ρητή εξουσιοδότηση και έγκριση υπεύθυνου Pantavion.",
    requestAccess: "Αίτηση πρόσβασης",
    requestText:
      "Στείλε αίτημα με τα στοιχεία σου. Δεν ανοίγει ο χάρτης μέχρι να εγκριθείς.",
    founderAccess: "Είσοδος εγκεκριμένου χρήστη",
    firstName: "Όνομα",
    lastName: "Επίθετο",
    roleTitle: "Τίτλος / Ρόλος",
    organization: "Οργανισμός / Εταιρεία",
    emailOrPhone: "Τηλέφωνο",
    reason: "Λόγος πρόσβασης",
    accessCode: "Founder code ή αυτόματος έλεγχος εγκεκριμένης συσκευής",
    submitRequest: "Αποστολή αίτησης για έγκριση",
    requestSent: "Η αίτηση στάλθηκε για έγκριση. Δεν έχει δοθεί πρόσβαση ακόμη.",
    requestMissing: "Συμπλήρωσε όνομα, επίθετο, τίτλο/ρόλο και τηλέφωνο.",
    requestFailed: "Δεν στάλθηκε η αίτηση. Δοκίμασε ξανά.",
    enterApproved: "Είσοδος με έγκριση",
    accessDenied: "Δεν υπάρχει έγκριση ή ο κωδικός δεν είναι σωστός.",
    accessNotConfigured: "Δεν έχει ρυθμιστεί ακόμη κωδικός πρόσβασης στο server.",
    accessApproved: "Η πρόσβαση εγκρίθηκε.",
    accessChecking: "Γίνεται ασφαλής έλεγχος πρόσβασης από τον server...",
    accessRequired:
      "Η συσκευή δεν αναγνωρίστηκε ακόμη ως εγκεκριμένη. Αν είσαι ήδη εγκεκριμένος χρήστης, πάτησε Επανέλεγχος πρόσβασης. Δεν χρειάζεται νέο αίτημα εκτός αν η συσκευή σου έχει αλλάξει.",
    accessCheckFailed:
      "Ο έλεγχος πρόσβασης δεν ολοκληρώθηκε λόγω προσωρινού τεχνικού προβλήματος. Οι σωληνώσεις δεν έχουν χαθεί.",
    adminLogin: "Είσοδος Administrator",
    retryAccess: "Επανέλεγχος πρόσβασης",
    locate: "Το σημείο μου",
    search: "Αναζήτηση / Στίγμα",
    locating: "Εντοπισμός θέσης...",
    located: "Βρέθηκε η θέση σου. Φορτώνω τοπικό δίκτυο.",
    locationUnavailable:
      "Δεν ήταν διαθέσιμη η θέση. Μπορείς να μετακινήσεις τον χάρτη ή να κάνεις αναζήτηση.",
    searchEmpty: "Γράψε οδό, περιοχή ή ταχυδρομικό.",
    searchNotFound: "Δεν βρέθηκε το σημείο. Δοκίμασε πιο πλήρη διεύθυνση.",
    searchFound: "Βρέθηκε στίγμα. Φορτώνω τοπικό δίκτυο.",
    visibleTooLarge: "Η ορατή περιοχή είναι μεγάλη. Κάνε λίγο zoom.",
    diagnostic: "Κωδικός",
    chunks: "τμήματα οθόνης",
  },
  en: {
    title: "Pantavion Water Network",
    subtitle:
      "Real pipe network from the authentic KMZ. Colors, lines and pipe geometry are not changed. The browser receives only controlled segments.",
    language: "Language",
    street: "Street",
    number: "Number",
    area: "Area",
    postal: "Postal code",
    load: "Load pipes in visible area",
    loading: "Loading...",
    ready: "Map is ready. Pan or zoom. Pipes load automatically in safe chunks.",
    loaded: "Loaded pipes",
    failed:
      "Temporary loading error. The pipes have not been deleted. Try again or move the map slightly.",
    map: "Water map",
    protected: "The complete network is not loaded in the browser.",
    accessTitle: "Protected map",
    accessText:
      "Access to water maps requires explicit authorization and Pantavion responsible-person approval.",
    requestAccess: "Request access",
    requestText: "Send your details. The map does not open until you are approved.",
    founderAccess: "Approved user entry",
    firstName: "First name",
    lastName: "Last name",
    roleTitle: "Title / Role",
    organization: "Organization / Company",
    emailOrPhone: "Email or phone",
    reason: "Reason for access",
    accessCode: "Approval code",
    submitRequest: "Submit request for approval",
    requestSent: "The request was sent for approval. Access has not been granted yet.",
    requestMissing: "Fill first name, last name, title, contact and access reason.",
    requestFailed: "Request was not sent. Try again.",
    enterApproved: "Enter with approval",
    accessDenied: "No approval or wrong code.",
    accessNotConfigured: "Server access code is not configured yet.",
    accessApproved: "Access approved.",
    accessChecking: "Securely checking access with the server...",
    accessRequired:
      "This device is not yet recognized as approved. If you were already approved, tap Check access again. Do not submit a new request unless your device has changed.",
    accessCheckFailed:
      "The access check could not complete because of a temporary technical problem. The pipes have not been lost.",
    adminLogin: "Administrator sign-in",
    retryAccess: "Check access again",
    locate: "My location",
    search: "Search / Marker",
    locating: "Locating...",
    located: "Your location was found. Loading local network.",
    locationUnavailable: "Location was not available. You can pan the map or search.",
    searchEmpty: "Enter street, area or postal code.",
    searchNotFound: "No matching point found. Try a fuller address.",
    searchFound: "Search marker found. Loading local network.",
    visibleTooLarge: "The visible area is large. Zoom in a little.",
    diagnostic: "Code",
    chunks: "screen chunks",
  },
};

const MAX_FEATURES_PER_TILE = 1200;
const MAX_RECURSIVE_TILE_DEPTH = 6;
const MAX_SEGMENT_REQUESTS = 128;
const MIN_RECURSIVE_TILE_SPAN_DEGREES = 0.00025;
const MAX_VISIBLE_NETWORK_TILES = 24;
const MAX_NETWORK_TILE_CACHE = 160;
const MIN_NETWORK_TILE_ZOOM = 13;
const TARGET_POINT_MIN_ZOOM = 16;
const MAX_NETWORK_TILE_ZOOM = 19;

const LEGACY_WATER_DEVICE_APPROVAL_KEY = "pantavion:water:approved-until:v4";
function clearLegacyWaterDeviceApproval() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_WATER_DEVICE_APPROVAL_KEY);
}


const PANTAVION_WATER_DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const PANTAVION_WATER_DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";

function randomWaterDeviceSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));

    return Array.from(values)
      .map((value) => value.toString(36))
      .join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateWaterAccessDevice() {
  if (typeof window === "undefined") {
    return {
      deviceId: "",
      deviceToken: "",
      deviceLabel: "",
    };
  }

  const legacyDeviceIdKeys = [
    "pantavion_water_device_id",
    "pantavion-water-device-id",
    "waterDeviceId",
  ];
  const legacyDeviceTokenKeys = [
    "pantavion_water_device_token",
    "pantavion-water-device-token",
    "waterDeviceToken",
  ];

  let deviceId = window.localStorage.getItem(PANTAVION_WATER_DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(PANTAVION_WATER_DEVICE_TOKEN_KEY) || "";

  // Preserve the exact identity of devices that were already approved before
  // the Railway/Supabase migration. Do not generate a new identity until all
  // known legacy keys have been checked.
  if (!deviceId) {
    for (const key of legacyDeviceIdKeys) {
      const value = window.localStorage.getItem(key) || "";
      if (value) {
        deviceId = value;
        window.localStorage.setItem(PANTAVION_WATER_DEVICE_ID_KEY, value);
        break;
      }
    }
  }

  if (!deviceToken) {
    for (const key of legacyDeviceTokenKeys) {
      const value = window.localStorage.getItem(key) || "";
      if (value) {
        deviceToken = value;
        window.localStorage.setItem(PANTAVION_WATER_DEVICE_TOKEN_KEY, value);
        break;
      }
    }
  }

  if (!deviceId) {
    deviceId = `water-device-${Date.now().toString(36)}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = `water-token-${randomWaterDeviceSecret()}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_TOKEN_KEY, deviceToken);
  }

  return {
    deviceId,
    deviceToken,
    deviceLabel: `${window.navigator.platform || "unknown"} / ${window.navigator.userAgent.slice(0, 90)}`,
  };
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "el";

  const saved = window.localStorage.getItem("pantavion-language");

  return getSupportedPantavionLanguage(saved)?.code ?? "el";
}

let leafletPromise: Promise<any> | null = null;

function ensureLeaflet() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window unavailable"));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (!leafletPromise) {
    leafletPromise = import("leaflet")
      .then((leafletModule) => {
        const Leaflet = leafletModule.default || leafletModule;
        window.L = Leaflet;
        return Leaflet;
      })
      .catch((error) => {
        leafletPromise = null;
        throw error;
      });
  }

  return leafletPromise;
}

function getPipeStyle(feature: {
  properties?: {
    sourceColorCss?: unknown;
    sourceLineWidth?: unknown;
    sourceOpacity?: unknown;
    kmlLineStyle?: {
      color?: unknown;
      weight?: unknown;
      width?: unknown;
      opacity?: unknown;
    } | null;
  };
} | null | undefined) {
  const properties = feature?.properties;
  const raw = properties?.kmlLineStyle;

  const sourceColor =
    typeof properties?.sourceColorCss === "string"
      ? properties.sourceColorCss
      : raw && typeof raw === "object" && typeof raw.color === "string"
        ? raw.color
        : null;

  const sourceWidth =
    typeof properties?.sourceLineWidth === "number"
      ? properties.sourceLineWidth
      : raw && typeof raw === "object" && typeof raw.weight === "number"
        ? raw.weight
        : raw && typeof raw === "object" && typeof raw.width === "number"
          ? raw.width
          : null;

  const sourceOpacity =
    typeof properties?.sourceOpacity === "number"
      ? properties.sourceOpacity
      : raw && typeof raw === "object" && typeof raw.opacity === "number"
        ? raw.opacity
        : null;

  if (!sourceColor) {
    return {
      color: "transparent",
      weight: 0,
      opacity: 0,
    };
  }

  return {
    color: sourceColor,
    // Preserve the authentic source line weight on screen. Only prevent a
    // sub-pixel line from disappearing completely; do not artificially thicken
    // the Water network.
    weight: Math.max(1, Math.min(6, sourceWidth ?? 1)),
    opacity: Math.max(0.05, Math.min(1, sourceOpacity ?? 1)),
  };
}

function bboxFromMap(map: any): Bbox {
  const bounds = map.getBounds();

  return {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  };
}

function bboxParams(bbox: Bbox) {
  return {
    minLng: bbox.minLng.toFixed(6),
    minLat: bbox.minLat.toFixed(6),
    maxLng: bbox.maxLng.toFixed(6),
    maxLat: bbox.maxLat.toFixed(6),
  };
}

function clampMercatorLat(lat: number) {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function lngToTileX(lng: number, z: number) {
  const n = 2 ** z;
  return Math.floor(((lng + 180) / 360) * n);
}

function latToTileY(lat: number, z: number) {
  const n = 2 ** z;
  const rad = (clampMercatorLat(lat) * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n,
  );
}

function tileXToLng(x: number, z: number) {
  return (x / 2 ** z) * 360 - 180;
}

function tileYToLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

function visibleNetworkXyzTiles(map: any): NetworkXyzTile[] {
  const bounds = map.getBounds();
  const z = Math.max(
    MIN_NETWORK_TILE_ZOOM,
    Math.min(MAX_NETWORK_TILE_ZOOM, Math.round(map.getZoom())),
  );
  const n = 2 ** z;
  const minX = Math.max(0, Math.min(n - 1, lngToTileX(bounds.getWest(), z)));
  const maxX = Math.max(0, Math.min(n - 1, lngToTileX(bounds.getEast(), z)));
  const minY = Math.max(0, Math.min(n - 1, latToTileY(bounds.getNorth(), z)));
  const maxY = Math.max(0, Math.min(n - 1, latToTileY(bounds.getSouth(), z)));

  const tiles: NetworkXyzTile[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      tiles.push({
        key: `${z}/${x}/${y}`,
        z,
        x,
        y,
        bbox: {
          minLng: tileXToLng(x, z),
          minLat: tileYToLat(y + 1, z),
          maxLng: tileXToLng(x + 1, z),
          maxLat: tileYToLat(y, z),
        },
      });
    }
  }

  if (tiles.length > MAX_VISIBLE_NETWORK_TILES) {
    throw new Error("VISIBLE_AREA_TOO_LARGE");
  }

  return tiles;
}

function splitBboxIntoQuadrants(bbox: Bbox) {
  const midLng = (bbox.minLng + bbox.maxLng) / 2;
  const midLat = (bbox.minLat + bbox.maxLat) / 2;

  return [
    {
      minLng: bbox.minLng,
      minLat: bbox.minLat,
      maxLng: midLng,
      maxLat: midLat,
    },
    {
      minLng: midLng,
      minLat: bbox.minLat,
      maxLng: bbox.maxLng,
      maxLat: midLat,
    },
    {
      minLng: bbox.minLng,
      minLat: midLat,
      maxLng: midLng,
      maxLat: bbox.maxLat,
    },
    {
      minLng: midLng,
      minLat: midLat,
      maxLng: bbox.maxLng,
      maxLat: bbox.maxLat,
    },
  ];
}

function featureKey(feature: {
  id?: unknown;
  properties?: { placemarkIndex?: unknown; featureIndex?: unknown; name?: unknown };
} | null | undefined, fallback: string) {
  const id =
    feature?.id ??
    feature?.properties?.placemarkIndex ??
    feature?.properties?.featureIndex ??
    feature?.properties?.name;

  return id === undefined || id === null ? fallback : String(id);
}


export default function ControlledWaterSegmentClient() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [accessCheckVersion, setAccessCheckVersion] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [reason, setReason] = useState("");
  const [street, setStreet] = useState("");
  const [unifiedQuery, setUnifiedQuery] = useState("");
  const [number, setNumber] = useState("");
  const [area, setArea] = useState("Λεμεσός");
  const [postal, setPostal] = useState("");
  const [message, setMessage] = useState(UI.el.ready);
  const [accessMessage, setAccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipeCount, setPipeCount] = useState<number | null>(null);
  const [approvedChangeCount, setApprovedChangeCount] = useState(0);
  const [approvedEvidenceCount, setApprovedEvidenceCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [basemapState, setBasemapState] = useState<"loading" | "pantavion" | "fallback">("loading");
  const [workPanelOpen, setWorkPanelOpen] = useState(false);
  const [workStage, setWorkStage] = useState("FAULT");
  const [workOrderId, setWorkOrderId] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [excavationLength, setExcavationLength] = useState("");
  const [excavationWidth, setExcavationWidth] = useState("");
  const [excavationDepth, setExcavationDepth] = useState("");
  const [workMaterial, setWorkMaterial] = useState("");
  const [workMaterialQty, setWorkMaterialQty] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [workEvidence, setWorkEvidence] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [addressCandidates, setAddressCandidates] = useState<Array<{
    candidateId: string;
    displayName: string;
    coordinates: { lat: number; lng: number };
  }>>([]);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const networkTileCacheRef = useRef<
    Map<string, { layer: any; featureCount: number; lastUsedAt: number }>
  >(new Map());
  const userMarkerRef = useRef<any>(null);
  const userAccuracyRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const approvedOverlayRef = useRef<RemovableWaterLayer | null>(null);
  const autoLoadTimerRef = useRef<number | null>(null);
  const loadInProgressRef = useRef(false);
  const networkLoadAbortRef = useRef<AbortController | null>(null);
  const reloadQueuedRef = useRef(false);
  const scheduleViewportReloadRef = useRef<(() => void) | null>(null);
  const refreshVisibleWaterMapRef = useRef<() => Promise<void>>(async () => {});
  const selectMapPointRef = useRef(selectMapPoint);

  const t = UI[getPantavionUiLanguage(lang)];
  const accessApproved = accessState === "approved";

  useEffect(() => {
    selectMapPointRef.current = selectMapPoint;
  });

  useEffect(() => {
    let cancelled = false;

    async function checkApprovedDevice() {
      setAccessState("checking");
      setAccessMessage("");
      clearLegacyWaterDeviceApproval();

      const device = getOrCreateWaterAccessDevice();

      const fragment = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const inviteToken = new URLSearchParams(fragment).get("invite")?.trim() || "";

      if (inviteToken) {
        try {
          const inviteResponse = await fetch(
            "/api/professional/infrastructure/water/access/invite/claim",
            {
              method: "POST",
              cache: "no-store",
              credentials: "include",
              signal: AbortSignal.timeout(8000),
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                inviteToken,
                deviceId: device.deviceId,
                deviceToken: device.deviceToken,
              }),
            },
          );

          const inviteJson = (await inviteResponse.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            recipientLabel?: string;
          };

          if (!cancelled && inviteResponse.ok && inviteJson.ok) {
            window.history.replaceState(
              {},
              document.title,
              `${window.location.pathname}${window.location.search}`,
            );
            setAccessMessage(
              inviteJson.recipientLabel
                ? `Η πρόσβαση ενεργοποιήθηκε για ${inviteJson.recipientLabel} και κλειδώθηκε σε αυτή τη συσκευή.`
                : "Η πρόσβαση ενεργοποιήθηκε και κλειδώθηκε σε αυτή τη συσκευή.",
            );
            setAccessState("approved");
            return;
          }

          if (
            !cancelled &&
            (inviteJson.error === "already_claimed_other_device" ||
              inviteJson.error === "revoked" ||
              inviteJson.error === "expired")
          ) {
            window.history.replaceState(
              {},
              document.title,
              `${window.location.pathname}${window.location.search}`,
            );
            setAccessMessage(
              inviteJson.error === "already_claimed_other_device"
                ? "Αυτό το SMS link έχει ήδη κλειδωθεί σε άλλη συσκευή και δεν μπορεί να χρησιμοποιηθεί εδώ."
                : "Αυτό το SMS link δεν είναι πλέον ενεργό.",
            );
            setAccessState("denied");
            return;
          }
        } catch {
          if (!cancelled) {
            setAccessMessage(
              "Δεν ολοκληρώθηκε προσωρινά η ενεργοποίηση του SMS link. Δοκίμασε ξανά από την ίδια συσκευή.",
            );
          }
        }
      }

      try {
        const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          signal: AbortSignal.timeout(8000),
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            deviceId: device.deviceId,
            deviceToken: device.deviceToken,
          }),
        });

        const json = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };

        if (!cancelled && response.ok && json.ok) {
          setAccessState("approved");
          return;
        }

        if (
          !cancelled &&
          (response.status === 401 ||
            response.status === 403 ||
            json.error === "access_not_approved")
        ) {
          try {
            const claimResponse = await fetch(
              "/api/professional/infrastructure/water/access/admin/claim-device",
              {
                method: "POST",
                cache: "no-store",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  deviceId: device.deviceId,
                  deviceToken: device.deviceToken,
                }),
              },
            );

            const claimJson = (await claimResponse.json().catch(() => ({}))) as {
              ok?: boolean;
              approved?: boolean;
            };

            if (!cancelled && claimResponse.ok && claimJson.ok && claimJson.approved) {
              setAccessMessage("Η founder/admin συσκευή αναγνωρίστηκε και εγκρίθηκε.");
              setAccessState("approved");
              return;
            }
          } catch {
            // Fall through to normal denied state. No public auto-approval.
          }

          if (!cancelled) setAccessState("denied");
          return;
        }

        if (!cancelled) {
          setAccessState("error");
        }
      } catch {
        if (!cancelled) {
          setAccessState("error");
        }
      }
    }

    void checkApprovedDevice();

    return () => {
      cancelled = true;
    };
  }, [accessCheckVersion]);

  useEffect(() => {
    window.localStorage.setItem("pantavion-language", lang);
    document.documentElement.lang = lang;
    const uiLang = getPantavionUiLanguage(lang);
    setMessage(pipeCount === null ? UI[uiLang].ready : `${UI[uiLang].loaded}: ${pipeCount}`);
  }, [lang, pipeCount]);

  useEffect(() => {
    let cancelled = false;
    const tileCache = networkTileCacheRef.current;

    ensureLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = L.map(mapEl.current, {
          center: [34.681, 33.038],
          zoom: 15,
          zoomControl: true,
          preferCanvas: true,
        });

        const waterNetworkPane = map.createPane("pantavion-water-network");
        waterNetworkPane.style.zIndex = "450";
        waterNetworkPane.style.pointerEvents = "none";

        // BASEMAP-ONLY CHANGE:
        // Keep the authentic Water network renderer, authorization, tile cache,
        // segment API, geometry and styles untouched. Only replace the visual
        // background beneath the dedicated Water pane.
        // BASEMAP-ONLY STABILIZATION:
        // Keep the proven Leaflet-only runtime so the visual basemap cannot
        // compete with or interfere with protected Water viewport loading.
        // The Water pane, segmented API, geometry, source styles and cache stay untouched.
        const emergencyRoadFallback = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          pane: "tilePane",
          maxZoom: 20,
          attribution: "&copy; OpenStreetMap contributors",
        });

        const detailedRoadBasemap = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            pane: "tilePane",
            maxZoom: 20,
            attribution: "Tiles &copy; Esri",
          },
        );

        let detailedBasemapFailures = 0;
        setBasemapState("loading");

        detailedRoadBasemap.on("tileload", () => {
          if (!cancelled) setBasemapState("pantavion");
        });

        detailedRoadBasemap.on("tileerror", () => {
          detailedBasemapFailures += 1;
          if (cancelled || detailedBasemapFailures < 4) return;

          if (map.hasLayer(detailedRoadBasemap)) {
            map.removeLayer(detailedRoadBasemap);
          }
          if (!map.hasLayer(emergencyRoadFallback)) {
            emergencyRoadFallback.addTo(map);
          }
          setBasemapState("fallback");
        });

        detailedRoadBasemap.addTo(map);

        mapRef.current = map;
        map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
          void selectMapPointRef.current(event);
        });
        setMapReady(true);
        window.setTimeout(() => map.invalidateSize(), 300);
        window.setTimeout(() => map.invalidateSize(), 900);
      })
      .catch(() => setMessage(UI[getPantavionUiLanguage(lang)].failed));

    return () => {
      cancelled = true;
      setMapReady(false);

      if (mapRef.current) {
        for (const cached of tileCache.values()) {
          try {
            cached.layer.remove();
          } catch {}
        }
        tileCache.clear();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lang, accessApproved]);

  async function submitAccessRequest() {
    if (!firstName.trim() || !lastName.trim() || !roleTitle.trim() || !emailOrPhone.trim()) {
      setAccessMessage(t.requestMissing);
      return;
    }

    setLoading(true);
    setAccessMessage(t.loading);

    const device = getOrCreateWaterAccessDevice();

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          title: roleTitle,
          organization,
          emailOrPhone,
          reason,
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
          deviceLabel: device.deviceLabel,
        }),
      });

      if (!response.ok) {
        throw new Error("request_failed");
      }

      const json = (await response.json()) as { requestId?: string };
      setAccessMessage(`${t.requestSent} Request ID: ${json.requestId || "pending"}. Μείνε στην ίδια συσκευή μέχρι να εγκριθεί.`);
    } catch {
      setAccessMessage(t.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  async function placeCircleMarker(options: {
    lat: number;
    lng: number;
    title: string;
    kind: "user" | "search";
    accuracy?: number;
  }) {
    const map = mapRef.current;

    if (!map) return;

    const L = await ensureLeaflet();
    const markerRef = options.kind === "user" ? userMarkerRef : searchMarkerRef;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const markerColor = options.kind === "user" ? "#f2c766" : "#ef4444";

    markerRef.current = L.circleMarker([options.lat, options.lng], {
      radius: options.kind === "user" ? 15 : 9,
      color: options.kind === "user" ? "#ffffff" : "#07111f",
      weight: options.kind === "user" ? 5 : 3,
      fillColor: markerColor,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(options.kind === "user" ? "Η θέση μου" : options.title);

    if (options.kind === "user") {
      markerRef.current
        .bindTooltip("Η θέση μου", {
          permanent: true,
          direction: "top",
          offset: [0, -14],
          opacity: 0.95,
        })
        .openTooltip()
        .bringToFront();
    }

    if (options.kind === "user") {
      if (userAccuracyRef.current) {
        userAccuracyRef.current.remove();
        userAccuracyRef.current = null;
      }

      if (typeof options.accuracy === "number" && Number.isFinite(options.accuracy)) {
        userAccuracyRef.current = L.circle([options.lat, options.lng], {
          radius: Math.max(15, Math.min(options.accuracy, 250)),
          color: "#f2c766",
          weight: 1,
          fillColor: "#f2c766",
          fillOpacity: 0.08,
        }).addTo(map);
      }
    }
  }

  function moveMapToPoint(lat: number, lng: number) {
    const map = mapRef.current;

    if (!map) return;

    map.setView([lat, lng], Math.max(map.getZoom(), TARGET_POINT_MIN_ZOOM), {
      animate: false,
    });
  }

  function refreshCurrentViewportNow() {
    // Field actions must not depend on the debounced move/zoom listener being
    // installed. Cancel stale work and force the protected current viewport
    // to load immediately; an in-flight request will queue exactly one retry.
    reloadQueuedRef.current = false;
    networkLoadAbortRef.current?.abort();
    window.setTimeout(() => {
      void refreshVisibleWaterMapRef.current();
    }, 0);
  }

  async function selectMapPoint(event: { latlng: { lat: number; lng: number } }) {
    const map = mapRef.current;
    const { lat, lng } = event.latlng;
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    try {
      await placeCircleMarker({
        lat,
        lng,
        kind: "search",
        title: lang === "el" ? "Επιλεγμένο σημείο" : "Selected point",
      });
      // Keep GPS separate: a manual selection moves only the search marker.
      if (mapRef.current !== map) return;
      moveMapToPoint(lat, lng);
      setSelectedTarget({ lat, lng });
      setMessage(t.searchFound);
      // A selected field point must always trigger the real network, even if
      // Leaflet emits no move event or the debounced listener is not ready.
      refreshCurrentViewportNow();
    } catch {
      setMessage(t.failed);
    }
  }

  function navigateToSelectedTarget() {
    if (!selectedTarget || typeof window === "undefined") {
      setMessage(lang === "el" ? "Επίλεξε πρώτα διεύθυνση, βλάβη, βάνα, αγωγό ή σημείο στον χάρτη." : "Select an address, fault, valve, pipe or map point first.");
      return;
    }

    const destination = `${selectedTarget.lat.toFixed(6)},${selectedTarget.lng.toFixed(6)}`;
    // Hand off road guidance to the device's mapping service. Pantavion keeps
    // field/asset accuracy separate from consumer road-navigation accuracy.
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function locateMe() {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setMessage(t.locationUnavailable);
      return;
    }

    if (!mapRef.current) {
      setMessage("Ο χάρτης φορτώνει. Πάτησε ξανά «Το σημείο μου» σε ένα δευτερόλεπτο.");
      return;
    }

    setMessage(t.locating);

    let settled = false;

    const acceptPosition = (position: GeolocationPosition) => {
      if (settled) return;
      settled = true;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      void placeCircleMarker({
        lat,
        lng,
        accuracy,
        kind: "user",
        title: t.locate,
      });

      moveMapToPoint(lat, lng);
      setMessage(
        Number.isFinite(accuracy)
          ? `${t.located} Ακρίβεια περίπου ${Math.round(accuracy)} m.`
          : t.located,
      );

      // GPS is an explicit field action: load the protected viewport directly.
      refreshCurrentViewportNow();
    };

    const finalFailure = (error: GeolocationPositionError) => {
      if (settled) return;
      settled = true;

      if (error.code === error.PERMISSION_DENIED) {
        setMessage(
          "Το iPhone δεν έδωσε άδεια τοποθεσίας. Ρυθμίσεις → Απόρρητο και ασφάλεια → Υπηρεσίες τοποθεσίας → Safari Websites → Κατά τη χρήση και ενεργοποίησε Ακριβής τοποθεσία.",
        );
        return;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        setMessage(
          "Το iPhone δεν έδωσε διαθέσιμο στίγμα. Έλεγξε ότι οι Υπηρεσίες τοποθεσίας είναι ενεργές και δοκίμασε ξανά σε ανοικτό χώρο.",
        );
        return;
      }

      setMessage(
        "Το iPhone δεν πρόλαβε να δώσει στίγμα. Πάτησε ξανά «Το σημείο μου».",
      );
    };

    const fallbackToBalancedAccuracy = () => {
      if (settled) return;

      window.navigator.geolocation.getCurrentPosition(
        acceptPosition,
        finalFailure,
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        },
      );
    };

    window.navigator.geolocation.getCurrentPosition(
      acceptPosition,
      (error) => {
        if (settled) return;

        if (error.code === error.PERMISSION_DENIED) {
          finalFailure(error);
          return;
        }

        // iOS/Safari can time out while forcing GPS even though a usable
        // Wi-Fi/cell-assisted position is available. Retry once without the
        // high-accuracy requirement so field crews still get an immediate pin.
        fallbackToBalancedAccuracy();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  function normalizeSearchText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[΄’']/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function greeklishToGreek(value: string) {
    const normalized = normalizeSearchText(value);

    return normalized
      .replace(/\bagiou\b/g, "αγιου")
      .replace(/\bagios\b/g, "αγιος")
      .replace(/\bagia\b/g, "αγια")
      .replace(/\blemesos\b/g, "λεμεσος")
      .replace(/\blimassol\b/g, "λεμεσος")
      .replace(/\bgermasogeia\b/g, "γερμασογεια")
      .replace(/\bypsonas\b/g, "υψωνας")
      .replace(/\bkolossi\b/g, "κολοσσι")
      .replace(/\berimi\b/g, "εριμη")
      .replace(/\bparekklisia\b/g, "παρεκκλησια")
      .replace(/\bpalodia\b/g, "παλοδια")
      .replace(/\bmesa geitonia\b/g, "μεσα γειτονια")
      .replace(/\bagios tychonas\b/g, "αγιος τυχωνας")
      .replace(/\btrachoni\b/g, "τραχωνι")
      .replace(/\bzakaki\b/g, "ζακακι")
      .replace(/\bomonoia\b/g, "ομονοια")
      .replace(/\bmakariou\b/g, "μακαριου")
      .replace(/\bgriva digeni\b/g, "γριβα διγενη")
      .replace(/\banexartisias\b/g, "ανεξαρτησιας")
      .replace(/\barchiepiskopou\b/g, "αρχιεπισκοπου")
      .replace(/\bvasileos\b/g, "βασιλεως")
      .replace(/\bgeorgiou\b/g, "γεωργιου")
      .replace(/\bnikolaou\b/g, "νικολαου")
      .replace(/\bandrea\b/g, "ανδρεα")
      .replace(/\bchristou\b/g, "χριστου");
  }

  function buildSearchParts() {
    return [street, number, area, postal]
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function buildSearchQueries() {
    const parts = buildSearchParts();
    const raw = parts.join(", ");
    const normalized = normalizeSearchText(raw);
    const greeklish = greeklishToGreek(raw);
    const withoutNumber = [street, area, postal]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
    const areaOnly = [area, postal]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

    return Array.from(
      new Set(
        [
          raw,
          `${raw}, Cyprus`,
          `${raw}, Limassol, Cyprus`,
          `${greeklish}, Cyprus`,
          `${greeklish}, εμεσός, ύπρος`,
          `${normalized}, Cyprus`,
          withoutNumber ? `${withoutNumber}, Cyprus` : "",
          areaOnly ? `${areaOnly}, Cyprus` : "",
        ]
          .map((query) => query.replace(/\s+/g, " ").trim())
          .filter((query) => query && query !== "Cyprus"),
      ),
    );
  }

  function readPendingLocalAddressMatches(query: string) {
    if (typeof window === "undefined") return [];

    const key = "pantavion.water.pending.map.additions.v1";
    const pending = JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
    const normalizedQuery = normalizeSearchText(query);

    return pending.filter((item) =>
      normalizeSearchText(item).includes(normalizedQuery),
    );
  }

  async function searchUnifiedPlace() {
    const map = mapRef.current;
    const query = unifiedQuery.trim();
    if (!map || query.length < 2) {
      setMessage(lang === "el" ? "Γράψε τουλάχιστον 2 χαρακτήρες." : "Enter at least 2 characters.");
      return;
    }

    setLoading(true);
    setAddressCandidates([]);
    setMessage(t.loading);
    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/places/search?q=${encodeURIComponent(query)}`,
        { cache: "no-store", signal: AbortSignal.timeout(10000) },
      );
      const payload = await response.json().catch(() => ({})) as {
        results?: Array<{
          resultId: string;
          displayName: string;
          secondaryLabel?: string | null;
          coordinates?: { lat: number; lng: number } | null;
        }>;
      };

      const candidates = (payload.results ?? [])
        .filter((item) => Number.isFinite(item.coordinates?.lat) && Number.isFinite(item.coordinates?.lng))
        .map((item) => ({
          candidateId: item.resultId,
          displayName: item.secondaryLabel
            ? `${item.displayName} — ${item.secondaryLabel}`
            : item.displayName,
          coordinates: item.coordinates as { lat: number; lng: number },
        }));

      if (response.ok && candidates.length === 1) {
        await selectMapPoint({ latlng: candidates[0].coordinates });
        return;
      }
      if (response.ok && candidates.length > 1) {
        setAddressCandidates(candidates);
        setMessage(lang === "el" ? "Επίλεξε το σωστό αποτέλεσμα." : "Select the correct result.");
        return;
      }

      // Until the primary provider is configured, preserve the proven address
      // search path rather than leaving field users with a dead control.
      setStreet(query);
      await searchAddressMarker(query);
    } catch {
      setStreet(query);
      await searchAddressMarker(query);
    } finally {
      setLoading(false);
    }
  }

  async function searchAddressMarker(queryOverride?: string) {
    const map = mapRef.current;
    const override = queryOverride?.trim() || "";
    const queries = override ? [override] : buildSearchQueries();
    if (!map || queries.length === 0) {
      setMessage(t.searchEmpty);
      return;
    }
    setLoading(true);
    setAddressCandidates([]);
    setMessage(t.loading);
    try {
      // Approved field users search the Cyprus official road registry first.
      // queryOverride is used only by the unified-search fallback, so skip this
      // block there to avoid repeating the same provider request.
      if (!override && street.trim()) {
        const officialQuery = [street.trim(), number.trim(), area.trim(), postal.trim()]
          .filter(Boolean)
          .join(", ");
        const officialResponse = await fetch(
          `/api/professional/infrastructure/water/places/search?q=${encodeURIComponent(officialQuery)}`,
          { cache: "no-store", signal: AbortSignal.timeout(10000) },
        );
        const officialPayload = await officialResponse.json().catch(() => ({})) as {
          results?: Array<{
            resultId: string;
            displayName: string;
            secondaryLabel?: string | null;
            coordinates?: { lat: number; lng: number } | null;
          }>;
        };
        const officialCandidates = (officialPayload.results ?? [])
          .filter((item) => Number.isFinite(item.coordinates?.lat) && Number.isFinite(item.coordinates?.lng))
          .map((item) => ({
            candidateId: item.resultId,
            displayName: item.secondaryLabel
              ? `${item.displayName} — ${item.secondaryLabel}`
              : item.displayName,
            coordinates: item.coordinates as { lat: number; lng: number },
          }));

        if (officialResponse.ok && officialCandidates.length === 1) {
          await selectMapPoint({ latlng: officialCandidates[0].coordinates });
          return;
        }
        if (officialResponse.ok && officialCandidates.length > 1) {
          setAddressCandidates(officialCandidates);
          setMessage(
            lang === "el"
              ? "Επίλεξε την οδό από το επίσημο οδικό δίκτυο Κτηματολογίου."
              : "Select the street from the official Cyprus DLS road network.",
          );
          return;
        }
      }

      const params = override
        ? new URLSearchParams({ street: override, houseNumber: "", area: "", postalCode: "" })
        : new URLSearchParams({ street, houseNumber: number, area, postalCode: postal });
      const response = await fetch(
        `/api/professional/infrastructure/water/address/search?${params.toString()}`,
        { cache: "no-store", signal: AbortSignal.timeout(20000) },
      );
      if (!response.ok) throw new Error("address_search_failed");
      const result = await response.json();
      if (mapRef.current !== map) return;
      const candidates = (result.candidates || []).filter(
        (item: { coordinates?: { lat?: number; lng?: number } }) =>
          Number.isFinite(item.coordinates?.lat) && Number.isFinite(item.coordinates?.lng),
      );
      if (candidates.length === 1) {
        await selectMapPoint({ latlng: candidates[0].coordinates });
        return;
      }
      if (candidates.length > 1) {
        setAddressCandidates(candidates);
        setMessage(lang === "el" ? "Επίλεξε τη σωστή διεύθυνση από τα αποτελέσματα." : "Select the correct address from the results.");
        return;
      }
      const pendingMatches = readPendingLocalAddressMatches(queries[0] || "");
      setMessage(pendingMatches.length > 0
        ? `Προσωρινή καταχώρηση χωρίς εγκεκριμένες συντεταγμένες: ${pendingMatches[0]}`
        : t.searchNotFound);
    } catch {
      setMessage(lang === "el" ? "Η αναζήτηση δεν ολοκληρώθηκε. Δοκίμασε ξανά ή επίλεξε σημείο στον χάρτη." : "Search could not complete. Try again or select a point on the map.");
    } finally {
      setLoading(false);
    }
  }

  async function openApprovedFieldArtifact(reference: string) {
    const requestId = fieldArtifactRequestId(reference);
    if (!requestId) {
      setMessage("Το evidence reference δεν είναι έγκυρο field artifact.");
      return;
    }

    const device = getOrCreateWaterAccessDevice();

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/field/evidence-upload/${encodeURIComponent(
          requestId,
        )}`,
        {
          cache: "no-store",
          credentials: "include",
          signal: AbortSignal.timeout(8000),
          headers: {
            "x-pantavion-water-device-id": device.deviceId,
            "x-pantavion-water-device-token": device.deviceToken,
          },
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        signedUrl?: string;
      };

      if (!response.ok || !payload.ok || !payload.signedUrl) {
        throw new Error(payload.error || "water_field_artifact_access_failed");
      }

      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Δεν άνοιξε το private evidence. Δοκίμασε ξανά από εγκεκριμένη συσκευή.");
    }
  }

  function buildApprovedOverlayPopup(options: {
    title: string;
    subtitle?: string | null;
    detail?: string | null;
    artifactRefs?: string[] | null;
  }) {
    const container = document.createElement("div");
    container.style.minWidth = "220px";

    const heading = document.createElement("strong");
    heading.textContent = options.title;
    container.appendChild(heading);

    if (options.subtitle) {
      const subtitle = document.createElement("div");
      subtitle.textContent = options.subtitle;
      subtitle.style.marginTop = "6px";
      container.appendChild(subtitle);
    }

    if (options.detail) {
      const detail = document.createElement("div");
      detail.textContent = options.detail;
      detail.style.marginTop = "6px";
      container.appendChild(detail);
    }

    for (const reference of options.artifactRefs || []) {
      if (!fieldArtifactRequestId(reference)) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Άνοιγμα private evidence";
      button.style.display = "block";
      button.style.marginTop = "10px";
      button.style.fontWeight = "700";
      button.addEventListener("click", () => {
        void openApprovedFieldArtifact(reference);
      });
      container.appendChild(button);
    }

    return container;
  }

  async function loadApprovedMapAChanges() {
    const map = mapRef.current;

    if (!map || !accessApproved) return;

    const bbox = bboxFromMap(map);
    const device = getOrCreateWaterAccessDevice();
    const params = new URLSearchParams({
      mapId: "A",
      minX: String(bbox.minLng),
      minY: String(bbox.minLat),
      maxX: String(bbox.maxLng),
      maxY: String(bbox.maxLat),
      limit: "300",
    });

    try {
      const [patchResponse, pinResponse] = await Promise.all([
        fetch(
          `/api/professional/infrastructure/water/changes/patches?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: AbortSignal.timeout(8000),
            headers: {
              "x-pantavion-water-device-id": device.deviceId,
              "x-pantavion-water-device-token": device.deviceToken,
            },
          },
        ),
        fetch(
          `/api/professional/infrastructure/water/changes/evidence-pins?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: AbortSignal.timeout(8000),
            headers: {
              "x-pantavion-water-device-id": device.deviceId,
              "x-pantavion-water-device-token": device.deviceToken,
            },
          },
        ),
      ]);

      if (
        patchResponse.status === 401 ||
        patchResponse.status === 403 ||
        pinResponse.status === 401 ||
        pinResponse.status === 403
      ) {
        clearLegacyWaterDeviceApproval();
        setAccessState("denied");
        return;
      }

      const patchPayload =
        (await patchResponse.json().catch(() => ({}))) as ApprovedPatchResponse;
      const pinPayload =
        (await pinResponse.json().catch(() => ({}))) as ApprovedPinResponse;

      if (!patchResponse.ok || !patchPayload.ok) {
        throw new Error(patchPayload.error || "water_approved_patch_load_failed");
      }

      if (!pinResponse.ok || !pinPayload.ok) {
        throw new Error(pinPayload.error || "water_approved_pin_load_failed");
      }

      const approvedPatchStatuses = new Set([
        "approved_overlay",
        "officialization_candidate",
        "officialized",
      ]);

      const patches = (patchPayload.patches || []).filter(
        (patch) =>
          patch.map_id === "A" &&
          approvedPatchStatuses.has(patch.status) &&
          patch.crs_authority === "EPSG" &&
          patch.crs_code === "4326",
      );

      const pins = (pinPayload.pins || []).filter(
        (pin) =>
          pin.map_id === "A" &&
          pin.review_state === "approved" &&
          pin.crs_authority === "EPSG" &&
          pin.crs_code === "4326" &&
          Number.isFinite(pin.x) &&
          Number.isFinite(pin.y),
      );

      const L = await ensureLeaflet();
      const nextLayer = L.layerGroup();

      for (const patch of patches) {
        let layer = null;

        if (patch.geometry_type === "Point") {
          const point = coordinatePair(patch.geometry.coordinates);
          if (!point) continue;
          const [lng, lat] = point;
          layer = L.circleMarker([lat, lng], {
            radius: 8,
            color: "#065f46",
            weight: 2,
            fillColor: "#34d399",
            fillOpacity: 0.9,
          });
        } else if (patch.geometry_type === "LineString") {
          const coordinates = lineCoordinates(patch.geometry.coordinates);
          if (coordinates.length < 2) continue;
          layer = L.polyline(
            coordinates.map(([lng, lat]) => [lat, lng]),
            {
              color: "#10b981",
              weight: 5,
              opacity: 0.95,
              dashArray: "8 5",
            },
          );
        } else if (patch.geometry_type === "Polygon") {
          const rings = polygonCoordinates(patch.geometry.coordinates);
          if (!rings.length) continue;
          layer = L.polygon(
            rings.map((ring) =>
              ring.map(([lng, lat]) => [lat, lng]),
            ),
            {
              color: "#059669",
              weight: 3,
              fillColor: "#6ee7b7",
              fillOpacity: 0.18,
            },
          );
        }

        if (!layer) continue;

        layer.bindPopup(
          buildApprovedOverlayPopup({
            title: `Approved ${patch.asset_type}`,
            subtitle: patch.street_name || patch.status,
            detail: `${patch.operation} · ${patch.status}`,
            artifactRefs: patch.artifact_refs,
          }),
        );
        layer.addTo(nextLayer);
      }

      for (const pin of pins) {
        const marker = L.circleMarker([pin.y, pin.x], {
          radius: 7,
          color: "#7c3aed",
          weight: 2,
          fillColor: "#c4b5fd",
          fillOpacity: 0.95,
        });

        marker.bindPopup(
          buildApprovedOverlayPopup({
            title: "Approved field evidence",
            subtitle: pin.street_name || "Map A evidence pin",
            detail: pin.note || null,
            artifactRefs: pin.artifact_refs,
          }),
        );
        marker.addTo(nextLayer);
      }

      if (approvedOverlayRef.current) {
        approvedOverlayRef.current.remove();
      }

      nextLayer.addTo(map);
      approvedOverlayRef.current = nextLayer;
      setApprovedChangeCount(patches.length);
      setApprovedEvidenceCount(pins.length);
    } catch {
      // Keep the last successfully rendered approved overlay on transient failure.
    }
  }

  async function refreshVisibleWaterMap() {
    await loadPipes();
    await loadApprovedMapAChanges();
  }

  refreshVisibleWaterMapRef.current = refreshVisibleWaterMap;

  async function loadPipes() {
    const map = mapRef.current;

    if (!map) return;

    if (loadInProgressRef.current) {
      reloadQueuedRef.current = true;
      return;
    }

    if (!accessApproved) {
      setMessage(
        "Ο χάρτης δρόμων, η αναζήτηση και το στίγμα είναι διαθέσιμα άμεσα. Τα προστατευμένα δεδομένα αγωγών εμφανίζονται μόνο σε εγκεκριμένες συσκευές.",
      );
      return;
    }

    const controller = new AbortController();
    networkLoadAbortRef.current = controller;
    let timedOut = false;
    const loadTimeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);
    loadInProgressRef.current = true;
    setLoading(true);
    setMessage(t.loading);

    try {
      const tiles = visibleNetworkXyzTiles(map);
      const device = getOrCreateWaterAccessDevice();
      let segmentRequestCount = 0;
      let accessRevoked = false;

      async function fetchExactVisibleTile(tile: Bbox, depth: number): Promise<any[]> {
        controller.signal.throwIfAborted();
        segmentRequestCount += 1;

        if (segmentRequestCount > MAX_SEGMENT_REQUESTS) {
          throw new Error("WATER_SEGMENT_REQUEST_LIMIT");
        }

        const params = new URLSearchParams({
          ...bboxParams(tile),
          maxFeatures: String(MAX_FEATURES_PER_TILE),
          street,
          houseNumber: number,
          area,
          postalCode: postal,
        });

        const response = await fetch(
          `/api/professional/infrastructure/water/mapserver/0/query?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
            headers: {
              "x-pantavion-water-device-id": device.deviceId,
              "x-pantavion-water-device-token": device.deviceToken,
            },
          },
        );

        const json = (await response.json()) as SegmentResponse;
        controller.signal.throwIfAborted();

        if (
          response.status === 401 ||
          response.status === 403 ||
          json.error === "access_not_approved"
        ) {
          clearLegacyWaterDeviceApproval();
          setAccessMessage("");
          setAccessState("denied");
          accessRevoked = true;
          return [];
        }

        if (
          !response.ok ||
          json.completeNetworkReturned === true ||
          json.rawMasterReturned === true ||
          json.browserFullNetworkLoaded === true
        ) {
          throw new Error(
            json.diagnosticCode ||
              json.error ||
              json.reason ||
              "WATER_SEGMENT_RESPONSE",
          );
        }

        const features = json.segment?.features || [];

        if (
          json.segmentTruncated !== true &&
          typeof json.segmentCount === "number" &&
          Number.isFinite(json.segmentCount) &&
          json.segmentCount !== features.length
        ) {
          throw new Error("WATER_SEGMENT_COUNT_MISMATCH");
        }

        if (json.segmentTruncated === true) {
          const lngSpan = tile.maxLng - tile.minLng;
          const latSpan = tile.maxLat - tile.minLat;

          if (
            depth >= MAX_RECURSIVE_TILE_DEPTH ||
            lngSpan <= MIN_RECURSIVE_TILE_SPAN_DEGREES ||
            latSpan <= MIN_RECURSIVE_TILE_SPAN_DEGREES
          ) {
            throw new Error("WATER_SEGMENT_TRUNCATED");
          }

          const childFeatures: any[] = [];

          for (const childTile of splitBboxIntoQuadrants(tile)) {
            childFeatures.push(...(await fetchExactVisibleTile(childTile, depth + 1)));

            if (accessRevoked) return [];
          }

          return childFeatures;
        }

        return features;
      }

      const L = await ensureLeaflet();
      const visibleKeys = new Set(tiles.map((tile) => tile.key));
      let visibleFeatureCount = 0;

      async function loadTile(tile: NetworkXyzTile) {
        controller.signal.throwIfAborted();
        const cached = networkTileCacheRef.current.get(tile.key);

        if (cached) {
          cached.lastUsedAt = Date.now();
          if (!map.hasLayer(cached.layer)) cached.layer.addTo(map);
          cached.layer.bringToFront?.();
          visibleFeatureCount += cached.featureCount;
          return;
        }

        const rawFeatures = await fetchExactVisibleTile(tile.bbox, 0);
        if (accessRevoked) return;
        controller.signal.throwIfAborted();

        const deduped = new Map<string, any>();
        rawFeatures.forEach((feature, index) => {
          deduped.set(
            featureKey(feature, `${tile.key}-fallback-${index}`),
            feature,
          );
        });
        const features = Array.from(deduped.values());

        const layer = L.geoJSON(
          {
            type: "FeatureCollection",
            features,
          },
          {
            pane: "pantavion-water-network",
            style: (feature: any) => getPipeStyle(feature),
            pointToLayer: (feature: any, latlng: any) => {
              const style = getPipeStyle(feature);

              return L.circleMarker(latlng, {
                radius: Math.max(2, Math.min(5, style.weight * 1.25)),
                color: style.color,
                fillColor: style.color,
                fillOpacity: style.opacity,
                opacity: style.opacity,
                weight: style.weight,
              });
            },
          },
        );

        layer.addTo(map);
        layer.bringToFront?.();
        networkTileCacheRef.current.set(tile.key, {
          layer,
          featureCount: features.length,
          lastUsedAt: Date.now(),
        });
        visibleFeatureCount += features.length;
      }


      // Keep mobile/server load bounded while avoiding one round trip per tile.
      let nextTile = 0;
      async function loadTileWorker() {
        while (nextTile < tiles.length && !accessRevoked) {
          controller.signal.throwIfAborted();
          const tile = tiles[nextTile++];
          await loadTile(tile);
        }
      }
      const results = await Promise.allSettled(
        Array.from({ length: Math.min(3, tiles.length) }, () => loadTileWorker()),
      );
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      if (accessRevoked) return;
      controller.signal.throwIfAborted();

      for (const [key, cached] of networkTileCacheRef.current.entries()) {
        if (!visibleKeys.has(key) && map.hasLayer(cached.layer)) {
          map.removeLayer(cached.layer);
        }
      }

      if (networkTileCacheRef.current.size > MAX_NETWORK_TILE_CACHE) {
        const removable = Array.from(networkTileCacheRef.current.entries())
          .filter(([key]) => !visibleKeys.has(key))
          .sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);

        while (
          networkTileCacheRef.current.size > MAX_NETWORK_TILE_CACHE &&
          removable.length > 0
        ) {
          const [key, cached] = removable.shift()!;
          if (map.hasLayer(cached.layer)) map.removeLayer(cached.layer);
          networkTileCacheRef.current.delete(key);
        }
      }

      if (visibleFeatureCount <= 0) {
        throw new Error("WATER_NO_VISIBLE_FEATURES");
      }

      setPipeCount(visibleFeatureCount);
      setMessage(
        `${t.loaded}: ${visibleFeatureCount} · ${tiles.length} cached GIS tiles · ${segmentRequestCount} νέα requests`,
      );
    } catch (error) {
      // A pan/zoom cancellation is superseded by the next viewport request.
      if (controller.signal.aborted && !timedOut) return;
      setPipeCount(null);

      if (error instanceof Error && error.message === "VISIBLE_AREA_TOO_LARGE") {
        setMessage(t.visibleTooLarge);
      } else {
        const diagnosticCode =
          timedOut ? "WATER_LOAD_TIMEOUT" :
          error instanceof Error && /^WATER_[A-Z0-9_]+$/.test(error.message)
            ? error.message
            : "WATER_CLIENT_LOAD";

        setMessage(`${t.failed} ${t.diagnostic}: ${diagnosticCode}.`);
      }
    } finally {
      window.clearTimeout(loadTimeout);
      if (networkLoadAbortRef.current === controller) {
        networkLoadAbortRef.current = null;
      }
      loadInProgressRef.current = false;
      setLoading(false);

      if (reloadQueuedRef.current) {
        reloadQueuedRef.current = false;
        window.setTimeout(() => {
          void refreshVisibleWaterMap();
        }, 0);
      }
    }
  }

  useEffect(() => {
    const map = mapRef.current;

    if (!accessApproved || !mapReady || !map) return;

    function clearAutoLoadTimer() {
      if (autoLoadTimerRef.current) {
        window.clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
    }

    function scheduleAutoLoad() {
      clearAutoLoadTimer();
      // Do not make the current viewport wait for obsolete network requests.
      reloadQueuedRef.current = false;
      networkLoadAbortRef.current?.abort();

      autoLoadTimerRef.current = window.setTimeout(() => {
        void refreshVisibleWaterMapRef.current();
      }, 250);
    }

    // Load the first authentic Map A segment immediately once the approved
    // device and Leaflet map are both ready. Pan/zoom refreshes stay debounced.
    void refreshVisibleWaterMapRef.current();
    scheduleViewportReloadRef.current = scheduleAutoLoad;
    map.on("moveend zoomend", scheduleAutoLoad);

    return () => {
      clearAutoLoadTimer();
      reloadQueuedRef.current = false;
      networkLoadAbortRef.current?.abort();
      if (scheduleViewportReloadRef.current === scheduleAutoLoad) {
        scheduleViewportReloadRef.current = null;
      }
      map.off("moveend zoomend", scheduleAutoLoad);
    };
  }, [accessApproved, mapReady, lang, street, number, area, postal]);

  if (!accessApproved) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-sky-400/30 bg-[#0d1a2d] p-4 shadow-2xl sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
              ΑΜΕΣΟΣ ΧΑΡΤΗΣ ΠΕΔΙΟΥ
            </p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Δρόμοι, αναζήτηση και στίγμα χωρίς αναμονή
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Ο βασικός χάρτης ανοίγει αμέσως για όλους. Οι αγωγοί και τα λοιπά
              προστατευμένα δεδομένα δικτύου παραμένουν κλειδωμένα μέχρι την έγκριση.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={unifiedQuery}
            onChange={(event) => setUnifiedQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void searchUnifiedPlace();
            }}
            placeholder={lang === "el" ? "Οδός, αριθμός, ξενοδοχείο, επιχείρηση ή τοπωνύμιο" : "Street, number, hotel, business or place"}
            className="min-w-0 flex-1 rounded-2xl border border-sky-400/50 bg-[#07111f] px-4 py-3 text-white outline-none"
          />
          <button
            type="button"
            onClick={() => void searchUnifiedPlace()}
            disabled={loading}
            className="rounded-2xl border border-sky-400/60 bg-sky-400/15 px-4 py-3 text-sm font-black text-sky-100 disabled:opacity-60"
          >
            {lang === "el" ? "Βρες" : "Find"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input value={street} onChange={(event) => setStreet(event.target.value)} placeholder={t.street} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
          <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder={t.number} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
          <input value={area} onChange={(event) => setArea(event.target.value)} placeholder={t.area} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
          <input value={postal} onChange={(event) => setPostal(event.target.value)} placeholder={t.postal} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void locateMe()} disabled={loading} className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-3 text-sm font-black text-[#f8e6ad] disabled:opacity-60">
            {t.locate}
          </button>
          <button type="button" onClick={() => void searchAddressMarker()} disabled={loading} className="rounded-2xl border border-sky-400/60 bg-sky-400/15 px-5 py-3 text-sm font-black text-sky-100 disabled:opacity-60">
            {t.search}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-sm text-slate-200">
          {message}
        </div>
          {addressCandidates.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {addressCandidates.map((candidate) => (
                <button key={candidate.candidateId} type="button"
                  onClick={() => {
                    setAddressCandidates([]);
                    void selectMapPoint({ latlng: candidate.coordinates });
                  }}
                  className="rounded-xl border border-sky-400/40 px-4 py-3 text-left text-sm text-sky-100">
                  {candidate.displayName}
                </button>
              ))}
            </div>
          ) : null}


        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-700 bg-[#0d1a2d]">
          <div className="border-b border-slate-700 px-4 py-3 text-sm font-black text-[#f2c766]">
            Δημόσιος επιχειρησιακός χάρτης — χωρίς στοιχεία αγωγών
          </div>
          <div ref={mapEl} className="h-[58vh] min-h-[360px] w-full bg-slate-200 sm:min-h-[480px]" />
        </div>
      </section>
        <section className="mx-auto flex w-full max-w-5xl items-center">
          <div className="w-full rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex justify-end">
              <label className="flex min-w-[180px] flex-col gap-2 text-sm font-bold text-[#f2c766]">
                {t.language}
                <select
                  value={lang}
                  onChange={(event) => setLang(event.target.value as Lang)}
                  className="rounded-2xl border border-[#b89445]/60 bg-[#07111f] px-4 py-3 text-white outline-none"
                >
                  {PANTAVION_LANGUAGE_CATALOG.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
              PANTAVION PROTECTED INFRASTRUCTURE
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{t.accessTitle}</h1>
            <p className="mt-4 text-base leading-8 text-slate-200">{t.accessText}</p>
            <p className="mt-3 text-sm font-bold text-[#f2c766]">{t.protected}</p>

            <div
              className={`mt-6 rounded-2xl border px-4 py-4 text-sm font-black leading-6 ${
                accessState === "error"
                  ? "border-amber-400/40 bg-amber-950/30 text-amber-100"
                  : "border-[#f2c766]/40 bg-[#f2c766]/10 text-[#f8e6ad]"
              }`}
            >
              {accessState === "checking"
                ? t.accessChecking
                : accessState === "error"
                  ? t.accessCheckFailed
                  : t.accessRequired}
            </div>

            {accessState !== "checking" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {accessState === "denied" ? (
                  <a
                    href="/auth/login?next=%2Fprofessional%2Finfrastructure%2Fwater%2Flive"
                    className="flex w-full items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-400/15 px-5 py-4 text-center text-base font-black text-emerald-100"
                  >
                    {t.adminLogin}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setAccessCheckVersion((value) => value + 1)}
                  className="w-full rounded-2xl border border-sky-400/60 bg-sky-400/15 px-5 py-4 text-base font-black text-sky-100"
                >
                  {t.retryAccess}
                </button>
              </div>
            ) : null}

            {accessState === "denied" ? (
              <div className="mt-6">
                <section className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
                  <h2 className="text-xl font-black text-[#f2c766]">{t.requestAccess}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{t.requestText}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder={t.firstName} className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                    <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={t.lastName} className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                    <input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder={t.roleTitle} className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                    <input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={t.organization} className="hidden rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                    <input value={emailOrPhone} onChange={(event) => setEmailOrPhone(event.target.value)} placeholder={t.emailOrPhone} className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none sm:col-span-2" />
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t.reason} className="hidden min-h-[110px] rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none sm:col-span-2" />
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitAccessRequest()}
                    disabled={loading}
                    className="mt-4 w-full rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-4 text-base font-black text-[#f8e6ad] disabled:opacity-60"
                  >
                    {t.submitRequest}
                  </button>
                </section>
              </div>
            ) : null}

            {accessMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-sm text-slate-100">
                {accessMessage}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
        <header className="rounded-3xl border border-[#b89445]/40 bg-[#0d1a2d] p-4 shadow-2xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f2c766] sm:tracking-[0.34em]">
                PANTAVION PROFESSIONAL INFRASTRUCTURE
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
                {t.subtitle}
              </p>
              <p className="mt-2 text-sm font-bold text-[#f2c766]">{t.protected}</p>
            </div>

            <label className="flex min-w-[180px] flex-col gap-2 text-sm font-bold text-[#f2c766]">
              {t.language}
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value as Lang)}
                className="rounded-2xl border border-[#b89445]/60 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {PANTAVION_LANGUAGE_CATALOG.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-700 bg-[#0d1a2d] p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input value={street} onChange={(event) => setStreet(event.target.value)} placeholder={t.street} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
            <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder={t.number} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
            <input value={area} onChange={(event) => setArea(event.target.value)} placeholder={t.area} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
            <input value={postal} onChange={(event) => setPostal(event.target.value)} placeholder={t.postal} className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <button type="button" onClick={() => void locateMe()} disabled={loading} className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-3 text-sm font-black text-[#f8e6ad] disabled:opacity-60">
              {t.locate}
            </button>

            <button type="button" onClick={() => void searchAddressMarker()} disabled={loading} className="rounded-2xl border border-sky-400/60 bg-sky-400/15 px-5 py-3 text-sm font-black text-sky-100 disabled:opacity-60">
              {t.search}
            </button>

            <button type="button" onClick={navigateToSelectedTarget} disabled={!selectedTarget} className="rounded-2xl border border-violet-400/60 bg-violet-400/15 px-5 py-3 text-sm font-black text-violet-100 disabled:opacity-40">
              {lang === "el" ? "Πήγαινέ με" : "Navigate"}
            </button>

            <button type="button" onClick={refreshCurrentViewportNow} disabled={loading} className="rounded-2xl border border-emerald-500/60 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-100 disabled:opacity-60">
              {loading ? t.loading : lang === "el" ? "Φόρτωση δικτύου" : "Load network"}
            </button>

            <button type="button" onClick={() => setWorkPanelOpen((value) => !value)} className="rounded-2xl border border-amber-400/60 bg-amber-400/15 px-5 py-3 text-sm font-black text-amber-100">
              {lang === "el" ? "Εργασία" : "Work"}
            </button>
          </div>

          {workPanelOpen ? (
            <div className="mt-4 rounded-2xl border border-amber-400/40 bg-[#07111f] p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} placeholder={lang === "el" ? "Αρ. εργασίας / βλάβης" : "Work / fault reference"} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <select value={workStage} onChange={(e) => setWorkStage(e.target.value)} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white">
                  <option value="FAULT">Βλάβη</option><option value="LOCATE">Εντοπισμός</option><option value="SITE_SAFETY">Ασφάλεια</option><option value="EXCAVATION">Εκσκαφή</option><option value="NETWORK_REPAIR">Επισκευή</option><option value="TEST">Δοκιμή</option><option value="BACKFILL">Επίχωση</option><option value="SURFACE_RESTORATION">Αποκατάσταση</option><option value="CLOSURE">Κλείσιμο</option>
                </select>
                <input inputMode="decimal" value={excavationLength} onChange={(e) => setExcavationLength(e.target.value)} placeholder="Μήκος εκσκαφής m" className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <input inputMode="decimal" value={excavationWidth} onChange={(e) => setExcavationWidth(e.target.value)} placeholder="Πλάτος m" className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <input inputMode="decimal" value={excavationDepth} onChange={(e) => setExcavationDepth(e.target.value)} placeholder="Βάθος m" className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <div className="rounded-xl border border-slate-700 px-3 py-3 text-sm text-slate-200">
                  Όγκος: {(() => { const l=Number(excavationLength),w=Number(excavationWidth),d=Number(excavationDepth); return [l,w,d].every(Number.isFinite) && l>=0 && w>=0 && d>=0 ? (l*w*d).toFixed(3) : "—"; })()} m³
                </div>
                <select value={workMaterial} onChange={(e) => setWorkMaterial(e.target.value)} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white">
                  <option value="">{lang === "el" ? "Επίλεξε υλικό / εξάρτημα" : "Select material / fitting"}</option>
                  {WATER_MATERIAL_SAMPLE_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>{item.serviceLabel}</option>
                  ))}
                  <option value="OTHER">{lang === "el" ? "Άλλο — για έλεγχο/προσθήκη" : "Other — review/add"}</option>
                </select>
                <input inputMode="decimal" value={workMaterialQty} onChange={(e) => setWorkMaterialQty(e.target.value)} placeholder={lang === "el" ? "Ποσότητα" : "Quantity"} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <input inputMode="decimal" value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder={lang === "el" ? "Εργατοώρες" : "Labour hours"} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <input value={workEvidence} onChange={(e) => setWorkEvidence(e.target.value)} placeholder={lang === "el" ? "Photo / evidence reference" : "Photo / evidence reference"} className="rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white" />
                <textarea value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} placeholder={lang === "el" ? "Σημειώσεις / τι έγινε στο πεδίο" : "Field notes"} className="min-h-[90px] rounded-xl border border-slate-600 bg-[#0d1a2d] px-3 py-3 text-white sm:col-span-2" />
              </div>
              <p className="mt-3 text-xs text-amber-100">Draft πεδίου — δεν αλλάζει το επίσημο δίκτυο χωρίς review/approval.</p>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-sm text-slate-200">
            {message}
            <div className="mt-2 font-black text-emerald-200">
              {pipeCount === null
                ? (loading
                    ? (lang === "el" ? "Δίκτυο A: φόρτωση..." : "Network A: loading...")
                    : (lang === "el" ? "Δίκτυο A: αναμονή φόρτωσης" : "Network A: waiting to load"))
                : (lang === "el"
                    ? `Δίκτυο A ενεργό: ${pipeCount} στοιχεία στην ορατή περιοχή`
                    : `Network A active: ${pipeCount} visible features`)}
            </div>
          </div>
          {addressCandidates.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {addressCandidates.map((candidate) => (
                <button key={candidate.candidateId} type="button"
                  onClick={() => {
                    setAddressCandidates([]);
                    void selectMapPoint({ latlng: candidate.coordinates });
                  }}
                  className="rounded-xl border border-sky-400/40 px-4 py-3 text-left text-sm text-sky-100">
                  {candidate.displayName}
                </button>
              ))}
            </div>
          ) : null}

        </section>


        <section className="overflow-hidden rounded-3xl border border-slate-700 bg-[#0d1a2d]">
          <div className="flex flex-col gap-1 border-b border-slate-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <h2 className="text-xl font-black text-[#f2c766] sm:text-2xl">{t.map}</h2>
            <span className="text-sm text-slate-300">
              {pipeCount !== null ? `${t.loaded}: ${pipeCount}` : t.protected}
              {basemapState === "pantavion"
                ? ` · ${lang === "el" ? "Υπόβαθρο: λεπτομερής οδικός χάρτης" : "Basemap: detailed street map"}`
                : basemapState === "fallback"
                  ? ` · ${lang === "el" ? "Υπόβαθρο: ασφαλές προσωρινό οδικό" : "Basemap: safe temporary road map"}`
                  : ` · ${lang === "el" ? "Υπόβαθρο: φόρτωση λεπτομερούς οδικού χάρτη" : "Basemap: loading detailed street map"}`}
              {approvedChangeCount > 0 || approvedEvidenceCount > 0
                ? ` · approved changes ${approvedChangeCount} · evidence ${approvedEvidenceCount}`
                : ""}
            </span>
          </div>

          <div ref={mapEl} className="h-[70vh] min-h-[420px] w-full bg-slate-200 sm:min-h-[560px]" />
        </section>
      </section>
    </main>
  );
}
