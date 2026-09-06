import { evaluateIntentFirewall } from "../core/sovereign/intent-firewall.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const policy = {
  allowedJurisdictions: ["CY", "EU"],
  automaticCapabilities: ["classify", "read"],
  maximumAutomaticCost: 3,
  ownerApprovalRisks: ["high", "critical"],
  requireConsentForSensitiveData: true,
  productionMutationMode: "owner_approval",
  publicExposureMode: "owner_approval",
};

const base = {
  intentId: "firewall_matrix_intent",
  actorId: "founder_test",
  actorKind: "founder",
  jurisdiction: "CY",
  capabilities: ["classify"],
  dataClasses: ["private"],
  estimatedCost: 1,
  risk: "low",
  reversible: true,
  legalConsentRecorded: true,
  writesProduction: false,
  publishesToUsers: false,
  sendsExternalMessage: false,
  changesIdentityOrAccess: false,
};

assert(
  evaluateIntentFirewall(base, policy).disposition === "allow",
  "Safe bounded intent must be allowed.",
);
assert(
  evaluateIntentFirewall({ ...base, estimatedCost: 4 }, policy).disposition === "owner_approval",
  "Cost above the automatic threshold must require owner approval.",
);
assert(
  evaluateIntentFirewall({ ...base, risk: "high" }, policy).disposition === "owner_approval",
  "High-risk intent must require owner approval.",
);
assert(
  evaluateIntentFirewall({ ...base, jurisdiction: "US" }, policy).disposition === "deny",
  "Unapproved jurisdiction must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...base, capabilities: ["deploy"] }, policy).disposition === "deny",
  "Unapproved capability must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...base, dataClasses: ["regulated"], legalConsentRecorded: false }, policy).disposition === "deny",
  "Sensitive data without recorded consent must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...base, sendsExternalMessage: true }).disposition === "deny",
  "External messaging without an explicit policy must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...base, changesIdentityOrAccess: true }).disposition === "owner_approval",
  "Identity or access changes must stop at owner approval.",
);
assert(
  evaluateIntentFirewall({ ...base, writesProduction: true }).disposition === "owner_approval",
  "Production writes must stop at owner approval.",
);

console.log("Sovereign Intent Firewall matrix contract passed.");
