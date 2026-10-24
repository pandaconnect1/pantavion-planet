"use client";

import type { Icon } from "leaflet";

/**
 * Marker descriptors for the water network.
 *
 * NOTE: this module must NOT import leaflet at module scope — leaflet touches
 * `window` on import, which breaks server prerendering. Icons are built lazily
 * in the browser by `getMarkerByType`.
 */
export interface MarkerSpec {
  iconUrl: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  popupAnchor: [number, number];
  className: string;
  name: string;
  color: string;
}

const svg = (body: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E${body}%3C/svg%3E`;

export const WaterMarkerSpecs: Record<string, MarkerSpec> = {
  valve: {
    iconUrl: svg(
      "%3Ccircle cx='16' cy='16' r='14' fill='%230066CC' stroke='white' stroke-width='2'/%3E%3Cpath d='M 16 8 L 20 14 L 12 14 Z' fill='white'/%3E%3Crect x='14' y='14' width='4' height='6' fill='white'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-valve-marker",
    name: "Ρέγουλα (Valve)",
    color: "#0066CC",
  },
  hydrant: {
    iconUrl: svg(
      "%3Crect x='8' y='6' width='16' height='20' fill='%23E74C3C' stroke='white' stroke-width='2'/%3E%3Ccircle cx='16' cy='14' r='3' fill='white'/%3E%3Crect x='12' y='22' width='8' height='4' fill='white'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-hydrant-marker",
    name: "Υδροστόμιο (Hydrant)",
    color: "#E74C3C",
  },
  tank: {
    iconUrl: svg(
      "%3Cellipse cx='16' cy='16' rx='12' ry='10' fill='%2317A2B8' stroke='white' stroke-width='2'/%3E%3Cpath d='M 4 16 Q 4 20 16 22 Q 28 20 28 16' fill='none' stroke='white' stroke-width='2'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-tank-marker",
    name: "Δεξαμενή (Tank)",
    color: "#17A2B8",
  },
  airvalve: {
    iconUrl: svg(
      "%3Ccircle cx='16' cy='16' r='12' fill='%23F39C12' stroke='white' stroke-width='2'/%3E%3Cpath d='M 16 8 L 18 12 L 14 12 Z' fill='white'/%3E%3Cpath d='M 16 24 L 18 20 L 14 20 Z' fill='white'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-airvalve-marker",
    name: "Αερική Βάνα (Air Valve)",
    color: "#F39C12",
  },
  pipe: {
    iconUrl: svg(
      "%3Crect x='4' y='12' width='24' height='8' fill='%2327AE60' stroke='white' stroke-width='2' rx='2'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-pipe-marker",
    name: "Αγωγός (Pipe)",
    color: "#27AE60",
  },
  isolation: {
    iconUrl: svg(
      "%3Ccircle cx='16' cy='16' r='12' fill='%23E74C3C' stroke='white' stroke-width='2'/%3E%3Cpath d='M 10 10 L 22 22 M 22 10 L 10 22' stroke='white' stroke-width='2'/%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-isolation-marker",
    name: "Απομόνωση (Isolation)",
    color: "#E74C3C",
  },
  damage: {
    iconUrl: svg(
      "%3Ccircle cx='16' cy='16' r='12' fill='%23C0392B' stroke='white' stroke-width='2'/%3E%3Ctext x='16' y='20' font-size='16' font-weight='bold' text-anchor='middle' fill='white'%3E!%3C/text%3E"
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "water-damage-marker",
    name: "Ζημιά (Damage)",
    color: "#C0392B",
  },
  node: {
    iconUrl: svg(
      "%3Ccircle cx='16' cy='16' r='4' fill='%230066CC' stroke='white' stroke-width='1'/%3E"
    ),
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
    className: "water-node-marker",
    name: "Κόμβος (Node)",
    color: "#0066CC",
  },
};

export interface ResolvedMarker {
  icon: Icon | undefined;
  name: string;
  color: string;
}

/** Cache so we build each leaflet Icon only once per browser session. */
const iconCache = new Map<string, Icon>();

/**
 * Resolve an asset kind to a leaflet icon. Returns `icon: undefined` on the
 * server (leaflet is only imported in the browser), which makes the <Marker>
 * fall back to leaflet's default until hydration.
 */
export function getMarkerByType(
  assetKind: string,
  isIsolation?: boolean
): ResolvedMarker {
  const key = isIsolation ? "isolation" : assetKind in WaterMarkerSpecs ? assetKind : "valve";
  const spec = WaterMarkerSpecs[key];

  if (typeof window === "undefined") {
    return { icon: undefined, name: spec.name, color: spec.color };
  }

  let icon = iconCache.get(key);
  if (!icon) {
    // Require at call time, in the browser only.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    icon = L.icon({
      iconUrl: spec.iconUrl,
      iconSize: spec.iconSize,
      iconAnchor: spec.iconAnchor,
      popupAnchor: spec.popupAnchor,
      className: spec.className,
    }) as Icon;
    iconCache.set(key, icon);
  }

  return { icon, name: spec.name, color: spec.color };
}
