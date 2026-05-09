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
    sourceFile?: string;
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
};

type WorldPoint = {
  x: number;
  y: number;
};

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 720;
const TILE_SIZE = 256;
const REQUEST_LIMIT = 5000;
const MAX_POINTS = 150;

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
    return coords.filter(isPosition).map((point) => ({ kind: "point", points: [point], feature }));
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
      .map((points) => ({ kind: "line", points, feature }));
  }

  if (type === "Polygon" && Array.isArray(coords)) {
    return coords
      .filter(Array.isArray)
      .map((ring) => ring.filter(isPosition))
      .filter((points) => points.length >= 3)
      .map((points) => ({ kind: "polygon", points, feature }));
  }

  if (type === "MultiPolygon" && Array.isArray(coords)) {
    const parts: Part[] = [];

    for (const polygon of coords) {
      if (!Array.isArray(polygon)) continue;

      for (const ring of polygon) {
        if (!Array.isArray(ring)) continue;

        const points = ring.filter(isPosition);
        if (points.length >= 3) {
          parts.push({ kind: "polygon", points, feature });
        }
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
  for (let zoom = 18; zoom >= 9; zoom -= 1) {
    const a = lonLatToWorld(bounds.minLon, bounds.maxLat, zoom);
    const b = lonLatToWorld(bounds.maxLon, bounds.minLat, zoom);
    const width = Math.abs(b.x - a.x);
    const height = Math.abs(b.y - a.y);

    if (width <= MAP_WIDTH * 0.9 && height <= MAP_HEIGHT * 0.9) return zoom;
  }

  return 14;
}

function getBoundsCenter(bounds: Bounds): Center {
  return {
    lon: (bounds.minLon + bounds.maxLon) / 2,
    lat: (bounds.minLat + bounds.maxLat) / 2,
    label: "έντρο δικτύου",
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
      "τοιχείο δικτύου"
  );
}

export default function WaterNetworkClient() {
  const [data, setData] = useState<Collection | null>(null);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [manualCenter, setManualCenter] = useState<Center | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("όρτωση δικτύου ύδρευσης...");

  useEffect(() => {
    let active = true;

    fetch(`/api/professional/infrastructure/water/network?limit=${REQUEST_LIMIT}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json: Collection) => {
        if (!active) return;
        setData(json);
        setStatus("ο δίκτυο ύδρευσης φορτώθηκε.");
      })
      .catch(() => {
        if (!active) return;
        setStatus("εν φορτώθηκε το δίκτυο ύδρευσης.");
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
    const zoom = manualCenter ? 17 : chooseZoom(bounds);
    const centerWorld = lonLatToWorld(center.lon, center.lat, zoom);
    const tiles = getTiles(centerWorld, zoom);

    return { center, centerWorld, zoom, tiles };
  }, [bounds, manualCenter]);

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = query.trim();

    if (!text) {
      setStatus("ράψε οδό ή περιοχή.");
      return;
    }

    setStatus("ναζήτηση οδού...");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(text)}`
      );
      const results = (await response.json()) as { lon: string; lat: string; display_name: string }[];

      if (!results.length) {
        setStatus("εν βρέθηκε η οδός ή η περιοχή.");
        return;
      }

      setManualCenter({
        lon: Number(results[0].lon),
        lat: Number(results[0].lat),
        label: results[0].display_name,
      });
      setStatus(" χάρτης μετακινήθηκε στην οδό/περιοχή.");
    } catch {
      setStatus(" αναζήτηση δεν ολοκληρώθηκε.");
    }
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setStatus(" browser δεν υποστηρίζει εντοπισμό θέσης.");
      return;
    }

    setStatus("ντοπισμός θέσης...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setManualCenter({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
          label: " τρέχουσα θέση μου",
        });
        setStatus(" χάρτης μετακινήθηκε στη θέση σου.");
      },
      () => {
        setStatus("εν επιτράπηκε ή δεν βρέθηκε η θέση σου.");
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
          placeholder="ράψε οδό ή περιοχή"
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          ναζήτηση
        </button>

        <button type="button" style={styles.button} onClick={locateUser}>
          ρες τη θέση μου
        </button>
      </form>

      <div style={styles.status}>
        <strong>ίκτυο ύδρευσης</strong>
        <span>{status}</span>
        <span>
          ροβολή: {shown} από {total} στοιχεία δικτύου
        </span>
      </div>

      <div style={styles.map}>
        {!model ? (
          <div style={styles.empty}>
            <strong>εν εμφανίστηκε το δίκτυο ύδρευσης.</strong>
            <span>{data?.pantavion?.message || "Έλεγξε το αρχικό αρχείο δικτύου."}</span>
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
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.97"
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
        <span>KMZ/KML δημόσια λήψη: όχι</span>
        <span>Mock χρήστες: όχι</span>
        <span>πιλογή: {selected ? getName(selected) : "καμία"}</span>
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
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
    borderBottom: "1px solid rgba(246,200,95,.22)",
  },
  input: {
    flex: "1 1 280px",
    minHeight: 46,
    borderRadius: 14,
    border: "1px solid rgba(246,200,95,.35)",
    background: "#071020",
    color: "#fff8e7",
    padding: "0 14px",
    fontSize: 16,
    outline: "none",
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    border: "1px solid rgba(246,200,95,.45)",
    background: "rgba(246,200,95,.14)",
    color: "#fff8e7",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  },
  status: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(246,200,95,.14)",
    color: "#d8e0f4",
    fontSize: 14,
  },
  map: {
    position: "relative",
    height: "min(74vh, 760px)",
    minHeight: 560,
    overflow: "hidden",
    background: "#0a1324",
  },
  tiles: {
    position: "absolute",
    inset: 0,
    opacity: 0.84,
    filter: "contrast(.96) saturate(.88) brightness(.86)",
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
    left: 14,
    bottom: 14,
    maxWidth: "70%",
    padding: "8px 11px",
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
    padding: "12px 18px",
    borderTop: "1px solid rgba(246,200,95,.18)",
    color: "#d8e0f4",
    fontSize: 13,
  },
};
