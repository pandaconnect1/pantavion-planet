"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type GeoJsonFeature = {
  type: "Feature";
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features?: GeoJsonFeature[];
  pantavion?: {
    status?: string;
    message?: string;
    sourceFile?: string;
    featureCount?: number;
    generatedAt?: string;
  };
};

type Bounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

type WorldPoint = {
  x: number;
  y: number;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 620;
const TILE_SIZE = 256;
const MAX_RENDER_FEATURES = 1600;
const MAX_POINTS_PER_LINE = 160;
const MAX_POINTS_PER_POLYGON = 180;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isFinitePosition(position: unknown): position is number[] {
  return Array.isArray(position) && Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function collectPositions(feature: GeoJsonFeature): number[][] {
  const geometry = feature.geometry;
  if (!geometry) return [];

  const coords = geometry.coordinates;

  if (geometry.type === "Point" && isFinitePosition(coords)) return [coords];

  if (geometry.type === "LineString" && Array.isArray(coords)) {
    return coords.filter(isFinitePosition);
  }

  if (geometry.type === "Polygon" && Array.isArray(coords)) {
    const positions: number[][] = [];

    for (const ring of coords) {
      if (!Array.isArray(ring)) continue;
      for (const position of ring) {
        if (isFinitePosition(position)) positions.push(position);
      }
    }

    return positions;
  }

  return [];
}

function samplePositions(positions: number[][], maxPoints: number): number[][] {
  if (positions.length <= maxPoints) return positions;
  if (maxPoints <= 2) return [positions[0], positions[positions.length - 1]];

  const sampled: number[][] = [];
  const step = (positions.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    sampled.push(positions[Math.round(index * step)]);
  }

  return sampled;
}

function getBounds(features: GeoJsonFeature[]): Bounds | null {
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let found = false;

  for (const feature of features) {
    for (const position of collectPositions(feature)) {
      const lon = position[0];
      const lat = position[1];

      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;

      found = true;
    }
  }

  if (!found) return null;

  return { minLon, maxLon, minLat, maxLat };
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
  for (let zoom = 19; zoom >= 7; zoom -= 1) {
    const topLeft = lonLatToWorld(bounds.minLon, bounds.maxLat, zoom);
    const bottomRight = lonLatToWorld(bounds.maxLon, bounds.minLat, zoom);

    const width = Math.abs(bottomRight.x - topLeft.x);
    const height = Math.abs(bottomRight.y - topLeft.y);

    if (width <= MAP_WIDTH * 0.78 && height <= MAP_HEIGHT * 0.78) return zoom;
  }

  return 7;
}

function getCenter(bounds: Bounds) {
  return {
    lon: (bounds.minLon + bounds.maxLon) / 2,
    lat: (bounds.minLat + bounds.maxLat) / 2,
  };
}

function getAssetType(feature: GeoJsonFeature) {
  return String(feature.properties?.pantavionAssetType || "unknown_asset");
}

function getName(feature: GeoJsonFeature, index: number) {
  return String(feature.properties?.name || feature.properties?.pantavionId || `Στοιχείο ${index + 1}`);
}

function getSortedRenderableFeatures(features: GeoJsonFeature[]) {
  return [...features]
    .sort((a, b) => {
      const order: Record<string, number> = { LineString: 0, Polygon: 1, Point: 2 };
      return (order[a.geometry?.type || ""] ?? 9) - (order[b.geometry?.type || ""] ?? 9);
    })
    .slice(0, MAX_RENDER_FEATURES);
}

function projectToViewport(position: number[], centerWorld: WorldPoint, zoom: number) {
  const world = lonLatToWorld(position[0], position[1], zoom);

  return {
    x: MAP_WIDTH / 2 + (world.x - centerWorld.x),
    y: MAP_HEIGHT / 2 + (world.y - centerWorld.y),
  };
}

function pointsToSvg(points: number[][], centerWorld: WorldPoint, zoom: number) {
  return points
    .map((position) => {
      const point = projectToViewport(position, centerWorld, zoom);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function getTiles(centerWorld: WorldPoint) {
  const left = centerWorld.x - MAP_WIDTH / 2;
  const top = centerWorld.y - MAP_HEIGHT / 2;
  const right = centerWorld.x + MAP_WIDTH / 2;
  const bottom = centerWorld.y + MAP_HEIGHT / 2;

  const minTileX = Math.floor(left / TILE_SIZE);
  const maxTileX = Math.floor(right / TILE_SIZE);
  const minTileY = Math.floor(top / TILE_SIZE);
  const maxTileY = Math.floor(bottom / TILE_SIZE);

  const tiles: { x: number; y: number; left: number; top: number }[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      tiles.push({
        x: tileX,
        y: tileY,
        left: tileX * TILE_SIZE - left,
        top: tileY * TILE_SIZE - top,
      });
    }
  }

  return tiles;
}

export default function WaterNetworkClient() {
  const [data, setData] = useState<GeoJsonCollection | null>(null);
  const [selected, setSelected] = useState<GeoJsonFeature | null>(null);
  const [error, setError] = useState("");
  const [zoomDelta, setZoomDelta] = useState(0);

  useEffect(() => {
    let active = true;

    fetch("/api/professional/infrastructure/water/network", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: GeoJsonCollection) => {
        if (!active) return;
        setData(json);
      })
      .catch(() => {
        if (!active) return;
        setError("Αδυναμία φόρτωσης ιδιωτικού layer ύδρευσης.");
      });

    return () => {
      active = false;
    };
  }, []);

  const features = data?.features || [];
  const bounds = useMemo(() => getBounds(features), [features]);

  const mapModel = useMemo(() => {
    if (!bounds) return null;

    const center = getCenter(bounds);
    const baseZoom = chooseZoom(bounds);
    const zoom = clamp(baseZoom + zoomDelta, 6, 20);
    const centerWorld = lonLatToWorld(center.lon, center.lat, zoom);
    const tiles = getTiles(centerWorld);

    return { center, zoom, centerWorld, tiles };
  }, [bounds, zoomDelta]);

  const renderFeatures = useMemo(() => getSortedRenderableFeatures(features), [features]);

  const sourceFile = data?.pantavion?.sourceFile || "Δεν έχει φορτωθεί ιδιωτικό αρχείο";
  const hasFeatures = features.length > 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <p style={styles.label}>ΧΑΡΤΗΣ ΔΡΟΜΩΝ + ΙΔΙΩΤΙΚΟ LAYER ΥΔΡΕΥΣΗΣ</p>
          <h3 style={styles.title}>
            {!data
              ? "Φορτώνει το ιδιωτικό δίκτυο..."
              : hasFeatures
                ? `Εμφάνιση ${renderFeatures.length} από ${features.length} στοιχεία`
                : "Αναμονή για μετατροπή KML/KMZ"}
          </h3>
          <p style={styles.meta}>{sourceFile}</p>
        </div>

        <div style={styles.actions}>
          <button style={styles.smallButton} onClick={() => setZoomDelta((value) => value + 1)}>
            +
          </button>
          <button style={styles.smallButton} onClick={() => setZoomDelta((value) => value - 1)}>
            -
          </button>
          <button style={styles.resetButton} onClick={() => setZoomDelta(0)}>
            Κέντρο
          </button>
        </div>
      </div>

      <div style={styles.map}>
        {!mapModel && (
          <div style={styles.empty}>
            <strong>Δεν φαίνεται ακόμα επεξεργασμένο δίκτυο.</strong>
            <span>
              Βάλε πραγματικό .kml ή .kmz στο private-infrastructure/water-network/original/
              και τρέξε: node scripts/pantavion-water-kml-to-geojson.cjs
            </span>
            {error ? <span>{error}</span> : null}
          </div>
        )}

        {mapModel && (
          <>
            <div style={styles.tileLayer}>
              {mapModel.tiles.map((tile) => (
                <img
                  key={`${mapModel.zoom}-${tile.x}-${tile.y}`}
                  src={`https://tile.openstreetmap.org/${mapModel.zoom}/${tile.x}/${tile.y}.png`}
                  alt=""
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    left: tile.left,
                    top: tile.top,
                    opacity: 0.82,
                  }}
                />
              ))}
            </div>

            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={styles.svg} role="img" aria-label="Δίκτυο ύδρευσης πάνω σε χάρτη">
              <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="rgba(2,4,11,.18)" />

              {renderFeatures.map((feature, index) => {
                const geometryType = feature.geometry?.type;
                const assetType = getAssetType(feature);
                const positions = collectPositions(feature);

                if (geometryType === "LineString") {
                  const sampled = samplePositions(positions, MAX_POINTS_PER_LINE);

                  return (
                    <polyline
                      key={String(feature.properties?.pantavionId || index)}
                      points={pointsToSvg(sampled, mapModel.centerWorld, mapModel.zoom)}
                      fill="none"
                      stroke={assetType === "central_main" ? "#fff1ad" : "#f6c85f"}
                      strokeWidth={assetType === "central_main" ? 5 : 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.92}
                      onClick={() => setSelected(feature)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                }

                if (geometryType === "Polygon") {
                  const sampled = samplePositions(positions, MAX_POINTS_PER_POLYGON);

                  return (
                    <polygon
                      key={String(feature.properties?.pantavionId || index)}
                      points={pointsToSvg(sampled, mapModel.centerWorld, mapModel.zoom)}
                      fill="rgba(246,200,95,.14)"
                      stroke="#f6c85f"
                      strokeWidth="2"
                      onClick={() => setSelected(feature)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                }

                if (geometryType === "Point") {
                  const position = positions[0];
                  if (!position) return null;
                  const point = projectToViewport(position, mapModel.centerWorld, mapModel.zoom);

                  return (
                    <g
                      key={String(feature.properties?.pantavionId || index)}
                      onClick={() => setSelected(feature)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle cx={point.x} cy={point.y} r="7" fill="#f6c85f" stroke="#071020" strokeWidth="2" />
                    </g>
                  );
                }

                return null;
              })}
            </svg>

            <div style={styles.mapBadge}>
              Ζωντανός χάρτης δρόμων · zoom {mapModel.zoom} · ιδιωτικό δίκτυο
            </div>
          </>
        )}
      </div>

      <div style={styles.footer}>
        <span>Πρωτότυπο KMZ/KML εκτεθειμένο: όχι</span>
        <span>Public folder: όχι</span>
        <span>Πηγή: ιδιωτικό processed GeoJSON</span>
      </div>

      <div style={styles.selected}>
        <strong>Επιλεγμένο στοιχείο</strong>
        {selected ? (
          <div style={styles.selectedBody}>
            <span>{getName(selected, 0)}</span>
            <span>Τύπος: {getAssetType(selected)}</span>
            <span>ID: {String(selected.properties?.pantavionId || "unknown")}</span>
            <span>Κατάσταση: {String(selected.properties?.officialStatus || "pending")}</span>
          </div>
        ) : (
          <span>Πάτα πάνω σε αγωγό, βάνα, παροχή, μετρητή ή περιοχή.</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: 560,
    background: "linear-gradient(135deg, rgba(16,35,68,.92), rgba(5,12,24,.97))",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderBottom: "1px solid rgba(216,224,244,.12)",
  },
  label: {
    margin: "0 0 4px",
    color: "#f6c85f",
    fontSize: 11,
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    margin: 0,
    color: "#fff8e7",
    fontSize: 19,
  },
  meta: {
    margin: "6px 0 0",
    color: "#d8e0f4",
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  smallButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(246,200,95,.35)",
    background: "rgba(255,255,255,.06)",
    color: "#fff8e7",
    fontWeight: 1000,
    fontSize: 18,
  },
  resetButton: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(246,200,95,.35)",
    background: "#f6c85f",
    color: "#071020",
    fontWeight: 1000,
    padding: "0 12px",
  },
  map: {
    position: "relative",
    flex: 1,
    minHeight: 430,
    overflow: "hidden",
    background: "#071020",
  },
  tileLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    filter: "saturate(.75) contrast(.92) brightness(.76)",
  },
  svg: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 430,
    display: "block",
  },
  mapBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(2,4,11,.82)",
    border: "1px solid rgba(246,200,95,.32)",
    color: "#fff8e7",
    fontSize: 12,
    fontWeight: 900,
  },
  empty: {
    position: "absolute",
    inset: 18,
    display: "grid",
    alignContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 22,
    background: "rgba(2,4,11,.72)",
    border: "1px solid rgba(246,200,95,.24)",
    color: "#d8e0f4",
    lineHeight: 1.55,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 12,
    borderTop: "1px solid rgba(216,224,244,.12)",
    color: "#d8e0f4",
    fontSize: 12,
  },
  selected: {
    padding: 14,
    borderTop: "1px solid rgba(216,224,244,.12)",
    color: "#fff8e7",
    display: "grid",
    gap: 8,
  },
  selectedBody: {
    display: "grid",
    gap: 4,
    color: "#d8e0f4",
    fontSize: 13,
  },
};