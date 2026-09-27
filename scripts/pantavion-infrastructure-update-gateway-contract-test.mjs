import assert from "node:assert/strict";

import {
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY,
  PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE,
  PANTAVION_PROVIDER_UPDATE_EXPERIENCE,
  getPantavionInfrastructureUpdateGatewayContract,
} from "../core/infrastructure/utility/pantavion-infrastructure-update-gateway-contract.ts";

const contract = getPantavionInfrastructureUpdateGatewayContract();

assert.equal(contract.id, "pantavion_infrastructure_update_gateway_v1");
assert.equal(contract.version, "1.0.0");

assert.equal(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.noDirectCanonicalMutation,
  true,
);
assert.equal(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.depthAndAccuracyEvidenceMustNeverBeInvented,
  true,
);
assert.equal(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.externalProviderFailureMustNotDeleteExistingCanonicalData,
  true,
);
assert.equal(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.rollbackRequired,
  true,
);
assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.supportedIntakeModes.includes(
    "secure_file_upload",
  ),
);
assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.supportedIntakeModes.includes(
    "provider_webhook",
  ),
);
assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY.supportedIntakeModes.includes(
    "scheduled_api_pull",
  ),
);

assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE.includes(
    "compare_with_current_provider_version",
  ),
);
assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE.includes(
    "generate_spatial_and_attribute_diff",
  ),
);
assert.ok(
  PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE.includes(
    "retain_previous_version_for_rollback",
  ),
);

assert.deepEqual(
  PANTAVION_PROVIDER_UPDATE_EXPERIENCE.noTechnicalIntegrationRequired.steps,
  [
    "choose_dataset",
    "upload_file_or_draw_change",
    "enter_effective_date",
    "optionally_enter_depth_accuracy_or_notes",
    "submit",
  ],
);

assert.equal(
  contract.truth.updatesDoNotMutateCanonicalLayersDirectly,
  true,
);
assert.equal(
  contract.truth.depthAndAccuracyAreFirstClassEvidenceWhenProvided,
  true,
);

console.log("Pantavion infrastructure update gateway contract PASSED.");
