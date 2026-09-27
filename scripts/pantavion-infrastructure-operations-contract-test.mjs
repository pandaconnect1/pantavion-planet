import assert from "node:assert/strict";

import {
  getPantavionInfrastructureOperationalLayerCatalog,
  pantavionInfrastructureOperationalLayers,
} from "../core/infrastructure/utility/pantavion-infrastructure-operational-layer-catalog.ts";
import {
  PANTAVION_FIELD_OBSERVATION_POLICY,
  getPantavionFieldObservationContract,
} from "../core/infrastructure/utility/pantavion-field-observation-contract.ts";

const catalog = getPantavionInfrastructureOperationalLayerCatalog();
const field = getPantavionFieldObservationContract();

assert.equal(catalog.policy.allExternalLayersOffByDefault, true);
assert.equal(catalog.policy.viewportScopedLoadingRequired, true);
assert.equal(catalog.policy.sourceAttributionRequired, true);
assert.equal(catalog.policy.missingLayerDataNeverMeansUtilityAbsent, true);
assert.equal(catalog.policy.externalReferenceNeverMutatesPantavionMaster, true);
assert.equal(catalog.policy.privateProviderLayersRequireAuthorization, true);
assert.equal(catalog.policy.fieldObservationsRequireReviewBeforeSharedPromotion, true);

for (const layer of pantavionInfrastructureOperationalLayers) {
  assert.equal(
    layer.enabledByDefault,
    false,
    `${layer.id} must remain OFF by default for performance and clarity`,
  );

  if (layer.truthState === "SOURCE_REQUIRED") {
    assert.equal(
      layer.queryable,
      false,
      `${layer.id} must not be queryable before a verified source is connected`,
    );
  }

  if (layer.queryable) {
    assert.ok(
      layer.serviceUrl,
      `${layer.id} queryable layers require an explicit service URL`,
    );
    assert.notEqual(
      layer.sourceLayerId,
      undefined,
      `${layer.id} queryable layers require a provider layer ID`,
    );
  }

  assert.ok(layer.provider.length > 0);
  assert.ok(layer.coverage.length > 0);
  assert.ok(layer.licenseOrAgreement.length > 0);
}

assert.equal(PANTAVION_FIELD_OBSERVATION_POLICY.gpsAccuracyMustBePreserved, true);
assert.equal(
  PANTAVION_FIELD_OBSERVATION_POLICY.observationsNeverMutateProviderMasterDirectly,
  true,
);
assert.equal(
  PANTAVION_FIELD_OBSERVATION_POLICY.reviewRequiredBeforeSharedPromotion,
  true,
);
assert.equal(PANTAVION_FIELD_OBSERVATION_POLICY.offlineQueueCompatible, true);
assert.ok(field.workflow.includes("link_visible_asset_when_known"));
assert.ok(field.workflow.includes("retain_history"));

console.log("Pantavion infrastructure operations contract PASSED.");
