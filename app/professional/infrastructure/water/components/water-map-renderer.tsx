"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getMarkerByType } from "./water-markers";
import type { WaterAsset, WaterGeoFeature } from "../types/water";

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

interface MapRendererProps {
  mapType: "A" | "B" | "D";
  center?: [number, number];
  zoom?: number;
  showAssets?: boolean;
  showNodes?: boolean;
  /** Asset numbers to highlight in red as affected by an isolation */
  isolatedAssets?: string[];
  /** Fired when a marker is clicked */
  onAssetSelect?: (assetNumber: string) => void;
}

export function WaterMapRenderer({
  mapType,
  center = [34.6749, 33.0382], // Limassol coordinates
  zoom = 13,
  showAssets = true,
  showNodes = false,
  isolatedAssets = [],
  onAssetSelect,
}: MapRendererProps) {
  const [assets, setAssets] = useState<WaterAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load assets from API or mock data
    const loadAssets = async () => {
      try {
        // Try real API first
        const response = await fetch(
          `/api/professional/infrastructure/water/assets?limit=500`
        );

        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        } else {
          // Fall back to mock data
          const { MOCK_WATER_ASSETS } = await import("@/lib/mock-water-data");
          const features = MOCK_WATER_ASSETS.features.map((f: WaterGeoFeature) => ({
            number: f.properties.number,
            street: f.properties.street,
            area_code: f.properties.area_code,
            kind: f.properties.kind,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            name: f.properties.name,
          }));
          setAssets(features);
        }
      } catch (error) {
        console.error("Failed to load assets, using mock data:", error);
        // Load mock data
        const { MOCK_WATER_ASSETS } = await import("@/lib/mock-water-data");
        const features = MOCK_WATER_ASSETS.features.map((f: WaterGeoFeature) => ({
          number: f.properties.number,
          street: f.properties.street,
          area_code: f.properties.area_code,
          kind: f.properties.kind,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          name: f.properties.name,
        }));
        setAssets(features);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Determine tile provider based on map type
  const getTileLayer = () => {
    switch (mapType) {
      case "B":
        // Authentic DWG - use satellite/terrain
        return (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        );
      case "D":
        // Register - use simple road map
        return (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        );
      case "A":
      default:
        // Live network - use standard map
        return (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Φόρτωση χάρτη...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        {getTileLayer()}
        
        {showAssets && assets.length > 0 && (
          assets.slice(0, 100).map((asset, idx) => {
            const isIsolated = isolatedAssets.includes(asset.number);
            const markerType = getMarkerByType(asset.kind, isIsolated);
            return (
              <Marker
                key={asset.number ?? idx}
                position={[
                  Number(asset.latitude ?? 34.6749),
                  Number(asset.longitude ?? 33.0382),
                ]}
                icon={markerType.icon}
                eventHandlers={{
                  click: () => onAssetSelect?.(asset.number),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{asset.number}</p>
                    <p className="text-gray-700">{asset.street}</p>
                    <p className="text-xs text-gray-600">{asset.kind}</p>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <p className="font-semibold">📍 {markerType.name}</p>
                    </div>
                    {isIsolated && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <p className="font-semibold text-red-700">
                          ⚠️ Επηρεάζεται από απομόνωση
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
