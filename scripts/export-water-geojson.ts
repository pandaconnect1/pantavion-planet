import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Asset {
  number: string;
  street: string;
  area_code: string;
  kind: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

// Cyprus area geocoding defaults (Limassol region)
const LIMASSOL_CENTER = { lat: 34.6749, lng: 33.0382 };
const AREA_CODES: { [key: string]: { lat: number; lng: number } } = {
  '1': { lat: 34.68, lng: 33.04 },    // Central
  '2': { lat: 34.71, lng: 33.03 },    // Upper Polemidia
  '3': { lat: 34.65, lng: 33.03 },    // Lower Polemidia
  '9': { lat: 34.72, lng: 33.05 },    // Northern villages
};

async function exportWaterGeoJSON() {
  console.log('📍 Exporting water network GeoJSON with GPS coordinates...\n');

  // Fetch assets
  const { data: assets, error } = await supabase
    .from('water_network_assets')
    .select('*')
    .limit(1000);

  if (error) {
    console.error('❌ Error fetching assets:', error);
    return;
  }

  if (!assets || assets.length === 0) {
    console.log('⚠️ No assets found');
    return;
  }

  // Create GeoJSON feature collection
  const features = assets.map((asset: Asset) => {
    // Determine coordinates
    let lat = asset.latitude;
    let lng = asset.longitude;

    // If no coordinates, use area-based defaults
    if (!lat || !lng) {
      const areaCode = asset.area_code?.charAt(0) || '1';
      const areaCenter = AREA_CODES[areaCode] || LIMASSOL_CENTER;
      
      // Add small random offset for visualization
      lat = areaCenter.lat + (Math.random() - 0.5) * 0.02;
      lng = areaCenter.lng + (Math.random() - 0.5) * 0.02;
    }

    return {
      type: 'Feature',
      id: asset.number,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON uses [lng, lat]
      },
      properties: {
        number: asset.number,
        street: asset.street,
        area_code: asset.area_code,
        kind: asset.kind,
        name: asset.name,
        dn: asset.dn,
        origin: asset.origin,
      },
    };
  });

  const geojson = {
    type: 'FeatureCollection',
    features: features,
  };

  // Save to file
  const filename = `/tmp/water-assets-${new Date().toISOString().split('T')[0]}.geojson`;
  fs.writeFileSync(filename, JSON.stringify(geojson, null, 2));

  console.log(`✅ GeoJSON exported: ${filename}`);
  console.log(`📊 Features: ${features.length}`);
  console.log(`🗺️ Sample:`);
  console.log(JSON.stringify(features[0], null, 2));

  return geojson;
}

exportWaterGeoJSON().catch(console.error);
