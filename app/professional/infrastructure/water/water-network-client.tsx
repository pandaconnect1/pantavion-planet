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

const MAX_RENDER_FEATURES = 900;
const MAX_POINTS_PER_LINE = 180;
const MAX_POINTS_PER_POLYGON = 220;

const el = {
  privateLayer: "\u0399\u0394\u0399\u03A9\u03A4\u0399\u039A\u039F \u0395\u03A0\u0395\u039E\u0395\u03A1\u0393\u0391\u03A3\u039C\u0395\u039D\u039F LAYER \u0394\u0399\u039A\u03A4\u03A5\u039F\u03A5",
  loadingTitle: "\u03A6\u03BF\u03C1\u03C4\u03CE\u03BD\u03B5\u03B9 \u03C4\u03BF \u03B9\u03B4\u03B9\u03C9\u03C4\u03B9\u03BA\u03CC \u03B4\u03AF\u03BA\u03C4\u03C5\u03BF...",
  waitingTitle: "\u0391\u03BD\u03B1\u03BC\u03BF\u03BD\u03AE \u03B3\u03B9\u03B1 \u03BC\u03B5\u03C4\u03B1\u03C4\u03C1\u03BF\u03C0\u03AE KML/KMZ",
  noSource: "\u0394\u03B5\u03BD \u03AD\u03C7\u03B5\u03B9 \u03C6\u03BF\u03C1\u03C4\u03C9\u03B8\u03B5\u03AF \u03B9\u03B4\u03B9\u03C9\u03C4\u03B9\u03BA\u03CC \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF",
  active: "\u0395\u039D\u0395\u03A1\u0393\u039F \u0399\u0394\u0399\u03A9\u03A4\u0399\u039A\u039F LAYER",
  mobileSafe: "\u0395\u039B\u0391\u03A6\u03A1\u0399\u0391 \u03A0\u03A1\u039F\u0392\u039F\u039B\u0397 \u039A\u0399\u039D\u0397\u03A4\u039F\u03A5",
  emptyTitle: "\u0394\u03B5\u03BD \u03C6\u03B1\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B1\u03BA\u03CC\u03BC\u03B1 \u03B5\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03BC\u03AD\u03BD\u03BF \u03B4\u03AF\u03BA\u03C4\u03C5\u03BF.",
  emptyText: "\u0392\u03AC\u03BB\u03B5 \u03C0\u03C1\u03B1\u03B3\u03BC\u03B1\u03C4\u03B9\u03BA\u03CC .kml \u03AE .kmz \u03C3\u03C4\u03BF private-infrastructure/water-network/original/ \u03BA\u03B1\u03B9 \u03C4\u03C1\u03AD\u03BE\u03B5: node scripts/pantavion-water-kml-to-geojson.cjs",
  rawNo: "\u03A0\u03C1\u03C9\u03C4\u03CC\u03C4\u03C5\u03C0\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF \u03B5\u03BA\u03C4\u03B5\u03B8\u03B5\u03B9\u03BC\u03AD\u03BD\u03BF: \u03CC\u03C7\u03B9",
  publicNo: "Public folder: \u03CC\u03C7\u03B9",
  sourcePrivate: "\u03A0\u03B7\u03B3\u03AE: \u03B9\u03B4\u03B9\u03C9\u03C4\u03B9\u03BA\u03CC processed GeoJSON",
  selectedAsset: "\u0395\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03BF \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF",
  tapAsset: "\u03A0\u03AC\u03C4\u03B1 \u03C3\u03B5 \u03B1\u03B3\u03C9\u03B3\u03CC, \u03B2\u03AC\u03BD\u03B1, \u03C0\u03B1\u03C1\u03BF\u03C7\u03AE, \u03BC\u03B5\u03C4\u03C1\u03B7\u03C4\u03AE \u03AE \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AE.",
  type: "\u03A4\u03CD\u03C0\u03BF\u03C2",
  status: "\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7",
  rendered: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7",
  from: "\u03B1\u03C0\u03CC",
  features: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1",
  error: "\u0391\u03B4\u03C5\u03BD\u03B1\u03BC\u03AF\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2 \u03B9\u03B4\u03B9\u03C9\u03C4\u03B9\u03BA\u03BF\u03CD layer \u03CD\u03B4\u03C1\u03B5\u03C5\u03C3\u03B7\u03C2.",
};

function isFinitePosition(position: unknown): position is number[] {
  return (
    Array.isArray(position) &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1])
  );
}

function collectPositions(feature: GeoJsonFeature): number[][] {
  const geometry = feature.geometry;
  if (!geometry) return [];

  const coords = geometry.coordinates;

  if (geometry.type === "Point" && isFinitePosition(coords)) {
    return [coords];
  }

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
    const positions = collectPositions(feature);

    for (const position of positions) {
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

  return {
    minLon,
    maxLon,
    minLat,
    maxLat,
  };
}

function project(position: number[], bounds: Bounds) {
  const width = 1000;
  const height = 620;
  const lonSpan = bounds.maxLon - bounds.minLon || 0.000001;
  const latSpan = bounds.maxLat - bounds.minLat || 0.000001;

  const x = ((position[0] - bounds.minLon) / lonSpan) * width;
  const y = height - ((position[1] - bounds.minLat) / latSpan) * height;

  return { x, y };
}

function getAssetType(feature: GeoJsonFeature) {
  return String(feature.properties?.pantavionAssetType || "unknown_asset");
}

function getName(feature: GeoJsonFeature, index: number) {
  return String(
    feature.properties?.name ||
      feature.properties?.pantavionId ||
      `Asset ${index + 1}`
  );
}

function pointsToSvg(points: number[][], bounds: Bounds) {
  return points
    .map((position) => {
      const point = project(position, bounds);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

export default function WaterNetworkClient() {
  const [data, setData] = useState<GeoJsonCollection | null>(null);
  const [selected, setSelected] = useState<GeoJsonFeature | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/professional/infrastructure/water/network", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json: GeoJsonCollection) => {
        if (!active) return;
        setData(json);
      })
      .catch(() => {
        if (!active) return;
        setError(el.error);
      });

    return () => {
      active = false;
    };
  }, []);

  const features = data?.features || [];
  const bounds = useMemo(() => getBounds(features), [features]);

  const renderFeatures = useMemo(() => {
    return features.slice(0, MAX_RENDER_FEATURES);
  }, [features]);

  const sourceFile = data?.pantavion?.sourceFile || el.noSource;
  const status = data?.pantavion?.status || "loading";
  const hasFeatures = features.length > 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <p style={styles.label}>{el.privateLayer}</p>
          <h3 style={styles.title}>
            {!data
              ? el.loadingTitle
              : hasFeatures
                ? `${el.rendered} ${renderFeatures.length} ${el.from} ${features.length} ${el.features}`
                : el.waitingTitle}
          </h3>
          <p style={styles.meta}>{sourceFile}</p>
        </div>
        <span style={hasFeatures ? styles.goodBadge : styles.warnBadge}>
          {hasFeatures ? el.mobileSafe : status}
        </span>
      </div>

      <div style={styles.map}>
        {!bounds && (
          <div style={styles.empty}>
            <strong>{el.emptyTitle}</strong>
            <span>{el.emptyText}</span>
            {error ? <span>{error}</span> : null}
          </div>
        )}

        {bounds && (
          <svg
            viewBox="0 0 1000 620"
            style={styles.svg}
            role="img"
            aria-label="Private processed water network"
          >
            <rect x="0" y="0" width="1000" height="620" fill="rgba(2,4,11,.35)" />

            {renderFeatures.map((feature, index) => {
              const geometryType = feature.geometry?.type;
              const assetType = getAssetType(feature);
              const positions = collectPositions(feature);

              if (geometryType === "LineString") {
                const sampled = samplePositions(positions, MAX_POINTS_PER_LINE);

                return (
                  <polyline
                    key={String(feature.properties?.pantavionId || index)}
                    points={pointsToSvg(sampled, bounds)}
                    fill="none"
                    stroke={assetType === "central_main" ? "#fff1ad" : "#f6c85f"}
                    strokeWidth={assetType === "central_main" ? 6 : 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.88}
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
                    points={pointsToSvg(sampled, bounds)}
                    fill="rgba(246,200,95,.12)"
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
                const point = project(position, bounds);

                return (
                  <g
                    key={String(feature.properties?.pantavionId || index)}
                    onClick={() => setSelected(feature)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={point.x} cy={point.y} r="8" fill="#f6c85f" />
                    <text
                      x={point.x + 12}
                      y={point.y + 5}
                      fill="#fff8e7"
                      fontSize="16"
                      fontWeight="700"
                    >
                      {assetType === "valve" ? "V" : assetType === "meter" ? "M" : "P"}
                    </text>
                  </g>
                );
              }

              return null;
            })}
          </svg>
        )}
      </div>

      <div style={styles.footer}>
        <span>{el.rawNo}</span>
        <span>{el.publicNo}</span>
        <span>{el.sourcePrivate}</span>
        {hasFeatures ? <span>{el.active}</span> : null}
      </div>

      <div style={styles.selected}>
        <strong>{el.selectedAsset}</strong>
        {selected ? (
          <div style={styles.selectedBody}>
            <span>{getName(selected, 0)}</span>
            <span>
              {el.type}: {getAssetType(selected)}
            </span>
            <span>ID: {String(selected.properties?.pantavionId || "unknown")}</span>
            <span>
              {el.status}: {String(selected.properties?.officialStatus || "pending")}
            </span>
          </div>
        ) : (
          <span>{el.tapAsset}</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: 500,
    background: "linear-gradient(135deg, rgba(16,35,68,.9), rgba(5,12,24,.96))",
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
  goodBadge: {
    height: "fit-content",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(69,255,172,.1)",
    border: "1px solid rgba(69,255,172,.36)",
    color: "#9cffd2",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  warnBadge: {
    height: "fit-content",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,180,72,.1)",
    border: "1px solid rgba(255,180,72,.36)",
    color: "#ffd89a",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  map: {
    position: "relative",
    flex: 1,
    minHeight: 360,
    overflow: "hidden",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
  },
  svg: {
    width: "100%",
    height: "100%",
    minHeight: 360,
    display: "block",
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
