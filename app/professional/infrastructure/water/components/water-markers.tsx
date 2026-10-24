"use client";

import L from "leaflet";

// Custom water network marker icons
export const WaterMarkers = {
  valve: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%230066CC' stroke='white' stroke-width='2'/%3E%3Cpath d='M 16 8 L 20 14 L 12 14 Z' fill='white'/%3E%3Crect x='14' y='14' width='4' height='6' fill='white'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-valve-marker",
    }),
    name: "Ρέγουλα (Valve)",
    color: "#0066CC",
  },

  hydrant: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='8' y='6' width='16' height='20' fill='%23E74C3C' stroke='white' stroke-width='2'/%3E%3Ccircle cx='16' cy='14' r='3' fill='white'/%3E%3Crect x='12' y='22' width='8' height='4' fill='white'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-hydrant-marker",
    }),
    name: "Υδροστόμιο (Hydrant)",
    color: "#E74C3C",
  },

  tank: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='16' rx='12' ry='10' fill='%2317A2B8' stroke='white' stroke-width='2'/%3E%3Cpath d='M 4 16 Q 4 20 16 22 Q 28 20 28 16' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-tank-marker",
    }),
    name: "Δεξαμενή (Tank)",
    color: "#17A2B8",
  },

  airvalve: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23F39C12' stroke='white' stroke-width='2'/%3E%3Cpath d='M 16 8 L 18 12 L 14 12 Z' fill='white'/%3E%3Cpath d='M 16 24 L 18 20 L 14 20 Z' fill='white'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-airvalve-marker",
    }),
    name: "Αερική Βάνα (Air Valve)",
    color: "#F39C12",
  },

  pipe: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='12' width='24' height='8' fill='%2327AE60' stroke='white' stroke-width='2' rx='2'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-pipe-marker",
    }),
    name: "Αγωγός (Pipe)",
    color: "#27AE60",
  },

  isolation: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23E74C3C' stroke='white' stroke-width='2'/%3E%3Cpath d='M 10 10 L 22 22 M 22 10 L 10 22' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-isolation-marker",
    }),
    name: "Απομόνωση (Isolation)",
    color: "#E74C3C",
  },

  damage: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23C0392B' stroke='white' stroke-width='2'/%3E%3Ctext x='16' y='20' font-size='16' font-weight='bold' text-anchor='middle' fill='white'%3E!%3C/text%3E%3C/svg%3E",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "water-damage-marker",
    }),
    name: "Ζημιά (Damage)",
    color: "#C0392B",
  },

  node: {
    icon: L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='4' fill='%230066CC' stroke='white' stroke-width='1'/%3E%3C/svg%3E",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -6],
      className: "water-node-marker",
    }),
    name: "Κόμβος (Node)",
    color: "#0066CC",
  },
};

// Helper to get marker by asset type
export const getMarkerByType = (
  assetType: string,
  isIsolation?: boolean
): typeof WaterMarkers.valve => {
  if (isIsolation) return WaterMarkers.isolation;

  const typeMap: { [key: string]: keyof typeof WaterMarkers } = {
    valve: "valve",
    hydrant: "hydrant",
    tank: "tank",
    airvalve: "airvalve",
    pipe: "pipe",
    damage: "damage",
    node: "node",
  };

  return WaterMarkers[typeMap[assetType] || "valve"];
};

// SVG marker builder for custom styling
export const createCustomMarker = (
  color: string,
  label: string,
  size: number = 32
): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'%3E%3Ccircle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 2}' fill='${encodeURIComponent(color)}' stroke='white' stroke-width='2'/%3E%3Ctext x='${size / 2}' y='${size / 2 + 5}' font-size='14' font-weight='bold' text-anchor='middle' fill='white'%3E${label}%3C/text%3E%3C/svg%3E`;
};
