"use client";

import { useEffect, useRef, useState } from "react";
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

type SegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: any[];
  };
  segmentCount?: number;
  pipeSegmentCount?: number;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
};

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

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
    failed: "Δεν φορτώθηκαν αγωγοί. Κάνε λίγο zoom ή μετακίνησε τον χάρτη.",
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
    failed: "No pipes loaded. Zoom in or move the map.",
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
    locate: "My location",
    search: "Search / Marker",
    locating: "Locating...",
    located: "Your location was found. Loading local network.",
    locationUnavailable: "Location was not available. You can pan the map or search.",
    searchEmpty: "Enter street, area or postal code.",
    searchNotFound: "No matching point found. Try a fuller address.",
    searchFound: "Search marker found. Loading local network.",
    visibleTooLarge: "The visible area is large. Zoom in a little.",
    chunks: "screen chunks",
  },
};

const VIEWPORT_TILE_SPAN_DEGREES = 0.055;
const MAX_VIEWPORT_TILES = 16;
const MAX_FEATURES_PER_TILE = 1200;

const PANTAVION_WATER_DEVICE_APPROVAL_KEY = "pantavion:water:approved-until:v4";
const PANTAVION_WATER_DEVICE_APPROVAL_DAYS = 365;

function readWaterDeviceApproval() {
  if (typeof window === "undefined") return false;

  const raw = window.localStorage.getItem(PANTAVION_WATER_DEVICE_APPROVAL_KEY);
  if (!raw) return false;

  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    window.localStorage.removeItem(PANTAVION_WATER_DEVICE_APPROVAL_KEY);
    return false;
  }

  return true;
}

function writeWaterDeviceApproval() {
  if (typeof window === "undefined") return;

  const expiresAt =
    Date.now() + PANTAVION_WATER_DEVICE_APPROVAL_DAYS * 24 * 60 * 60 * 1000;

  window.localStorage.setItem(
    PANTAVION_WATER_DEVICE_APPROVAL_KEY,
    String(expiresAt),
  );
}


const PANTAVION_WATER_DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const PANTAVION_WATER_DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";
const PANTAVION_WATER_FOUNDER_CODE_STORAGE_KEY = "pantavion.water.admin.founderCode.v1";

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

  let deviceId = window.localStorage.getItem(PANTAVION_WATER_DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(PANTAVION_WATER_DEVICE_TOKEN_KEY) || "";

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

function getSavedWaterFounderCode() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(PANTAVION_WATER_FOUNDER_CODE_STORAGE_KEY) || "";
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "el";

  const saved = window.localStorage.getItem("pantavion-language");

  return getSupportedPantavionLanguage(saved)?.code ?? "el";
}

function ensureLeaflet() {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window unavailable"));
      return;
    }

    if (window.L) {
      resolve(window.L);
      return;
    }

    if (!document.querySelector("link[data-leaflet-css]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet-css", "true");
      document.head.appendChild(css);
    }

    const existing = document.querySelector("script[data-leaflet-js]");

    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.setAttribute("data-leaflet-js", "true");
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function getPipeStyle(feature: any) {
  const raw = feature?.properties?.kmlLineStyle;

  if (!raw || typeof raw !== "object") {
    return { color: "#202020", weight: 2, opacity: 1 };
  }

  const style = raw as {
    color?: unknown;
    weight?: unknown;
    width?: unknown;
    opacity?: unknown;
  };

  const weight =
    typeof style.weight === "number"
      ? style.weight
      : typeof style.width === "number"
        ? style.width
        : 2;

  return {
    color: typeof style.color === "string" ? style.color : "#202020",
    weight: Math.max(1, Math.min(10, weight)),
    opacity:
      typeof style.opacity === "number"
        ? Math.max(0.05, Math.min(1, style.opacity))
        : 1,
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

function splitVisibleBboxIntoSafeTiles(bbox: Bbox) {
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;

  const lngSteps = Math.max(1, Math.ceil(lngSpan / VIEWPORT_TILE_SPAN_DEGREES));
  const latSteps = Math.max(1, Math.ceil(latSpan / VIEWPORT_TILE_SPAN_DEGREES));

  if (lngSteps * latSteps > MAX_VIEWPORT_TILES) {
    throw new Error("VISIBLE_AREA_TOO_LARGE");
  }

  const tiles: Bbox[] = [];

  for (let y = 0; y < latSteps; y += 1) {
    for (let x = 0; x < lngSteps; x += 1) {
      const minLng = bbox.minLng + (lngSpan * x) / lngSteps;
      const maxLng = bbox.minLng + (lngSpan * (x + 1)) / lngSteps;
      const minLat = bbox.minLat + (latSpan * y) / latSteps;
      const maxLat = bbox.minLat + (latSpan * (y + 1)) / latSteps;

      tiles.push({ minLng, minLat, maxLng, maxLat });
    }
  }

  return tiles;
}

function featureKey(feature: any, fallback: string) {
  const id =
    feature?.id ??
    feature?.properties?.placemarkIndex ??
    feature?.properties?.featureIndex ??
    feature?.properties?.name;

  return id === undefined || id === null ? fallback : String(id);
}

export default function ControlledWaterSegmentClient() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [accessApproved, setAccessApproved] = useState(() => readWaterDeviceApproval());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [reason, setReason] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [area, setArea] = useState("Λεμεσός");
  const [postal, setPostal] = useState("");
  const [message, setMessage] = useState(UI.el.ready);
  const [accessMessage, setAccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipeCount, setPipeCount] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const autoLoadTimerRef = useRef<number | null>(null);
  const loadInProgressRef = useRef(false);

  const t = UI[getPantavionUiLanguage(lang)];

  useEffect(() => {
    if (accessApproved) return;

    let cancelled = false;

    async function checkApprovedDevice() {
      const device = getOrCreateWaterAccessDevice();

      try {
        const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            code: getSavedWaterFounderCode(),
            deviceId: device.deviceId,
            deviceToken: device.deviceToken,
          }),
        });

        const json = (await response.json()) as { ok?: boolean };

        if (!cancelled && response.ok && json.ok) {
          setAccessApproved(true);
          writeWaterDeviceApproval();
          setAccessMessage(t.accessApproved);
        }
      } catch {
        // auto-approved-device-check: stay on protected screen.
      }
    }

    void checkApprovedDevice();

    return () => {
      cancelled = true;
    };
  }, [accessApproved, t.accessApproved]);

  useEffect(() => {
    window.localStorage.setItem("pantavion-language", lang);
    document.documentElement.lang = lang;
    const uiLang = getPantavionUiLanguage(lang);
    setMessage(pipeCount === null ? UI[uiLang].ready : `${UI[uiLang].loaded}: ${pipeCount}`);
  }, [lang, pipeCount]);

  useEffect(() => {
    if (!accessApproved) return;

    let cancelled = false;

    ensureLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = L.map(mapEl.current, {
          center: [34.681, 33.038],
          zoom: 15,
          zoomControl: true,
          preferCanvas: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
        window.setTimeout(() => map.invalidateSize(), 300);
        window.setTimeout(() => map.invalidateSize(), 900);
      })
      .catch(() => setMessage(UI[getPantavionUiLanguage(lang)].failed));

    return () => {
      cancelled = true;
      setMapReady(false);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accessApproved, lang]);

  async function submitAccessRequest() {
    if (!firstName.trim() || !lastName.trim() || !roleTitle.trim() || !emailOrPhone.trim()) {
      setAccessMessage(t.requestMissing);
      return;
    }

    setLoading(true);
    setAccessMessage(t.loading);

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

  async function authorizeAccess() {
    setLoading(true);
    setAccessMessage(t.loading);

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code: accessCode,
          firstName,
          lastName,
          title: roleTitle,
        }),
      });

      const json = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !json.ok) {
        if (json.error === "founder_access_code_not_configured") {
          setAccessMessage(t.accessNotConfigured);
        } else {
          setAccessMessage(t.accessDenied);
        }

        return;
      }

      setAccessApproved(true);
      setAccessMessage(t.accessApproved);
    } catch {
      setAccessMessage(t.accessDenied);
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
      radius: 9,
      color: "#07111f",
      weight: 3,
      fillColor: markerColor,
      fillOpacity: 0.95,
    })
      .addTo(map)
      .bindPopup(options.title);

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

    map.setView([lat, lng], Math.max(map.getZoom(), 18), {
      animate: true,
    });
  }

  async function locateMe() {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setMessage(t.locationUnavailable);
      return;
    }

    setMessage(t.locating);

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
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
        setMessage(t.located);

        window.setTimeout(() => {
          void loadPipes();
        }, 1100);
      },
      () => {
        setMessage(t.locationUnavailable);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
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

  async function searchAddressMarker() {
    const map = mapRef.current;
    const queries = buildSearchQueries();

    if (!map || queries.length === 0) {
      setMessage(t.searchNotFound);
      return;
    }

    setLoading(true);
    setMessage(t.loading);

    try {
      const pendingMatches = readPendingLocalAddressMatches(queries[0] || "");

      for (const query of queries) {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "1",
          addressdetails: "1",
          countrycodes: "cy",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              accept: "application/json",
            },
          },
        );

        if (!response.ok) continue;

        const results = (await response.json()) as Array<{
          lat?: string;
          lon?: string;
          display_name?: string;
        }>;

        const result = results[0];
        const lat = Number(result?.lat);
        const lng = Number(result?.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        await placeCircleMarker({
          lat,
          lng,
          kind: "search",
          title: result?.display_name || query,
        });

        moveMapToPoint(lat, lng);
        setMessage(t.searchFound);

        window.setTimeout(() => {
          void loadPipes();
        }, 1100);

        return;
      }

      if (pendingMatches.length > 0) {
        setMessage(
          `ρέθηκε προσωρινή καταχώρηση στη συσκευή: ${pendingMatches[0]}. εν έχει ακόμη γεωγραφικές συντεταγμένες ή έγκριση.`,
        );
        return;
      }

      setMessage(
        "εν βρέθηκε η διεύθυνση. οκίμασε οδό + περιοχή, Greeklish, χωρίς αριθμό ή πρόσθεσέ την ως νέο σημείο για έγκριση.",
      );
    } catch {
      setMessage(t.searchNotFound);
    } finally {
      setLoading(false);
    }
  }
  async function loadPipes() {
    const map = mapRef.current;

    if (!map || loadInProgressRef.current) return;

    loadInProgressRef.current = true;
    setLoading(true);
    setMessage(t.loading);

    try {
      const visibleBbox = bboxFromMap(map);
      const tiles = splitVisibleBboxIntoSafeTiles(visibleBbox);
      const allFeatures: any[] = [];

      for (const tile of tiles) {
        const params = new URLSearchParams({
          ...bboxParams(tile),
          maxFeatures: String(MAX_FEATURES_PER_TILE),
          street,
          houseNumber: number,
          area,
          postalCode: postal,
        });

        const response = await fetch(
          `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
          { cache: "no-store" },
        );

        const json = (await response.json()) as SegmentResponse;

        if (
          !response.ok ||
          json.completeNetworkReturned === true ||
          json.rawMasterReturned === true ||
          json.browserFullNetworkLoaded === true
        ) {
          throw new Error(json.error || json.reason || "No safe segment returned.");
        }

        if (json.segment?.features?.length) {
          allFeatures.push(...json.segment.features);
        }
      }

      const deduped = new Map<string, any>();

      allFeatures.forEach((feature, index) => {
        deduped.set(featureKey(feature, `fallback-${index}`), feature);
      });

      const features = Array.from(deduped.values());

      if (features.length <= 0) {
        throw new Error("No visible pipe features returned.");
      }

      const L = await ensureLeaflet();

      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      const collection = {
        type: "FeatureCollection",
        features,
      };

      const layer = L.geoJSON(collection, {
        style: (feature: any) => getPipeStyle(feature),
        pointToLayer: (feature: any, latlng: any) => {
          const style = getPipeStyle(feature);

          return L.circleMarker(latlng, {
            radius: Math.max(3, style.weight),
            color: style.color,
            fillColor: style.color,
            fillOpacity: style.opacity,
            opacity: style.opacity,
            weight: style.weight,
          });
        },
      });

      layer.addTo(map);
      layerRef.current = layer;

      const count = features.length;
      setPipeCount(count);
      setMessage(`${t.loaded}: ${count} (${tiles.length} ${t.chunks})`);
    } catch (error) {
      setPipeCount(null);

      if (error instanceof Error && error.message === "VISIBLE_AREA_TOO_LARGE") {
        setMessage(t.visibleTooLarge);
      } else {
        setMessage(t.failed);
      }
    } finally {
      loadInProgressRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map) return;

    function clearAutoLoadTimer() {
      if (autoLoadTimerRef.current) {
        window.clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
    }

    function scheduleAutoLoad() {
      clearAutoLoadTimer();

      autoLoadTimerRef.current = window.setTimeout(() => {
        void loadPipes();
      }, 900);
    }

    map.on("moveend zoomend", scheduleAutoLoad);
    scheduleAutoLoad();

    return () => {
      clearAutoLoadTimer();
      map.off("moveend zoomend", scheduleAutoLoad);
    };
  }, [mapReady, lang, street, number, area, postal]);

  if (!accessApproved) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
        <section className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center">
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

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
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

              <section className="rounded-3xl border border-emerald-700/60 bg-emerald-950/20 p-4">
                <h2 className="text-xl font-black text-emerald-100">{t.founderAccess}</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-100/80">{t.accessText}</p>

                <div className="mt-4 grid gap-3">
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder={t.firstName} className="rounded-2xl border border-emerald-700/70 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={t.lastName} className="rounded-2xl border border-emerald-700/70 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                  <input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder={t.roleTitle} className="rounded-2xl border border-emerald-700/70 bg-[#0d1a2d] px-4 py-3 text-white outline-none" />
                  <input
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    placeholder={t.accessCode}
                    type="password"
                    className="rounded-2xl border border-emerald-700/70 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void authorizeAccess()}
                  disabled={loading}
                  className="mt-4 w-full rounded-2xl border border-emerald-500/60 bg-emerald-500/15 px-5 py-4 text-base font-black text-emerald-100 disabled:opacity-60"
                >
                  {t.enterApproved}
                </button>
              </section>
            </div>

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

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => void locateMe()} disabled={loading} className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-3 text-sm font-black text-[#f8e6ad] disabled:opacity-60">
              {t.locate}
            </button>

            <button type="button" onClick={() => void searchAddressMarker()} disabled={loading} className="rounded-2xl border border-sky-400/60 bg-sky-400/15 px-5 py-3 text-sm font-black text-sky-100 disabled:opacity-60">
              {t.search}
            </button>

            <button type="button" onClick={() => void loadPipes()} disabled={loading} className="rounded-2xl border border-emerald-500/60 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-100 disabled:opacity-60">
              {loading ? t.loading : t.load}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-700 bg-[#0d1a2d]">
          <div className="flex flex-col gap-1 border-b border-slate-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <h2 className="text-xl font-black text-[#f2c766] sm:text-2xl">{t.map}</h2>
            <span className="text-sm text-slate-300">
              {pipeCount !== null ? `${t.loaded}: ${pipeCount}` : t.protected}
            </span>
          </div>

          <div ref={mapEl} className="h-[70vh] min-h-[420px] w-full bg-slate-200 sm:min-h-[560px]" />
        </section>
      </section>
    </main>
  );
}


