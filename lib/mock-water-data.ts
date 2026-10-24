// Mock water network GeoJSON with realistic Limassol coordinates
import type { WaterGeoFeature } from "@/app/professional/infrastructure/water/types/water";

export const MOCK_WATER_ASSETS: {
  type: "FeatureCollection";
  features: WaterGeoFeature[];
} = {
  type: "FeatureCollection",
  features: Array.from({ length: 500 }, (_, i): WaterGeoFeature => {
    const areas = [
      { code: "1", name: "Κέντρο", lat: 34.6749, lng: 33.0382 },
      { code: "2", name: "Πολεμίδια Ανω", lat: 34.7100, lng: 33.0300 },
      { code: "3", name: "Πολεμίδια Κάτω", lat: 34.6500, lng: 33.0300 },
      { code: "9", name: "Βόρεια χωριά", lat: 34.7200, lng: 33.0500 },
    ];

    const types = ["valve", "hydrant", "tank", "airvalve", "pipe"];
    const streets = [
      "Λεωφόρος Ανδρέα Παπανδρέου",
      "Οδός 28 Οκτωβρίου",
      "Πλατεία Ευκλείδη",
      "Οδός Τσακάλωφ",
      "Λεωφόρος Σπύρου Κυπριανού",
    ];

    const area = areas[i % areas.length];
    const type = types[i % types.length];
    const street = streets[i % streets.length];

    // Add realistic variation within area
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;

    return {
      type: "Feature",
      id: `VAL-${String(i + 1).padStart(5, "0")}`,
      geometry: {
        type: "Point",
        coordinates: [area.lng + lngOffset, area.lat + latOffset],
      },
      properties: {
        number: `${area.code}${String(i % 100).padStart(3, "0")}`,
        street: street,
        area_code: area.code,
        area_name: area.name,
        kind: type,
        name: `${type.toUpperCase()}-${i + 1}`,
        dn: type === "pipe" ? `DN${50 + (i % 300)}` : null,
        origin: "OSM",
        status: Math.random() > 0.95 ? "damaged" : "operational",
      },
    };
  }),
};

export const MOCK_ISOLATION_HINTS: { [key: string]: string[] } = {
  "1001": ["1002", "1003", "1004"], // Closing valve 1001 affects 1002-1004
  "2001": ["2002", "2005"],
  "3001": ["3002", "3003"],
  "9001": ["9002"],
};
