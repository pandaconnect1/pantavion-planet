import assert from "node:assert/strict";

import {
  createBidirectionalTranslationChannel,
  createTranslationJobContract,
  normalizeGlobalConnectHandle,
  planExternalTranslationDispatch,
} from "./foundation-contract.ts";

const normalized = normalizeGlobalConnectHandle("Pantavion.One");
assert.equal(normalized.normalizedHandle, "pantavion.one");
assert.equal(normalized.confusableSkeleton, "pantavion.one");

assert.throws(() => normalizeGlobalConnectHandle("Ρantavion"), /ASCII-only/);
assert.throws(() => normalizeGlobalConnectHandle("sos"), /reserved/);

const channel = createBidirectionalTranslationChannel({
  id: "translation-channel-opaque-id",
  ownerIdentityId: "identity-opaque-id",
  dataBoundary: "private_chat",
  participantALanguage: "el-gr",
  participantBLanguage: "ar",
});

assert.deepEqual(channel.lanes, [
  { id: "a_to_b", sourceLanguage: "el-GR", targetLanguage: "ar" },
  { id: "b_to_a", sourceLanguage: "ar", targetLanguage: "el-GR" },
]);
assert.equal(channel.originalArtifactRule, "immutable_original_separate_translation_records");
assert.throws(
  () =>
    createBidirectionalTranslationChannel({
      ...channel,
      participantALanguage: "el",
      participantBLanguage: "el",
    }),
  /distinct canonical language tags/,
);

const privateWithoutConsent = planExternalTranslationDispatch({
  dataBoundary: "private_chat",
  providerRouteId: "provider-route",
  consent: "not_recorded",
  policyDecision: "approved",
});
assert.deepEqual(privateWithoutConsent, { allowed: false, reason: "private_content_consent_missing" });

const sosPlan = planExternalTranslationDispatch({
  dataBoundary: "sos",
  providerRouteId: "provider-route",
  consent: "granted",
  policyDecision: "approved",
});
assert.deepEqual(sosPlan, { allowed: false, reason: "sos_machine_translation_blocked" });

const approvedPrivatePlan = planExternalTranslationDispatch({
  dataBoundary: "private_chat",
  providerRouteId: "provider-route",
  consent: "granted",
  policyDecision: "approved",
});
assert.deepEqual(approvedPrivatePlan, { allowed: true, reason: "authorized" });

const job = createTranslationJobContract({
  idempotencyKey: "opaque-idempotency-key",
  laneId: "a_to_b",
  artifactId: "immutable-message-reference",
  artifactKind: "text",
  contentHash: "sha256:opaque-content-hash",
  outputKinds: ["text", "subtitle"],
  dispatch: approvedPrivatePlan,
});

assert.equal(job.source.immutableOriginal, true);
assert.equal(Object.isFrozen(job.source), true);
assert.equal(Object.isFrozen(job.outputKinds), true);

console.log("PASS: global-connect foundation contracts");
