"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

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
}

export function WaterMapRenderer({
  mapType,
  center = [34.6749, 33.0382], // Limassol coordinates
  zoom = 13,
  showAssets = true,
  showNodes = false,
}: MapRendererProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch assets for this map view
    const fetchAssets = async () => {
      try {
        const response = await fetch(
          `/api/professional/infrastructure/water/assets?limit=500`
        );
        const data = await response.json();
        setAssets(data.assets || []);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
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
          assets.slice(0, 100).map((asset, idx) => (
            <Marker
              key={idx}
              position={[
                parseFloat(asset.latitude || "34.6749"),
                parseFloat(asset.longitude || "33.0382"),
              ]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{asset.number}</p>
                  <p>{asset.street}</p>
                  <p className="text-xs text-gray-600">{asset.kind}</p>
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
}
