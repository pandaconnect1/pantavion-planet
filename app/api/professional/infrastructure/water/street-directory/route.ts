import { NextRequest, NextResponse } from "next/server";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";
import postalSource from "@/data/water/limassol-postal-source-2024.json";
import { readWaterDiscoveryPage } from "@/core/infrastructure/water/water-discovery-stream";
import { postalDirectoryRows, drawingStreetRows, fieldStreetRows, mergeStreetSources, streetDirectoryPage, type DirectoryStreet } from "@/core/infrastructure/water/water-street-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const sourceSha256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";
const official = postalDirectoryRows(postalSource);
type Base = { rows: DirectoryStreet[]; warnings: string[]; drawingLabels: number };
// Common source data only. Authorization runs before every cache access.
let sourceCache: { expires: number; promise: Promise<Base> } | null = null;

async function readAll(query: (offset: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>) {
  const rows: Array<Record<string, unknown>> = [];
  for (let offset = 0; offset < 100000; offset += 1000) {
    const result = await query(offset);
    if (result.error || !Array.isArray(result.data)) throw new Error("street_source_read_failed");
    rows.push(...result.data as Array<Record<string, unknown>>);
    if (result.data.length < 1000) return rows;
  }
  throw new Error("street_source_exceeds_verified_limit");
}

async function readBase(admin: ReturnType<typeof createAdminClient>): Promise<Base> {
  const warnings: string[] = [];
  const [legacyResult, drawingResult] = await Promise.allSettled([
    readAll((offset) => admin.from("pantavion_cyprus_streets")
      .select("id,name_el,name_lat,district_name,municipality_or_community,area_or_parish,zone_or_section,postal_codes,source,source_ref,status")
      .in("district_name", ["Lemesos","Limassol","Λεμεσός","ΛΕΜΕΣΟΣ"]).order("id").range(offset,offset+999)),
    (async () => {
      const [file, areas] = await Promise.all([
        admin.storage.from("personal-media").download(`water-network-private/derived/map-b/${sourceSha256}/discovery.jsonl.gz`),
        admin.from("water_network_areas").select("code,outline,ring,bounds").order("code").limit(1000),
      ]);
      if (file.error || !file.data || areas.error) throw new Error("drawing_streets_unavailable");
      const page = await readWaterDiscoveryPage(file.data, { sourceSha256, q:"", category:"street", hidden:false, unmatched:false, offset:0, limit:50000 });
      if (page.items.length !== page.total) throw new Error("drawing_street_catalogue_incomplete");
      return { rows: drawingStreetRows(page.items, areas.data || []), labels: page.total };
    })(),
  ]);
  if (legacyResult.status === "rejected") warnings.push("Το πρόσθετο μητρώο οδών δεν φορτώθηκε. Ο επίσημος κατάλογος παραμένει διαθέσιμος.");
  if (drawingResult.status === "rejected") warnings.push("Οι επιγραφές του DWG δεν φορτώθηκαν. Δεν περιλαμβάνονται στα τρέχοντα αποτελέσματα.");
  return { rows: mergeStreetSources(official, legacyResult.status === "fulfilled" ? legacyResult.value : [], drawingResult.status === "fulfilled" ? drawingResult.value.rows : [], []), warnings, drawingLabels: drawingResult.status === "fulfilled" ? drawingResult.value.labels : 0 };
}

export async function GET(request: NextRequest) {
  const access = await authorizeWaterMapRequest(request);
  if (!access.ok) return NextResponse.json({ ok:false,error:access.error,dataReturned:false },{status:403,headers:{"Cache-Control":"no-store"}});
  try {
    const admin = createAdminClient();
    if (!sourceCache || sourceCache.expires < Date.now()) sourceCache = { expires: Date.now()+60000, promise: readBase(admin) };
    const base = await sourceCache.promise;
    const warnings = [...base.warnings];
    let field: DirectoryStreet[] = [];
    try {
      const patches = await readAll((offset) => admin.from("water_spatial_patches")
        .select("patch_id,asset_type,status,street_name,area,attributes,geometry,source_key")
        .eq("asset_type","road_reference").in("status",["pending_review","approved_overlay","officialization_candidate","officialized"])
        .order("patch_id").range(offset,offset+999));
      field = fieldStreetRows(patches);
    } catch { warnings.push("Οι νεότερες οδοί χρηστών δεν φορτώθηκαν. Πατήστε ανανέωση."); }
    const p = request.nextUrl.searchParams;
    const page = streetDirectoryPage([...base.rows,...field], { q:(p.get("q")||"").slice(0,200), locality:(p.get("locality")||"").slice(0,150), source:(p.get("source")||"").slice(0,30),
      offset:Math.max(0,Math.min(100000,Math.floor(Number(p.get("offset"))||0))), limit:Math.max(1,Math.min(500,Math.floor(Number(p.get("limit"))||200))) });
    return NextResponse.json({ok:true,...page,warnings,partial:warnings.length>0,fullCoverageVerified:false,
      coverage:{officialStreetLocalityPairs:official.length,postalSourceRows:postalSource.rows.length,streetLocalities:postalSource.places.length,allLocalities:postalSource.localities.length,drawingLabels:base.drawingLabels,postalPublishedAt:postalSource.publishedAt,postalSourceSha256:postalSource.sha256},
      localities:postalSource.localities,sourceUrl:postalSource.datasetUrl,license:"CC BY 4.0",refreshedAt:new Date().toISOString(),
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch {
    sourceCache = null;
    return NextResponse.json({ok:false,error:"STREET_DIRECTORY_READ_FAILED"},{status:500,headers:{"Cache-Control":"no-store"}});
  }
}
