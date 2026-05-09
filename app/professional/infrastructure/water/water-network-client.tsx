"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type GeoJsonGeometry = {
  type?: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
};

type GeoJsonFeature = {
  type: "Feature";
  geometry?: GeoJsonGeometry;
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
    returnedFeatureCount?: number;
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

type DrawablePart = {
  kind: "line" | "polygon" | "point";
  points: number[][];
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 640;
const TILE_SIZE = 256;
const REQUEST_LIMIT = 1600;
const MAX_POINTS_PER_LINE = 160;
const MAX_POINTS_PER_POLYGON = 160;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isFinitePosition(position: unknown): position is number[] {
  return Array.isArray(position) && Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function extractDrawablePartsFromGeometry(geometry?: GeoJsonGeometry): DrawablePart[] {
  if (!geometry) return [];

  const type = geometry.type || "";
  const coords = geometry.coordinates;

  if (type === "Point" && isFinitePosition(coords)) {
    return [{ kind: "point", points: [coords] }];
  }

  if (type === "MultiPoint" && Array.isArray(coords)) {
    return coords.filter(isFinitePosition).map((point) => ({ kind: "point", points: [point] }));
  }

  if (type === "LineString" && Array.isArray(coords)) {
    const points = coords.filter(isFinitePosition);
    return points.length >= 2 ? [{ kind: "line", points }] : [];
  }

  if (type === "MultiLineString" && Array.isArray(coords)) {
    return coords
      .filter(Array.isArray)
      .map((line) => line.filter(isFinitePosition))
      .filter((points) => points.length >= 2)
      .map((points) => ({ kind: "line", points }));
  }

  if (type === "Polygon" && Array.isArray(coords)) {
    return coords
      .filter(Array.isArray)
      .map((ring) => ring.filter(isFinitePosition))
      .filter((points) => points.length >= 3)
      .map((points) => ({ kind: "polygon", points }));
  }

  if (type === "MultiPolygon" && Array.isArray(coords)) {
    const parts: DrawablePart[] = [];

    for (const polygon of coords) {
      if (!Array.isArray(polygon)) continue;

      for (const ring of polygon) {
        if (!Array.isArray(ring)) continue;

        const points = ring.filter(isFinitePosition);
        if (points.length >= 3) parts.push({ kind: "polygon", points });
      }
    }

    return parts;
  }

  if (type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.flatMap(extractDrawablePartsFromGeometry);
  }

  return [];
}

function extractDrawableParts(feature: GeoJsonFeature): DrawablePart[] {
  return extractDrawablePartsFromGeometry(feature.geometry);
}

function collectPositions(feature: GeoJsonFeature): number[][] {
  return extractDrawableParts(feature).flatMap((part) => part.points);
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
    const topLeft = lonLatToWorld(bounds.minLon, bounds.maxLat, zoom);
    const bottomRight = lonLatToWorld(bounds.maxLon, bounds.minLat, zoom);
    const width = Math.abs(bottomRight.x - topLeft.x);
    const height = Math.abs(bottomRight.y - topLeft.y);

    if (width <= MAP_WIDTH * 1.08 && height <= MAP_HEIGHT * 1.08) return zoom;
  }

  return 14;
}

function getCenter(bounds: Bounds) {
  return {
    lon: (bounds.minLon + bounds.maxLon) / 2,
    lat: (bounds.minLat + bounds.maxLat) / 2,
  };
}

function getAssetType(feature: GeoJsonFeature) {
  return String(feature.properties?.pantavionAssetType || feature.properties?.assetType || "στοιχείο_δικτύου");
}

function getName(feature: GeoJsonFeature, index: number) {
  return String(
    feature.properties?.name ||
      feature.properties?.Name ||
      feature.properties?.pantavionId ||
      `τοιχείο ${index + 1}`
  );
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

      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;

      tiles.push({
        x: wrappedX,
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
  const [view, setView] = useState<ViewState>({ zoomDelta: 0, panX: 0, panY: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/professional/infrastructure/water/network?limit=${REQUEST_LIMIT}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json: GeoJsonCollection) => {
        if (!active) return;
        setData(json);
      })
      .catch(() => {
        if (!active) return;
        setError("δυναμία φόρτωσης ιδιωτικού layer ύδρευσης.");
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
    const baseZoom = Math.max(chooseZoom(bounds), 15);
    const zoom = clamp(baseZoom + view.zoomDelta, 10, 20);
    const baseCenterWorld = lonLatToWorld(center.lon, center.lat, zoom);
    const centerWorld = {
      x: baseCenterWorld.x - view.panX,
      y: baseCenterWorld.y - view.panY,
    };
    const tiles = getTiles(centerWorld, zoom);

    return { center, zoom, centerWorld, tiles };
  }, [bounds, view]);

  const sourceFile = data?.pantavion?.sourceFile || "διωτικό αρχείο δικτύου";
  const totalFeatures = data?.pantavion?.featureCount || features.length;
  const returnedFeatures = data?.pantavion?.returnedFeatureCount || features.length;
  const hasFeatures = features.length > 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <p style={styles.label}>  +   </p>
          <h3 style={styles.title}>
            {!data
              ? "ορτώνει το ιδιωτικό δίκτυο..."
              : hasFeatures
                ? `νεργό layer: ${returnedFeatures} στοιχεία προβολής από ${totalFeatures} συνολικά`
                : "εν βρέθηκαν γεωμετρίες για προβολή"}
          </h3>
          <p style={styles.meta}>{sourceFile}</p>
        </div>

        <div style={styles.modeBadge}>λαφρύ layer · αφή / σύρσιμο / τροχός</div>
      </div>

      <div
        style={styles.map}
        onWheel={(event) => {
          event.preventDefault();
          setView((current) => ({
            ...current,
            zoomDelta: clamp(current.zoomDelta + (event.deltaY < 0 ? 1 : -1), -5, 7),
          }));
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
        {!mapModel && (
          <div style={styles.empty}>
            <strong>εν φαίνεται σωστό δίκτυο ακόμα.</strong>
            <span>{error || "ο layer φορτώθηκε, αλλά δεν βρέθηκαν σχεδιάσιμες γεωμετρίες."}</span>
          </div>
        )}

        {mapModel && (
          <>
            <div style={styles.tileLayer}>
              {mapModel.tiles.map((tile) => (
                <img
                  key={`${mapModel.zoom}-${tile.x}-${tile.y}-${tile.left}-${tile.top}`}
                  src={`https://tile.openstreetmap.org/${mapModel.zoom}/${tile.x}/${tile.y}.png`}
                  alt=""
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    left: tile.left,
                    top: tile.top,
                    opacity: 0.72,
                  }}
                />
              ))}
            </div>

            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              style={styles.svg}
              role="img"
              aria-label="ίκτυο ύδρευσης πάνω σε χάρτη"
            >
              <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="rgba(2,4,11,.10)" />

              {features.flatMap((feature, featureIndex) => {
                const assetType = getAssetType(feature);
                const parts = extractDrawableParts(feature);
                const baseKey = String(feature.properties?.pantavionId || feature.properties?.id || featureIndex);

                return parts.map((part, partIndex) => {
                  const key = `${baseKey}-${part.kind}-${partIndex}`;

                  if (part.kind === "line") {
                    const sampled = samplePositions(part.points, MAX_POINTS_PER_LINE);

                    return (
                      <polyline
                        key={key}
                        points={pointsToSvg(sampled, mapModel.centerWorld, mapModel.zoom)}
                        fill="none"
                        stroke={assetType.includes("central") ? "#fff4b8" : "#ffd15c"}
                        strokeWidth={assetType.includes("central") ? 7 : 4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.98}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(feature);
                        }}
                        style={{
                          cursor: "pointer",
                          filter: "drop-shadow(0 0 5px rgba(255,209,92,.58))",
                        }}
                      />
                    );
                  }

                  if (part.kind === "polygon") {
                    const sampled = samplePositions(part.points, MAX_POINTS_PER_POLYGON);

                    return (
                      <polygon
                        key={key}
                        points={pointsToSvg(sampled, mapModel.centerWorld, mapModel.zoom)}
                        fill="rgba(246,200,95,.12)"
                        stroke="#ffd15c"
                        strokeWidth="2.2"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(feature);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  }

                  const point = projectToViewport(part.points[0], mapModel.centerWorld, mapModel.zoom);

                  return (
                    <circle
                      key={key}
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill="#ffd15c"
                      stroke="#071020"
                      strokeWidth="2"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(feature);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  );
                });
              })}
            </svg>

            <div style={styles.mapBadge}>
              διωτικό δίκτυο ενεργό · zoom {mapModel.zoom} · ελαφρύ mobile layer
            </div>
          </>
        )}
      </div>

      <div style={styles.footer}>
        <span>ρωτότυπο KMZ/KML εκτεθειμένο: όχι</span>
        <span>Public folder: όχι</span>
        <span>ηγή: ιδιωτικό mobile GeoJSON</span>
        <span>λήρες dataset: {totalFeatures} στοιχεία</span>
      </div>

      <div style={styles.selected}>
        <strong>πιλεγμένο στοιχείο</strong>
        {selected ? (
          <div style={styles.selectedBody}>
            <span>{getName(selected, 0)}</span>
            <span>ύπος: {getAssetType(selected)}</span>
            <span>ID: {String(selected.properties?.pantavionId || selected.properties?.id || "unknown")}</span>
          </div>
        ) : (
          <span>άτα πάνω σε αγωγό, βάνα, παροχή, μετρητή ή περιοχή.</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: 650,
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
  modeBadge: {
    alignSelf: "flex-start",
    padding: "9px 11px",
    borderRadius: 999,
    border: "1px solid rgba(69,255,172,.34)",
    background: "rgba(69,255,172,.1)",
    color: "#9cffd2",
    fontSize: 12,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  map: {
    position: "relative",
    flex: 1,
    minHeight: 520,
    overflow: "hidden",
    background: "#071020",
    touchAction: "none",
    cursor: "grab",
  },
  tileLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    filter: "saturate(.75) contrast(.92) brightness(.72)",
  },
  svg: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 520,
    display: "block",
  },
  mapBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(2,4,11,.86)",
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
