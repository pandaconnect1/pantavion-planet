import {
  getPantavionWaterCanonicalSyncContract,
  pantavionWaterCanonicalSyncPolicy,
  pantavionWaterLibraryPolicy,
  pantavionWaterOperationalViews,
} from "../core/infrastructure/water/water-canonical-sync-library-contract.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const contract = getPantavionWaterCanonicalSyncContract();

assert(contract.status === "contract_active_runtime_verification_required", "must not claim LIVE");
assert(pantavionWaterCanonicalSyncPolicy.canonicalNetworkIsSingleSourceOfApprovedTruth, "single canonical network required");
assert(pantavionWaterCanonicalSyncPolicy.approvedChangeRendersOnEveryMapView, "approved changes must render everywhere");
assert(pantavionWaterCanonicalSyncPolicy.originalMapSourcesRemainImmutable, "original sources must remain immutable");
assert(pantavionWaterCanonicalSyncPolicy.accessRoutingServingFixMustNotMutateMapAGeometry, "Map A serving fixes must not mutate geometry");
assert(pantavionWaterOperationalViews.length === 3, "B/C/D operational views required");
assert(pantavionWaterOperationalViews.some(v => v.id === "B_ROADS"), "road view missing");
assert(pantavionWaterOperationalViews.some(v => v.id === "C_TERRAIN"), "terrain view missing");
assert(pantavionWaterOperationalViews.some(v => v.id === "D_CADASTRAL"), "cadastral view missing");
assert(pantavionWaterLibraryPolicy.libraryButtonRequiredBesideMapLayers, "library button contract missing");
assert(pantavionWaterLibraryPolicy.preserveOriginalBeforeAnalysis, "original artifact preservation missing");
assert(pantavionWaterLibraryPolicy.aiMustNotSilentlyPromoteLocationToCanonical, "AI canonical-location guard missing");

console.log("Pantavion water canonical sync/library contract: PASS");
