import assert from "node:assert/strict";
import { planPantavionSelfHealing } from "../core/runtime/safe-self-healing-runtime.ts";

const transient = planPantavionSelfHealing({
  incidentId: "inc_transient",
  kind: "transient_runtime",
  severity: "medium",
  reversible: true,
  retryCount: 0,
  affectsProduction: false,
  evidence: ["timeout"],
});
assert.equal(transient.disposition, "retry_internal");
assert.equal(transient.automaticActionAllowed, true);
assert.equal(transient.retryAllowed, true);
assert.equal(transient.productionMutationAllowed, false);

const drift = planPantavionSelfHealing({
  incidentId: "inc_drift",
  kind: "deployment_drift",
  severity: "high",
  reversible: true,
  retryCount: 1,
  affectsProduction: true,
  evidence: ["revision mismatch"],
});
assert.equal(drift.disposition, "repair_queue");
assert.equal(drift.rollbackRequired, true);
assert.equal(drift.isolateRequired, true);
assert.equal(drift.founderOrSecurityReviewRequired, true);
assert.equal(drift.productionMutationAllowed, false);

const integrity = planPantavionSelfHealing({
  incidentId: "inc_integrity",
  kind: "data_integrity",
  severity: "critical",
  reversible: false,
  retryCount: 0,
  affectsUserData: true,
  affectsProduction: true,
  evidence: ["checksum mismatch"],
});
assert.equal(integrity.disposition, "rollback_and_isolate");
assert.equal(integrity.automaticActionAllowed, false);
assert.equal(integrity.retryAllowed, false);
assert.equal(integrity.isolateRequired, true);
assert.equal(integrity.productionMutationAllowed, false);

const security = planPantavionSelfHealing({
  incidentId: "inc_security",
  kind: "security_event",
  severity: "critical",
  reversible: false,
  retryCount: 0,
  affectsSecrets: true,
  affectsProduction: true,
  evidence: ["credential boundary violation"],
});
assert.equal(security.disposition, "safety_halt");
assert.equal(security.automaticActionAllowed, false);
assert.equal(security.founderOrSecurityReviewRequired, true);
assert.equal(security.productionMutationAllowed, false);

const exhausted = planPantavionSelfHealing({
  incidentId: "inc_exhausted",
  kind: "transient_runtime",
  severity: "medium",
  reversible: true,
  retryCount: 3,
  evidence: ["three failed attempts"],
});
assert.equal(exhausted.disposition, "repair_queue");
assert.equal(exhausted.retryAllowed, false);

console.log(JSON.stringify({
  marker:"pantavion_safe_self_healing_runtime_test_v1",
  ok:true,
  transient:transient.disposition,
  drift:drift.disposition,
  integrity:integrity.disposition,
  security:security.disposition,
  exhausted:exhausted.disposition,
  allProductionMutationAllowed:[
    transient,drift,integrity,security,exhausted
  ].some((item)=>item.productionMutationAllowed)
},null,2));
