"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type Geometry = {
  type?: string;
  coordinates?: unknown;
  geometries?: Geometry[];
};

type Feature = {
  type?: string;
  geometry?: Geometry;
  properties?: Record<string, unknown>;
};

type Collection = {
  type?: string;
  features?: Feature[];
  pantavion?: {
    featureCount?: number;
    returnedFeatureCount?: number;
    message?: string;
  };
};

type Bounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

type Part = {
  kind: "line" | "polygon" | "point";
  points: number[][];
  feature: Feature;
};

type Center = {
  lon: number;
  lat: number;
  label: string;
  zoom?: number;
};

type WorldPoint = {
  x: number;
  y: number;
};

type ViewState = {
  zoomDelta: number;
  panX: number;
  panY: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  basePanX: number;
  basePanY: number;
};

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 720;
const TILE_SIZE = 256;
const REQUEST_LIMIT = 5000;
const MAX_POINTS = 140;

const copy = {
  input: "\u0393\u03c1\u03ac\u03c8\u03b5 \u03bf\u03b4\u03cc \u03ae \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae",
  search: "\u0391\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7",
  locate: "\u0392\u03c1\u03b5\u03c2 \u03c4\u03b7 \u03b8\u03ad\u03c3\u03b7 \u03bc\u03bf\u03c5",
  zoomIn: "+",
  zoomOut: "-",
  reset: "Reset",
  loading: "\u03a6\u03cc\u03c1\u03c4\u03c9\u03c3\u03b7 \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5 \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2...",
  loaded: "\u03a4\u03bf \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2 \u03c6\u03bf\u03c1\u03c4\u03ce\u03b8\u03b7\u03ba\u03b5.",
  loadFailed: "\u0394\u03b5\u03bd \u03c6\u03bf\u03c1\u03c4\u03ce\u03b8\u03b7\u03ba\u03b5 \u03c4\u03bf \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2.",
  writeAddress: "\u0393\u03c1\u03ac\u03c8\u03b5 \u03bf\u03b4\u03cc \u03ae \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae.",
  searching: "\u0391\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03bf\u03b4\u03bf\u03cd...",
  notFound: "\u0394\u03b5\u03bd \u03b2\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b7 \u03bf\u03b4\u03cc\u03c2 \u03ae \u03b7 \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae.",
  searchDone: "\u039f \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03bc\u03b5\u03c4\u03b1\u03ba\u03b9\u03bd\u03ae\u03b8\u03b7\u03ba\u03b5 \u03c3\u03c4\u03b7\u03bd \u03bf\u03b4\u03cc \u03ae \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae.",
  searchFailed: "\u0397 \u03b1\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03b4\u03b5\u03bd \u03bf\u03bb\u03bf\u03ba\u03bb\u03b7\u03c1\u03ce\u03b8\u03b7\u03ba\u03b5.",
  noGeo: "\u039f browser \u03b4\u03b5\u03bd \u03c5\u03c0\u03bf\u03c3\u03c4\u03b7\u03c1\u03af\u03b6\u03b5\u03b9 \u03b5\u03bd\u03c4\u03bf\u03c0\u03b9\u03c3\u03bc\u03cc \u03b8\u03ad\u03c3\u03b7\u03c2.",
  locating: "\u0395\u03bd\u03c4\u03bf\u03c0\u03b9\u03c3\u03bc\u03cc\u03c2 \u03b8\u03ad\u03c3\u03b7\u03c2...",
  locationDone: "\u039f \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03bc\u03b5\u03c4\u03b1\u03ba\u03b9\u03bd\u03ae\u03b8\u03b7\u03ba\u03b5 \u03c3\u03c4\u03b7 \u03b8\u03ad\u03c3\u03b7 \u03c3\u03bf\u03c5.",
  locationFailed: "\u0394\u03b5\u03bd \u03b5\u03c0\u03b9\u03c4\u03c1\u03ac\u03c0\u03b7\u03ba\u03b5 \u03ae \u03b4\u03b5\u03bd \u03b2\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b7 \u03b8\u03ad\u03c3\u03b7 \u03c3\u03bf\u03c5.",
  currentLocation: "\u0397 \u03c4\u03c1\u03ad\u03c7\u03bf\u03c5\u03c3\u03b1 \u03b8\u03ad\u03c3\u03b7 \u03bc\u03bf\u03c5",
  networkCenter: "\u039a\u03ad\u03bd\u03c4\u03c1\u03bf \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5",
  network: "\u0394\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2",
  shown: "\u03a0\u03c1\u03bf\u03b2\u03bf\u03bb\u03ae",
  from: "\u03b1\u03c0\u03cc",
  items: "\u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1 \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5",
  noMap: "\u0394\u03b5\u03bd \u03b5\u03bc\u03c6\u03b1\u03bd\u03af\u03c3\u03c4\u03b7\u03ba\u03b5 \u03c4\u03bf \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2.",
  checkSource: "\u0388\u03bb\u03b5\u03b3\u03be\u03b5 \u03c4\u03bf \u03b1\u03c1\u03c7\u03b9\u03ba\u03cc \u03b1\u03c1\u03c7\u03b5\u03af\u03bf \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5.",
  selected: "\u0395\u03c0\u03b9\u03bb\u03b5\u03b3\u03bc\u03ad\u03bd\u03bf",
  none: "\u03ba\u03b1\u03bc\u03af\u03b1 \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae",
  item: "\u03a3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5",
  protectedText: "\u0399\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03cc \u03b1\u03c1\u03c7\u03b5\u03af\u03bf \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5: \u03c0\u03c1\u03bf\u03c3\u03c4\u03b1\u03c4\u03b5\u03c5\u03bc\u03ad\u03bd\u03bf",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isPosition(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}

function samplePoints(points: number[][], max: number) {
  if (points.length <= max) return points;
  if (max <= 2) return [points[0], points[points.length - 1]];

  const output: number[][] = [];
  const step = (points.length - 1) / (max - 1);

  for (let index = 0; index < max; index += 1) {
    output.push(points[Math.round(index * step)]);
  }

  return output;
}

function extractPartsFromGeometry(geometry: Geometry | undefined, feature: Feature): Part[] {
  if (!geometry) return [];

  const type = geometry.type || "";
  const coords = geometry.coordinates;

  if (type === "Point" && isPosition(coords)) {
    return [{ kind: "point", points: [coords], feature }];
  }

  if (type === "MultiPoint" && Array.isArray(coords)) {
    return coords.filter(isPosition).map((point): Part => ({ kind: "point", points: [point], feature }));
  }

  if (type === "LineString" && Array.isArray(coords)) {
    const points = coords.filter(isPosition);
    return points.length >= 2 ? [{ kind: "line", points, feature }] : [];
  }

  if (type === "MultiLineString" && Array.isArray(coords)) {
    return coords
      .filter(Array.isArray)
      .map((line) => line.filter(isPosition))
      .filter((points) => points.length >= 2)
      .map((points): Part => ({ kind: "line", points, feature }));
  }

  if (type === "Polygon" && Array.isArray(coords)) {
    return coords
      .filter(Array.isArray)
      .map((ring) => ring.filter(isPosition))
      .filter((points) => points.length >= 3)
      .map((points): Part => ({ kind: "polygon", points, feature }));
  }

  if (type === "MultiPolygon" && Array.isArray(coords)) {
    const parts: Part[] = [];

    for (const polygon of coords) {
      if (!Array.isArray(polygon)) continue;

      for (const ring of polygon) {
        if (!Array.isArray(ring)) continue;

        const points = ring.filter(isPosition);
        if (points.length >= 3) parts.push({ kind: "polygon", points, feature });
      }
    }

    return parts;
  }

  if (type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.flatMap((child) => extractPartsFromGeometry(child, feature));
  }

  return [];
}

function getAllParts(features: Feature[]) {
  return features.flatMap((feature) => extractPartsFromGeometry(feature.geometry, feature));
}

function getBounds(parts: Part[]): Bounds | null {
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let found = false;

  for (const part of parts) {
    for (const point of part.points) {
      const lon = point[0];
      const lat = point[1];

      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      found = true;
    }
  }

  return found ? { minLon, maxLon, minLat, maxLat } : null;
}

function lonLatToWorld(lon: number, lat: number, zoom: number): WorldPoint {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const safeLat = clamp(lat, -85.05112878, 85.05112878);
  const sinLat = Math.sin((safeLat * Math.PI) / 180);

  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function chooseZoom(bounds: Bounds) {
  for (let zoom = 17; zoom >= 9; zoom -= 1) {
    const a = lonLatToWorld(bounds.minLon, bounds.maxLat, zoom);
    const b = lonLatToWorld(bounds.maxLon, bounds.minLat, zoom);
    const width = Math.abs(b.x - a.x);
    const height = Math.abs(b.y - a.y);

    if (width <= MAP_WIDTH * 0.88 && height <= MAP_HEIGHT * 0.88) return zoom;
  }

  return 13;
}

function getBoundsCenter(bounds: Bounds): Center {
  return {
    lon: (bounds.minLon + bounds.maxLon) / 2,
    lat: (bounds.minLat + bounds.maxLat) / 2,
    label: copy.networkCenter,
  };
}

function project(point: number[], centerWorld: WorldPoint, zoom: number) {
  const world = lonLatToWorld(point[0], point[1], zoom);

  return {
    x: MAP_WIDTH / 2 + (world.x - centerWorld.x),
    y: MAP_HEIGHT / 2 + (world.y - centerWorld.y),
  };
}

function pointsToSvg(points: number[][], centerWorld: WorldPoint, zoom: number) {
  return points
    .map((point) => {
      const projected = project(point, centerWorld, zoom);
      return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
    })
    .join(" ");
}

function getTiles(centerWorld: WorldPoint, zoom: number) {
  const left = centerWorld.x - MAP_WIDTH / 2;
  const top = centerWorld.y - MAP_HEIGHT / 2;
  const right = centerWorld.x + MAP_WIDTH / 2;
  const bottom = centerWorld.y + MAP_HEIGHT / 2;

  const minTileX = Math.floor(left / TILE_SIZE);
  const maxTileX = Math.floor(right / TILE_SIZE);
  const minTileY = Math.floor(top / TILE_SIZE);
  const maxTileY = Math.floor(bottom / TILE_SIZE);
  const tileCount = Math.pow(2, zoom);
  const tiles: { x: number; y: number; left: number; top: number }[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) continue;

      tiles.push({
        x: ((tileX % tileCount) + tileCount) % tileCount,
        y: tileY,
        left: tileX * TILE_SIZE - left,
        top: tileY * TILE_SIZE - top,
      });
    }
  }

  return tiles;
}

function getName(feature: Feature) {
  return String(
    feature.properties?.name ||
      feature.properties?.Name ||
      feature.properties?.NAME ||
      feature.properties?.pantavionId ||
      feature.properties?.id ||
      copy.item
  );
}

export default function WaterNetworkClient() {
  const [data, setData] = useState<Collection | null>(null);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [manualCenter, setManualCenter] = useState<Center | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(copy.loading);
  const [view, setView] = useState<ViewState>({ zoomDelta: 0, panX: 0, panY: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/professional/infrastructure/water/network?limit=${REQUEST_LIMIT}`, {
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

  const features = data?.features || [];
  const parts = useMemo(() => getAllParts(features), [features]);
  const bounds = useMemo(() => getBounds(parts), [parts]);

  const model = useMemo(() => {
    if (!bounds) return null;

    const center = manualCenter || getBoundsCenter(bounds);
    const baseZoom = manualCenter?.zoom || chooseZoom(bounds);
    const zoom = clamp(baseZoom + view.zoomDelta, 9, 20);
    const baseCenterWorld = lonLatToWorld(center.lon, center.lat, zoom);
    const centerWorld = {
      x: baseCenterWorld.x - view.panX,
      y: baseCenterWorld.y - view.panY,
    };
    const tiles = getTiles(centerWorld, zoom);

    return { center, centerWorld, zoom, tiles };
  }, [bounds, manualCenter, view]);

  function resetView() {
    setManualCenter(null);
    setView({ zoomDelta: 0, panX: 0, panY: 0 });
  }

  function changeZoom(delta: number) {
    setView((current) => ({
      ...current,
      zoomDelta: clamp(current.zoomDelta + delta, -8, 8),
    }));
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
      const searchText = text.toLowerCase().includes("cyprus") ? text : `${text}, Cyprus`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchText)}`
      );
      const results = (await response.json()) as { lon: string; lat: string; display_name: string }[];

      if (!results.length) {
        setStatus(copy.notFound);
        return;
      }

      setManualCenter({
        lon: Number(results[0].lon),
        lat: Number(results[0].lat),
        label: results[0].display_name,
        zoom: 18,
      });
      setView({ zoomDelta: 0, panX: 0, panY: 0 });
      setStatus(copy.searchDone);
    } catch {
      setStatus(copy.searchFailed);
    }
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setStatus(copy.noGeo);
      return;
    }

    setStatus(copy.locating);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setManualCenter({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
          label: copy.currentLocation,
          zoom: 18,
        });
        setView({ zoomDelta: 0, panX: 0, panY: 0 });
        setStatus(copy.locationDone);
      },
      () => {
        setStatus(copy.locationFailed);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  const total = data?.pantavion?.featureCount || features.length;
  const shown = data?.pantavion?.returnedFeatureCount || features.length;

  return (
    <div style={styles.wrap}>
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

        <button type="button" style={styles.smallButton} onClick={() => changeZoom(1)}>
          {copy.zoomIn}
        </button>

        <button type="button" style={styles.smallButton} onClick={() => changeZoom(-1)}>
          {copy.zoomOut}
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
      </div>

      <div
        style={styles.map}
        onWheel={(event) => {
          event.preventDefault();
          changeZoom(event.deltaY < 0 ? 1 : -1);
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            basePanX: view.panX,
            basePanY: view.panY,
          });
        }}
        onPointerMove={(event) => {
          if (!drag || drag.pointerId !== event.pointerId) return;

          const dx = event.clientX - drag.startX;
          const dy = event.clientY - drag.startY;

          setView((current) => ({
            ...current,
            panX: drag.basePanX + dx,
            panY: drag.basePanY + dy,
          }));
        }}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        {!model ? (
          <div style={styles.empty}>
            <strong>{copy.noMap}</strong>
            <span>{data?.pantavion?.message || copy.checkSource}</span>
          </div>
        ) : (
          <>
            <div style={styles.tiles}>
              {model.tiles.map((tile) => (
                <img
                  key={`${model.zoom}-${tile.x}-${tile.y}-${tile.left}-${tile.top}`}
                  src={`https://tile.openstreetmap.org/${model.zoom}/${tile.x}/${tile.y}.png`}
                  alt=""
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    left: tile.left,
                    top: tile.top,
                  }}
                />
              ))}
            </div>

            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={styles.svg}>
              {parts.map((part, index) => {
                if (part.kind === "point") {
                  const point = project(part.points[0], model.centerWorld, model.zoom);

                  return (
                    <circle
                      key={`point-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#ffd15c"
                      stroke="#071020"
                      strokeWidth="2"
                      onClick={() => setSelected(part.feature)}
                    />
                  );
                }

                const sampled = samplePoints(part.points, MAX_POINTS);

                if (part.kind === "polygon") {
                  return (
                    <polygon
                      key={`polygon-${index}`}
                      points={pointsToSvg(sampled, model.centerWorld, model.zoom)}
                      fill="rgba(255,209,92,.10)"
                      stroke="#ffd15c"
                      strokeWidth="2"
                      onClick={() => setSelected(part.feature)}
                    />
                  );
                }

                return (
                  <polyline
                    key={`line-${index}`}
                    points={pointsToSvg(sampled, model.centerWorld, model.zoom)}
                    fill="none"
                    stroke="#ffd15c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.95"
                    onClick={() => setSelected(part.feature)}
                  />
                );
              })}

              {manualCenter && (
                <circle
                  cx={MAP_WIDTH / 2}
                  cy={MAP_HEIGHT / 2}
                  r="8"
                  fill="#45ffac"
                  stroke="#071020"
                  strokeWidth="3"
                />
              )}
            </svg>

            <div style={styles.mapLabel}>{model.center.label}</div>
          </>
        )}
      </div>

      <footer style={styles.footer}>
        <span>{copy.protectedText}</span>
        <span>
          {copy.selected}: {selected ? getName(selected) : copy.none}
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
    gridTemplateColumns: "minmax(220px, 1fr) auto auto auto auto auto",
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
    padding: "0 10px",
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
  map: {
    position: "relative",
    height: "calc(100vh - 210px)",
    minHeight: 470,
    overflow: "hidden",
    background: "#0a1324",
    touchAction: "none",
    cursor: "grab",
  },
  tiles: {
    position: "absolute",
    inset: 0,
  },
  svg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
  empty: {
    position: "absolute",
    inset: 20,
    display: "grid",
    placeContent: "center",
    gap: 10,
    textAlign: "center",
    background: "rgba(2,4,11,.72)",
    border: "1px solid rgba(246,200,95,.26)",
    borderRadius: 18,
    color: "#d8e0f4",
  },
  mapLabel: {
    position: "absolute",
    left: 12,
    bottom: 12,
    maxWidth: "70%",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(2,4,11,.84)",
    border: "1px solid rgba(246,200,95,.32)",
    color: "#fff8e7",
    fontSize: 12,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: "9px 12px",
    borderTop: "1px solid rgba(246,200,95,.18)",
    color: "#d8e0f4",
    fontSize: 13,
  },
};
