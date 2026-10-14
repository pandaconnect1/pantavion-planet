import { approvedOwnerSourceMatches, approvedOwnerSourcePrefix, ownerVerifiedMarkerMatches } from "./water-approved-owner-source.mjs";

export async function findApprovedOwnerSource(admin, source) {
  const { data, error } = await admin.from("water_map_ingest_catalog")
    .select("request_id,actor_kind,storage_bucket,storage_path,sha256,file_size_bytes,ingest_state,review_state,metadata,updated_at")
    .eq("sha256", source.sha256)
    .eq("file_size_bytes", source.byteSize)
    .eq("ingest_state", "uploaded")
    .eq("review_state", "approved")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("owner_source_catalog_read_failed");

  for (const row of data || []) {
    if (!approvedOwnerSourceMatches(row, source)) continue;
    const prefix = approvedOwnerSourcePrefix(source.mapId, row.request_id);
    const { data: markerFile, error: markerError } =
      await admin.storage.from("personal-media").download(prefix + "/verified.json");
    if (markerError || !markerFile) continue;
    let marker;
    try { marker = JSON.parse(await markerFile.text()); } catch { continue; }
    if (!ownerVerifiedMarkerMatches(marker, row, source)) continue;
    return { requestId: row.request_id, prefix, row };
  }
  return null;
}
