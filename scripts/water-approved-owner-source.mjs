export function approvedOwnerSourcePrefix(mapId, requestId) {
  if (!["B", "C"].includes(mapId) ||
      typeof requestId !== "string" ||
      !/^water-map-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    return null;
  }
  return `water-network-private/owner-intake/map-${mapId.toLowerCase()}/${requestId}`;
}

export function approvedOwnerSourceMatches(row, source) {
  const prefix = approvedOwnerSourcePrefix(source.mapId, row?.request_id);
  if (!prefix) return false;
  return (
    row.actor_kind === "admin_session" &&
    row.storage_bucket === "personal-media" &&
    row.storage_path === `${prefix}/manifest.json` &&
    row.sha256 === source.sha256 &&
    Number(row.file_size_bytes) === source.byteSize &&
    row.ingest_state === "uploaded" &&
    row.review_state === "approved" &&
    row.metadata?.ownerSelectedDwgV1 === true &&
    row.metadata?.targetMap === source.mapId &&
    row.metadata?.fullByteVerification === "verified" &&
    row.metadata?.approvedForGISReview === true &&
    row.metadata?.canonicalMutationAllowed === false
  );
}

export function ownerVerifiedMarkerMatches(marker, row, source) {
  return (
    marker?.marker === "pantavion_water_owner_selected_dwg_verified_v1" &&
    marker.requestId === row.request_id &&
    marker.targetMap === source.mapId &&
    marker.sha256 === source.sha256 &&
    Number(marker.sizeBytes) === source.byteSize &&
    marker.header === "AC1032" &&
    marker.approvalRequired === true &&
    marker.canonicalMutationAllowed === false
  );
}
