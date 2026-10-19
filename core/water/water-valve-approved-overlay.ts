/** Read-only adapter for approved spatial valve overlays; never writes CAD. */
import type { PantavionWaterSpatialChangePatch } from "../infrastructure/water/water-spatial-change-patch-contract";
import type { WaterMapKey } from "./water-valve-crossmap-registry";

export type ValveMapOverlay = {
  patchId: string;
  map: WaterMapKey;
  longitude: number;
  latitude: number;
  source: "approved_overlay";
  assetId: string;
};
export type ValveOverlayResult = { overlays: ValveMapOverlay[]; skipped: {patchId:string;reason:string}[] };

/**
 * Only already-approved point valves in EPSG:4326 can be displayed directly.
 * Other CRSs must be transformed using a verified GIS pipeline, not guessed.
 * Does not mutate patches, original DWGs, or any map component.
 */
export function buildApprovedValveOverlays(
  patches: readonly PantavionWaterSpatialChangePatch[],
): ValveOverlayResult {
  const overlays: ValveMapOverlay[] = [];
  const skipped: ValveOverlayResult["skipped"] = [];
  const maps: WaterMapKey[] = ["A", "B", "C", "D", "E"];
  for (const patch of patches) {
    if (patch.assetType !== "valve" || patch.operation !== "create" ||
        !["approved_overlay", "officialized"].includes(patch.status)) continue;
    if (patch.geometry.type !== "Point" || patch.geometry.crs.authority !== "EPSG" ||
        patch.geometry.crs.code !== "4326") {
      skipped.push({patchId:patch.patchId,reason:"verified_wgs84_point_required"});
      continue;
    }
    const [longitude, latitude] = patch.geometry.coordinates as [number,number];
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) ||
        Math.abs(longitude)>180 || Math.abs(latitude)>90) {
      skipped.push({patchId:patch.patchId,reason:"invalid_coordinates"});
      continue;
    }
    const assetId = patch.attributes.officialAssetId ?? patch.attributes.pantavionAssetId;
    if (!assetId?.trim()) {
      skipped.push({patchId:patch.patchId,reason:"asset_identity_required"});
      continue;
    }
    for (const map of maps) overlays.push({
      patchId:patch.patchId,map,longitude,latitude,source:"approved_overlay",assetId,
    });
  }
  return {overlays,skipped};
}
