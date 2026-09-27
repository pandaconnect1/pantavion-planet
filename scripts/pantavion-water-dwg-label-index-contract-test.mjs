import assert from "node:assert/strict";

import {
  PANTAVION_WATER_DWG_LABEL_INDEX_POLICY,
  getPantavionWaterDwgLabelIndexContract,
} from "../core/infrastructure/water/water-dwg-label-index-contract.ts";

const contract = getPantavionWaterDwgLabelIndexContract();

assert.equal(contract.id, "pantavion_water_dwg_label_index_v1");
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.verifiedPrivateSourceRequired, true);
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.persistence, "memory_only");
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.rawTextPublicExposureAllowed, false);
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.rawGeometryPersistenceAllowed, false);
assert.equal(
  PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.streetNameInferenceFromGeometryAllowed,
  false,
);
assert.equal(
  PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.gpsToCadOverlayRequiresAlignmentVerified,
  true,
);
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.sourceSwitchMustClearIndex, true);
assert.equal(PANTAVION_WATER_DWG_LABEL_INDEX_POLICY.maximumIndexedLabelsPerOpenDocument, 50000);

console.log("Pantavion Water DWG label index contract PASSED.");
