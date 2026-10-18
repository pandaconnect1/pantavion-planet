import { NextRequest, NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["valve", "air_valve", "hydrant", "pressure_reducing_valve", "tank"]);
const PAGE = 500;

// Network register (areas and numbered assets from the authentic Map B DWG).
// Same device/role gate as the water maps; rows are read with the service
// role and never exposed without that gate.
export async function GET(request: NextRequest) {
  const access = await authorizeWaterMapRequest(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error, dataReturned: false },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const params = request.nextUrl.searchParams;
  const view = params.get("view") || "assets";
  const admin = createAdminClient();

  try {
    if (view === "areas") {
      const withRing = params.get("ring") === "1";
      const { data, error } = await admin
        .from("water_network_areas")
        .select(withRing
          ? "code, layer, outline, area_m2, centroid_x, centroid_y, bounds, ring, group_name"
          : "code, layer, outline, area_m2, centroid_x, centroid_y, bounds, group_name")
        .order("code");
      if (error) throw error;
      const counts = await admin.rpc("pantavion_water_register_counts");
      return NextResponse.json(
        { ok: true, areas: data ?? [], counts: counts.error ? null : counts.data },
        { headers: { "Cache-Control": "private, max-age=60" } },
      );
    }

    let query = admin
      .from("water_network_assets")
      .select("number, kind, dn, x, y, layer, area_code, street, street_distance, tag, name, capacity_m3, proposed, origin", { count: "exact" });

    const area = params.get("area");
    if (area) query = area === "none" ? query.is("area_code", null) : query.eq("area_code", area);
    const kind = params.get("kind");
    if (kind && KINDS.has(kind)) query = query.eq("kind", kind);
    const street = params.get("street");
    if (street) query = query.eq("street", street);
    const q = (params.get("q") || "").trim().replace(/[%,()]/g, " ").slice(0, 60);
    if (q) query = query.or(`number.ilike.%${q}%,street.ilike.%${q}%,tag.ilike.%${q}%,name.ilike.%${q}%`);

    const bbox = ["minX", "minY", "maxX", "maxY"].map((k) => Number(params.get(k)));
    if (bbox.every(Number.isFinite)) {
      query = query.gte("x", bbox[0]).lte("x", bbox[2]).gte("y", bbox[1]).lte("y", bbox[3]);
    }

    const offset = Math.max(0, Math.min(1_000_000, Number(params.get("offset")) || 0));
    const limit = Math.max(1, Math.min(PAGE * 4, Number(params.get("limit")) || PAGE));
    const { data, error, count } = await query
      .order("area_code", { ascending: true, nullsFirst: false })
      .order("street", { ascending: true, nullsFirst: false })
      .order("number", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return NextResponse.json(
      { ok: true, total: count ?? 0, offset, limit, assets: data ?? [] },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "REGISTER_READ_FAILED", message: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error) },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
