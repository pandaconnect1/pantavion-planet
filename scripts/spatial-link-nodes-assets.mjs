#!/usr/bin/env node
/**
 * Link water network nodes to assets via spatial proximity
 * Runs as standalone script - no timeout issues
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function euclideanDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Approximate km to meters (Cyprus ~111km per degree)
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

async function getNodesForArea(minX, maxX, minY, maxY) {
  // Get all nodes in a bounding box
  const query = `
    SELECT node_id, ST_AsText(geom) as geom_wkt
    FROM pantavion_water_stage.node_v3
    WHERE ST_DWithin(
      geom,
      ST_MakeBox2D(
        ST_Point($1, $2),
        ST_Point($3, $4)
      ),
      0.002  -- ~200m buffer
    )
  `;

  const { data, error } = await supabase.rpc("link_nodes_batch", {
    min_x: minX,
    max_x: maxX,
    min_y: minY,
    max_y: maxY,
  } as any);

  if (error) {
    console.error("RPC error:", error);
    return [];
  }

  return data || [];
}

async function linkAssetToNearestNode(asset) {
  const { number, x, y } = asset;

  // Find nearest node using simple distance calc
  // Since we can't do full PostGIS join without timeout,
  // we'll sample nodes in a radius and find closest

  try {
    // Call a stored procedure if available, or raw query
    const { data, error } = await supabase.rpc(
      "find_nearest_node_to_asset",
      {
        asset_x: x,
        asset_y: y,
        radius_degrees: 0.002, // ~200m
      }
    );

    if (!error && data && data.length > 0) {
      const nearest = data[0];
      return {
        asset_number: number,
        nearest_node_id: nearest.node_id,
        distance_meters: nearest.distance_m,
      };
    }
  } catch (err) {
    console.error(`Error linking ${number}:`, err);
  }

  return null;
}

async function batchLinkAssets(startOffset = 0, batchSize = 100) {
  console.log(`📍 Linking assets (batch size: ${batchSize})...`);

  const { data: assets, error: fetchError } = await supabase
    .from("water_network_assets")
    .select("number,x,y,kind")
    .range(startOffset, startOffset + batchSize - 1);

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return 0;
  }

  if (!assets || assets.length === 0) {
    console.log("✅ All assets processed");
    return 0;
  }

  const links = [];

  for (const asset of assets) {
    const link = await linkAssetToNearestNode(asset);
    if (link) {
      links.push(link);
    }

    // Progress
    if (links.length % 50 === 0) {
      console.log(`  ✓ ${links.length} linked so far...`);
    }
  }

  // Bulk upsert
  if (links.length > 0) {
    const { error: upsertError } = await supabase
      .from("water_network_node_asset_links")
      .upsert(links, { onConflict: "asset_number" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return 0;
    }

    console.log(`✓ Upserted ${links.length} links`);
  }

  return links.length;
}

async function main() {
  console.log("🔗 Water Network Node-Asset Spatial Link Job");
  console.log(`Start: ${new Date().toISOString()}`);

  try {
    const batchSize = 100;
    let totalLinked = 0;
    let offset = 0;

    // Process in batches
    while (offset < 11000) {
      // ~10,270 assets total
      const linked = await batchLinkAssets(offset, batchSize);

      if (linked === 0) break;

      totalLinked += linked;
      offset += batchSize;

      // Throttle to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    // Get stats
    const { data: stats } = await supabase.rpc(
      "count_node_asset_links"
    );

    console.log("\n📊 Final Statistics:");
    console.log(`  Total linked: ${totalLinked}`);
    if (stats) {
      console.log(`  Coverage: ${stats[0]?.coverage_pct || 0}%`);
      console.log(`  Within 20m: ${stats[0]?.within_20m || 0}`);
      console.log(`  Within 50m: ${stats[0]?.within_50m || 0}`);
    }

    console.log(`\n✅ Job complete at ${new Date().toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
