"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

type Geometry = {
  type?: string;
  coordinates?: unknown;
  geometries?: Geometry[];
};

type Feature = {
  type?: string;
  geometry?: Geometry;
  properties?: Record<string, unknown> | null;
};

type Collection = {
  type?: string;
  features?: Feature[];
  pantavion?: {
    featureCount?: number;
    returnedFeatureCount?: number;
    message?: string;
    sourceMode?: string;
    sourceLabel?: string;
  };
};

type AssetKind =
  | "pipe"
  | "proposed"
  | "valve"
  | "hydrant"
  | "fitting"
  | "connection"
  | "symbol"
  | "other";

const REQUEST_LIMIT = 5000;
const DEFAULT_CENTER: Leaflet.LatLngExpression = [34.707, 33.05];
const DEFAULT_ZOOM = 13;

const copy = {
  input: "ράψε οδό ή περιοχή",
  search: "ναζήτηση",
  locate: "ρες τη θέση μου",
  reset: "Reset",
  loading: "όρτωση πραγματικού δικτύου ύδρευσης...",
  loaded: "ο δίκτυο ύδρευσης φορτώθηκε.",
  loadFailed: "εν φορτώθηκε το δίκτυο ύδρευσης.",
  writeAddress: "ράψε οδό ή περιοχή.",
  searching: "ναζήτηση οδού...",
  notFound: "εν βρέθηκε η οδός ή η περιοχή.",
  searchDone: " χάρτης μετακινήθηκε στην οδό ή περιοχή.",
  searchFailed: " αναζήτηση δεν ολοκληρώθηκε.",
  noGeo: " browser δεν υποστηρίζει εντοπισμό θέσης.",
  locating: "ντοπισμός θέσης...",
  locationDone: " χάρτης μετακινήθηκε στη θέση σου.",
  locationFailed: "εν επιτράπηκε ή δεν βρέθηκε η θέση σου.",
  network: "ίκτυο ύδρευσης",
  shown: "ροβολή",
  from: "από",
  items: "στοιχεία δικτύου",
  selected: "πιλεγμένο",
  none: "καμία επιλογή",
  protectedText: "διωτικό αρχείο δικτύου: προστατευμένο",
  satellite: "Satellite βάση όπως Google Earth",
  pipe: "ωλήνες / δίκτυο",
  proposed: "ροτεινόμενο / κύριο",
  valve: "άνες",
  hydrant: "δροστόμια",
  fitting: "Fittings",
  connection: "υνδέσεις",
  symbol: "ύμβολα",
  other: "Άλλα",
};

const kindLabels: Record<AssetKind, string> = {
  pipe: copy.pipe,
  proposed: copy.proposed,
  valve: copy.valve,
  hydrant: copy.hydrant,
  fitting: copy.fitting,
  connection: copy.connection,
  symbol: copy.symbol,
  other: copy.other,
};

const fallbackColors: Record<AssetKind, string> = {
  pipe: "#ff3434",
  proposed: "#35ff78",
  valve: "#00e5ff",
  hydrant: "#2577ff",
  fitting: "#ff38d4",
  connection: "#ffcf33",
  symbol: "#8d5cff",
  other: "#ffffff",
};

const leafletCss = `
.leaflet-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #08111f;
  font-family: Arial, sans-serif;
  cursor: grab;
}
.leaflet-container:active {
  cursor: grabbing;
}
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
  position: absolute;
  left: 0;
  top: 0;
}
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
  user-select: none;
  -webkit-user-drag: none;
}
.leaflet-tile {
  border: 0;
  visibility: hidden;
}
.leaflet-tile-loaded {
  visibility: inherit;
}
.leaflet-pane {
  z-index: 400;
}
.leaflet-tile-pane {
  z-index: 200;
}
.leaflet-overlay-pane {
  z-index: 400;
}
.leaflet-shadow-pane {
  z-index: 500;
}
.leaflet-marker-pane {
  z-index: 600;
}
.leaflet-tooltip-pane {
  z-index: 650;
}
.leaflet-popup-pane {
  z-index: 700;
}
.leaflet-control-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 800;
}
.leaflet-top,
.leaflet-bottom {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}
.leaflet-top {
  top: 10px;
}
.leaflet-right {
  right: 10px;
}
.leaflet-left {
  left: 10px;
}
.leaflet-bottom {
  bottom: 10px;
}
.leaflet-control {
  position: relative;
  z-index: 1000;
  pointer-events: auto;
}
.leaflet-bar {
  border: 1px solid rgba(246, 200, 95, .5);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(5, 12, 24, .82);
  box-shadow: 0 10px 25px rgba(0,0,0,.35);
}
.leaflet-bar a {
  display: block;
  width: 34px;
  height: 34px;
  line-height: 34px;
  text-align: center;
  text-decoration: none;
  color: #fff8e7;
  font-weight: 900;
  border-bottom: 1px solid rgba(246, 200, 95, .28);
}
.leaflet-bar a:last-child {
  border-bottom: 0;
}
.leaflet-popup {
  position: absolute;
  text-align: left;
  margin-bottom: 16px;
}
.leaflet-popup-content-wrapper {
  background: rgba(5, 12, 24, .96);
  color: #fff8e7;
  border: 1px solid rgba(246,200,95,.42);
  border-radius: 14px;
  box-shadow: 0 14px 35px rgba(0,0,0,.45);
}
.leaflet-popup-content {
  margin: 10px 12px;
  min-width: 190px;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.4;
}
.leaflet-popup-tip-container {
  position: absolute;
  left: 50%;
  margin-left: -10px;
  width: 20px;
  height: 10px;
  overflow: hidden;
}
.leaflet-popup-tip {
  width: 14px;
  height: 14px;
  padding: 1px;
  margin: -8px auto 0;
  transform: rotate(45deg);
  background: rgba(5, 12, 24, .96);
  border: 1px solid rgba(246,200,95,.42);
}
.leaflet-popup-close-button {
  position: absolute;
  top: 6px;
  right: 8px;
  color: #fff8e7;
  text-decoration: none;
  font-weight: 900;
}
.leaflet-interactive {
  cursor: pointer;
}
`;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseKmlColor(value: string) {
  const clean = value.replace("#", "").trim();

  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean}`;
  }

  if (/^[0-9a-fA-F]{8}$/.test(clean)) {
    const blue = clean.slice(2, 4);
    const green = clean.slice(4, 6);
    const red = clean.slice(6, 8);
    return `#${red}${green}${blue}`;
  }

  return "";
}

function textOfProperties(properties: Record<string, unknown>) {
  return Object.entries(properties)
    .map(([key, value]) => `${key}:${String(value ?? "")}`)
    .join(" ")
    .toLowerCase();
}

function getKind(properties: Record<string, unknown>): AssetKind {
  const direct =
    asString(properties.pantavionAssetType) ||
    asString(properties.assetType) ||
    asString(properties.asset_type) ||
    asString(properties.kind) ||
    asString(properties.category) ||
    asString(properties.type);

  const text = `${direct} ${textOfProperties(properties)}`.toLowerCase();

  if (
    text.includes("valve") ||
    text.includes("vana") ||
    text.includes("βάνα") ||
    text.includes("βαν") ||
    text.includes("δικλείδα")
  ) {
    return "valve";
  }

  if (
    text.includes("hydrant") ||
    text.includes("fire") ||
    text.includes("υδροστόμιο") ||
    text.includes("πυροσβεσ")
  ) {
    return "hydrant";
  }

  if (
    text.includes("fitting") ||
    text.includes("coupling") ||
    text.includes("elbow") ||
    text.includes("tee") ||
    text.includes("ταυ") ||
    text.includes("εξάρτημα")
  ) {
    return "fitting";
  }

  if (
    text.includes("connection") ||
    text.includes("service") ||
    text.includes("σύνδεση") ||
    text.includes("παροχή")
  ) {
    return "connection";
  }

  if (
    text.includes("proposed") ||
    text.includes("proposal") ||
    text.includes("future") ||
    text.includes("προτειν")
  ) {
    return "proposed";
  }

  if (
    text.includes("symbol") ||
    text.includes("σημείο") ||
    text.includes("marker")
  ) {
    return "symbol";
  }

  if (
    text.includes("pipe") ||
    text.includes("polyline") ||
    text.includes("line") ||
    text.includes("σωλήν") ||
    text.includes("δίκτυο")
  ) {
    return "pipe";
  }

  return "other";
}

function getFeatureColor(properties: Record<string, unknown>, kind: AssetKind) {
  const direct =
    asString(properties.pantavionColor) ||
    asString(properties.stroke) ||
    asString(properties["stroke-color"]) ||
    asString(properties.color) ||
    asString(properties.Color) ||
    asString(properties.kmlColor);

  const parsed = direct ? parseKmlColor(direct) : "";
  return parsed || fallbackColors[kind];
}

function getFeatureName(feature: GeoJSON.Feature) {
  const properties = (feature.properties || {}) as Record<string, unknown>;

  return String(
    properties.name ||
      properties.Name ||
      properties.NAME ||
      properties.pantavionId ||
      properties.id ||
      properties.description ||
      copy.network
  );
}

function popupHtml(feature: GeoJSON.Feature) {
  const properties = (feature.properties || {}) as Record<string, unknown>;
  const kind = getKind(properties);
  const name = getFeatureName(feature);

  const usefulRows = Object.entries(properties)
    .filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      return [
        "diameter",
        "Diameter",
        "DIAMETER",
        "material",
        "Material",
        "MATERIAL",
        "pressure",
        "Pressure",
        "status",
        "Status",
        "pantavionId",
        "styleUrl",
      ].includes(key);
    })
    .slice(0, 6)
    .map(
      ([key, value]) =>
        `<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</div>`
    )
    .join("");

  return `
    <div>
      <div style="font-weight:900;color:#f6c85f;margin-bottom:5px">${escapeHtml(name)}</div>
      <div><strong>ύπος:</strong> ${escapeHtml(kindLabels[kind])}</div>
      ${usefulRows}
    </div>
  `;
}

function pathStyle(feature?: GeoJSON.Feature): Leaflet.PathOptions {
  const properties = (feature?.properties || {}) as Record<string, unknown>;
  const kind = getKind(properties);
  const color = getFeatureColor(properties, kind);

  return {
    color,
    weight: kind === "proposed" ? 4 : kind === "pipe" ? 2.4 : 3.2,
    opacity: 0.96,
    fillColor: color,
    fillOpacity: kind === "pipe" || kind === "proposed" ? 0.12 : 0.82,
    dashArray: kind === "proposed" ? "8 6" : undefined,
  };
}

function pointRadius(kind: AssetKind) {
  if (kind === "valve") return 5.5;
  if (kind === "hydrant") return 6;
  if (kind === "fitting") return 5;
  if (kind === "connection") return 4.5;
  if (kind === "symbol") return 5;
  return 4;
}

function transliterateGreek(input: string) {
  const map: Record<string, string> = {
    : "A",
    : "V",
    : "G",
    : "D",
    : "E",
    : "Z",
    : "I",
    : "Th",
    : "I",
    : "K",
    : "L",
    : "M",
    : "N",
    : "X",
    : "O",
    : "P",
    : "R",
    : "S",
    : "T",
    : "Y",
    : "F",
    : "Ch",
    Ψ: "Ps",
    : "O",
    Ά: "A",
    Έ: "E",
    Ή: "I",
    Ί: "I",
    Ό: "O",
    Ύ: "Y",
    Ώ: "O",
    Ϊ: "I",
    Ϋ: "Y",
    α: "a",
    β: "v",
    γ: "g",
    δ: "d",
    ε: "e",
    ζ: "z",
    η: "i",
    θ: "th",
    ι: "i",
    κ: "k",
    λ: "l",
    μ: "m",
    ν: "n",
    ξ: "x",
    ο: "o",
    π: "p",
    ρ: "r",
    σ: "s",
    ς: "s",
    τ: "t",
    υ: "y",
    φ: "f",
    χ: "ch",
    ψ: "ps",
    ω: "o",
    ά: "a",
    έ: "e",
    ή: "i",
    ί: "i",
    ό: "o",
    ύ: "y",
    ώ: "o",
    ϊ: "i",
    ϋ: "y",
    ΐ: "i",
    ΰ: "y",
  };

  return input
    .split("")
    .map((char) => map[char] || char)
    .join("");
}

function buildSearchCandidates(input: string) {
  const clean = input.trim();
  const latin = transliterateGreek(clean);

  return Array.from(
    new Set([
      clean,
      `${clean}, ερμασόγεια, εμεσός, ύπρος`,
      `${clean}, Germasogeia, Limassol, Cyprus`,
      `${clean}, Lemesos, Cyprus`,
      `${clean}, Cyprus`,
      latin,
      `${latin}, Germasogeia, Limassol, Cyprus`,
      `${latin}, Lemesos, Cyprus`,
    ])
  ).filter(Boolean);
}

async function geocodeCyprus(input: string) {
  const candidates = buildSearchCandidates(input);

  for (const candidate of candidates) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "cy");
    url.searchParams.set("accept-language", "el,en");
    url.searchParams.set("q", candidate);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) continue;

    const results = (await response.json()) as {
      lon: string;
      lat: string;
      display_name: string;
    }[];

    const first = results[0];
    if (!first) continue;

    const lon = Number(first.lon);
    const lat = Number(first.lat);

    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return {
        lon,
        lat,
        label: first.display_name,
      };
    }
  }

  return null;
}

export default function WaterNetworkClient() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const networkLayerRef = useRef<Leaflet.GeoJSON | null>(null);
  const searchMarkerRef = useRef<Leaflet.Layer | null>(null);
  const locationMarkerRef = useRef<Leaflet.Layer | null>(null);

  const [data, setData] = useState<Collection | null>(null);
  const [selectedName, setSelectedName] = useState(copy.none);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(copy.loading);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootMap() {
      const leaflet = await import("leaflet");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      leafletRef.current = leaflet;

      const map = leaflet.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
      });

      leaflet
        .tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 20,
            attribution: "Tiles © Esri",
          }
        )
        .addTo(map);

      leaflet
        .tileLayer(
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 20,
            opacity: 0.78,
            attribution: "Labels © Esri",
          }
        )
        .addTo(map);

      mapRef.current = map;

      window.setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 80);
    }

    bootMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      networkLayerRef.current = null;
      searchMarkerRef.current = null;
      locationMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`/api/professional/infrastructure/water/network?limit=${REQUEST_LIMIT}&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json: Collection) => {
        if (!active) return;
        setData(json);
        setStatus(copy.loaded);
      })
      .catch(() => {
        if (!active) return;
        setStatus(copy.loadFailed);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !mapReady || !data?.features?.length) return;

    if (networkLayerRef.current) {
      networkLayerRef.current.removeFrom(map);
      networkLayerRef.current = null;
    }

    const networkLayer = leaflet.geoJSON(data as GeoJSON.GeoJsonObject, {
      style: (feature?: GeoJSON.Feature) => pathStyle(feature),
      pointToLayer: (feature: GeoJSON.Feature, latlng: Leaflet.LatLng) => {
        const properties = (feature.properties || {}) as Record<string, unknown>;
        const kind = getKind(properties);
        const color = getFeatureColor(properties, kind);

        return leaflet.circleMarker(latlng, {
          radius: pointRadius(kind),
          color: "#071020",
          weight: 1.6,
          fillColor: color,
          fillOpacity: 0.96,
        });
      },
      onEachFeature: (feature: GeoJSON.Feature, layer: Leaflet.Layer) => {
        layer.bindPopup(popupHtml(feature));

        layer.on("click", () => {
          setSelectedName(getFeatureName(feature));
        });
      },
    });

    networkLayer.addTo(map);
    networkLayerRef.current = networkLayer;

    const bounds = networkLayer.getBounds();

    if (bounds.isValid()) {
      map.invalidateSize();
      map.fitBounds(bounds.pad(0.08), {
        animate: false,
        maxZoom: 18,
      });
    }

    return () => {
      networkLayer.removeFrom(map);
    };
  }, [data, mapReady]);

  const features = data?.features || [];

  const counts = useMemo(() => {
    const result: Record<AssetKind, number> = {
      pipe: 0,
      proposed: 0,
      valve: 0,
      hydrant: 0,
      fitting: 0,
      connection: 0,
      symbol: 0,
      other: 0,
    };

    for (const feature of features) {
      result[getKind((feature.properties || {}) as Record<string, unknown>)] += 1;
    }

    return result;
  }, [features]);

  const total = data?.pantavion?.featureCount || features.length;
  const shown = data?.pantavion?.returnedFeatureCount || features.length;

  function resetView() {
    const map = mapRef.current;
    const layer = networkLayerRef.current;

    if (!map || !layer) return;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.invalidateSize();
      map.fitBounds(bounds.pad(0.08), {
        animate: true,
        maxZoom: 18,
      });
    }
  }

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = query.trim();

    if (!text) {
      setStatus(copy.writeAddress);
      return;
    }

    setStatus(copy.searching);

    try {
      const result = await geocodeCyprus(text);
      const map = mapRef.current;
      const leaflet = leafletRef.current;

      if (!result || !map || !leaflet) {
        setStatus(copy.notFound);
        return;
      }

      if (searchMarkerRef.current) {
        searchMarkerRef.current.removeFrom(map);
      }

      searchMarkerRef.current = leaflet
        .circleMarker([result.lat, result.lon], {
          radius: 8,
          color: "#071020",
          weight: 2,
          fillColor: "#45ffac",
          fillOpacity: 0.96,
        })
        .addTo(map)
        .bindPopup(`<strong>${escapeHtml(result.label)}</strong>`)
        .openPopup();

      map.setView([result.lat, result.lon], 18, {
        animate: true,
      });

      setStatus(copy.searchDone);
    } catch {
      setStatus(copy.searchFailed);
    }
  }

  function locateUser() {
    const map = mapRef.current;
    const leaflet = leafletRef.current;

    if (!navigator.geolocation || !map || !leaflet) {
      setStatus(copy.noGeo);
      return;
    }

    setStatus(copy.locating);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (locationMarkerRef.current) {
          locationMarkerRef.current.removeFrom(map);
        }

        locationMarkerRef.current = leaflet
          .circleMarker([lat, lon], {
            radius: 8,
            color: "#071020",
            weight: 2,
            fillColor: "#45ffac",
            fillOpacity: 0.96,
          })
          .addTo(map)
          .bindPopup("<strong> τρέχουσα θέση μου</strong>")
          .openPopup();

        map.setView([lat, lon], 18, {
          animate: true,
        });

        setStatus(copy.locationDone);
      },
      () => {
        setStatus(copy.locationFailed);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }

  return (
    <div style={styles.wrap}>
      <style>{leafletCss}</style>

      <form style={styles.controls} onSubmit={searchAddress}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.input}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          {copy.search}
        </button>

        <button type="button" style={styles.button} onClick={locateUser}>
          {copy.locate}
        </button>

        <button type="button" style={styles.smallButton} onClick={resetView}>
          {copy.reset}
        </button>
      </form>

      <div style={styles.status}>
        <strong>{copy.network}</strong>
        <span>{status}</span>
        <span>
          {copy.shown}: {shown} {copy.from} {total} {copy.items}
        </span>
        <span>{copy.satellite}</span>
      </div>

      <div style={styles.mapShell}>
        <div ref={mapContainerRef} style={styles.map} />

        <aside style={styles.legend}>
          <strong style={styles.legendTitle}>Legend</strong>

          {(Object.keys(kindLabels) as AssetKind[]).map((kind) => (
            <div key={kind} style={styles.legendRow}>
              <span
                style={{
                  ...styles.legendSwatch,
                  background: fallbackColors[kind],
                }}
              />
              <span>
                {kindLabels[kind]}: {counts[kind]}
              </span>
            </div>
          ))}
        </aside>
      </div>

      <footer style={styles.footer}>
        <span>{copy.protectedText}</span>
        <span>
          {copy.selected}: {selectedName}
        </span>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    width: "100%",
    background: "#050c18",
    color: "#fff8e7",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) auto auto auto",
    gap: 8,
    padding: 10,
    borderBottom: "1px solid rgba(246,200,95,.22)",
  },
  input: {
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid rgba(246,200,95,.35)",
    background: "#071020",
    color: "#fff8e7",
    padding: "0 12px",
    fontSize: 15,
    outline: "none",
  },
  button: {
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid rgba(246,200,95,.45)",
    background: "rgba(246,200,95,.14)",
    color: "#fff8e7",
    padding: "0 13px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  smallButton: {
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid rgba(246,200,95,.38)",
    background: "rgba(246,200,95,.1)",
    color: "#fff8e7",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  status: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: "8px 12px",
    borderBottom: "1px solid rgba(246,200,95,.14)",
    color: "#d8e0f4",
    fontSize: 13,
  },
  mapShell: {
    position: "relative",
    height: "calc(100vh - 210px)",
    minHeight: 540,
    background: "#08111f",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  legend: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 245,
    maxWidth: "calc(100% - 24px)",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(246,200,95,.38)",
    background: "rgba(5,12,24,.84)",
    boxShadow: "0 14px 30px rgba(0,0,0,.34)",
    backdropFilter: "blur(8px)",
    zIndex: 900,
    fontSize: 12,
  },
  legendTitle: {
    display: "block",
    marginBottom: 8,
    color: "#f6c85f",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  legendRow: {
    display: "grid",
    gridTemplateColumns: "14px 1fr",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    color: "#fff8e7",
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.75)",
    boxShadow: "0 0 0 2px rgba(0,0,0,.25)",
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    padding: "9px 12px",
    color: "#d8e0f4",
    fontSize: 12,
    borderTop: "1px solid rgba(246,200,95,.16)",
  },
};
