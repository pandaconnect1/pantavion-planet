"use client";

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

function collectPositions(feature: GeoJsonFeature): number[][] {
  const geometry = feature.geometry;
  if (!geometry) return [];

  const coords = geometry.coordinates;

  if (geometry.type === "Point" && Array.isArray(coords)) {
    return [coords as number[]];
  }

  if (geometry.type === "LineString" && Array.isArray(coords)) {
    return coords as number[][];
  }

  if (geometry.type === "Polygon" && Array.isArray(coords)) {
    return (coords as number[][][]).flat();
  }

  return [];
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
  return String(feature.properties?.name || feature.properties?.pantavionId || `Asset ${index + 1}`);
}

function linePath(feature: GeoJsonFeature, bounds: Bounds) {
  const points = collectPositions(feature).map((position) => project(position, bounds));
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function polygonPath(feature: GeoJsonFeature, bounds: Bounds) {
  const points = collectPositions(feature).map((position) => project(position, bounds));
  return points.map((point) => `${point.x},${point.y}`).join(" ");
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
        setError("Unable to load private processed water-network layer.");
      });

    return () => {
      active = false;
    };
  }, []);

  const features = data?.features || [];
  const bounds = useMemo(() => getBounds(features), [features]);
  const sourceFile = data?.pantavion?.sourceFile || "No private source loaded";
  const status = data?.pantavion?.status || "loading";

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <p style={styles.label}>Private processed network layer</p>
          <h3 style={styles.title}>
            {features.length > 0 ? `${features.length} assets/features loaded` : "Waiting for private KML/KMZ conversion"}
          </h3>
          <p style={styles.meta}>{sourceFile}</p>
        </div>
        <span style={features.length > 0 ? styles.goodBadge : styles.warnBadge}>
          {features.length > 0 ? "PRIVATE LAYER ACTIVE" : status}
        </span>
      </div>

      <div style={styles.map}>
        {!bounds && (
          <div style={styles.empty}>
            <strong>No real processed network visible yet.</strong>
            <span>
              Place a real .kml or .kmz file in private-infrastructure/water-network/original/
              and run: node scripts/pantavion-water-kml-to-geojson.cjs
            </span>
            {error ? <span>{error}</span> : null}
          </div>
        )}

        {bounds && (
          <svg viewBox="0 0 1000 620" style={styles.svg} role="img" aria-label="Private processed water network">
            <rect x="0" y="0" width="1000" height="620" fill="rgba(2,4,11,.35)" />

            {features.map((feature, index) => {
              const geometryType = feature.geometry?.type;
              const assetType = getAssetType(feature);

              if (geometryType === "LineString") {
                return (
                  <polyline
                    key={String(feature.properties?.pantavionId || index)}
                    points={linePath(feature, bounds)}
                    fill="none"
                    stroke={assetType === "central_main" ? "#fff1ad" : "#f6c85f"}
                    strokeWidth={assetType === "central_main" ? 7 : 4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.92}
                    onClick={() => setSelected(feature)}
                    style={{ cursor: "pointer" }}
                  />
                );
              }

              if (geometryType === "Polygon") {
                return (
                  <polygon
                    key={String(feature.properties?.pantavionId || index)}
                    points={polygonPath(feature, bounds)}
                    fill="rgba(246,200,95,.12)"
                    stroke="#f6c85f"
                    strokeWidth="2"
                    onClick={() => setSelected(feature)}
                    style={{ cursor: "pointer" }}
                  />
                );
              }

              if (geometryType === "Point") {
                const position = collectPositions(feature)[0];
                if (!position) return null;
                const point = project(position, bounds);

                return (
                  <g
                    key={String(feature.properties?.pantavionId || index)}
                    onClick={() => setSelected(feature)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={point.x} cy={point.y} r="10" fill="#f6c85f" />
                    <text x={point.x + 14} y={point.y + 5} fill="#fff8e7" fontSize="18" fontWeight="700">
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
        <span>Raw file exposed: no</span>
        <span>Public folder: no</span>
        <span>Source: private processed GeoJSON</span>
      </div>

      <div style={styles.selected}>
        <strong>Selected asset</strong>
        {selected ? (
          <div style={styles.selectedBody}>
            <span>{getName(selected, 0)}</span>
            <span>Type: {getAssetType(selected)}</span>
            <span>ID: {String(selected.properties?.pantavionId || "unknown")}</span>
            <span>Status: {String(selected.properties?.officialStatus || "pending")}</span>
          </div>
        ) : (
          <span>Tap/click a real processed pipe, valve, service connection, meter or area.</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: 560,
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
    minHeight: 410,
    overflow: "hidden",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
  },
  svg: {
    width: "100%",
    height: "100%",
    minHeight: 410,
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
