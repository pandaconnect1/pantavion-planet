/**
 * Link water network nodes to assets by spatial proximity
 * Runs as background job to avoid timeout on main queries
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Asset {
  number: string;
  x: number;
  y: number;
  kind: string;
}

interface Node {
  node_id: number;
  geom_wkt: string;
}

async function parseGeomWKT(wkt: string): Promise<{ lon: number; lat: number } | null> {
  // Parse PostGIS WKT like "POINT (32.123456 34.567890)"
  const match = wkt.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/);
  if (!match) return null;
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Approximate meters (rough for Cyprus)
  return Math.sqrt(dx * dx + dy * dy) * 111 * 1000;
}

async function fetchAssets(limit = 10000, offset = 0): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("water_network_assets")
    .select("number,x,y,kind")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []) as Asset[];
}

async function fetchNodes(): Promise<Node[]> {
  const { data, error } = await supabase
    .from("node_v3")
    .select("node_id,geom")
    .range(0, 10000);
  // Note: requires schema prefix in actual query

  if (error) {
    console.error("Failed to fetch nodes:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    node_id: row.node_id,
    geom_wkt: row.geom?.toString() || "",
  }));
}

async function linkAssetsToNodes() {
  console.log("🔗 Starting node-asset spatial link job...");

  try {
    // Fetch all assets in batches
    const batchSize = 500;
    let offset = 0;
    let totalLinked = 0;

    while (true) {
      const assets = await fetchAssets(batchSize, offset);
      if (assets.length === 0) break;

      console.log(`📦 Processing assets ${offset}–${offset + assets.length}...`);

      // For each asset, find nearest node (simplified: in-memory search)
      const links: Array<{ asset_number: string; node_id: number; distance: number }> = [];

      for (const asset of assets) {
        let nearestNode: { node_id: number; distance: number } | null = null;
        const nodes = await supabase.rpc("get_nodes_within_radius", {
          lat: asset.y,
          lon: asset.x,
          radius_m: 100,
        } as any);

        if (!nodes.error && nodes.data && Array.isArray(nodes.data)) {
          const closest = nodes.data[0];
          if (closest) {
            nearestNode = {
              node_id: closest.node_id,
              distance: closest.distance,
            };
          }
        }

        if (nearestNode) {
          links.push({
            asset_number: asset.number,
            node_id: nearestNode.node_id,
            distance: nearestNode.distance,
          });
        }
      }

      // Bulk insert links
      if (links.length > 0) {
        const { error: insertError } = await supabase
          .from("water_network_node_asset_links")
          .upsert(links, { onConflict: "asset_number" });

        if (insertError) {
          console.error("Insert error:", insertError);
        } else {
          console.log(`✓ Linked ${links.length} assets`);
          totalLinked += links.length;
        }
      }

      offset += batchSize;

      // Avoid overwhelming the database
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`✅ Node-asset linking complete: ${totalLinked} assets linked`);
    return { success: true, linked: totalLinked };
  } catch (error) {
    console.error("❌ Link job failed:", error);
    throw error;
  }
}

// Export for worker
export { linkAssetsToNodes };
