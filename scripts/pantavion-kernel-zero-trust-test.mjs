import assert from "node:assert/strict";
import { evaluateKernelZeroTrustAccess } from "../kernel/zero-trust.ts";

const now = Date.parse("2026-08-27T16:00:00.000Z");
const basePrincipal = {
  id: "kernel-social-1",
  type: "kernel",
  authenticated: true,
  credentialExpiresAt: "2026-08-27T17:00:00.000Z",
  tenantId: "tenant-a",
  workloadIdentityVerified: true,
  grants: [
    {
      grantId: "grant-social-read",
      actions: ["read"],
      resourceIds: ["social.profile"],
      environments: ["staging"],
    },
  ],
};

const baseRequest = {
  requestId: "req-1",
  principal: basePrincipal,
  resource: {
    id: "social.profile",
    tenantId: "tenant-a",
    environment: "staging",
    sensitivity: "confidential",
  },
  action: "read",
  transportAuthenticated: true,
  jurisdictionAllowed: true,
  agePolicyAllowed: true,
};

const allowed = evaluateKernelZeroTrustAccess(baseRequest, now);
assert.equal(allowed.allowed, true);
assert.equal(allowed.matchedGrantId, "grant-social-read");
assert.deepEqual(allowed.reasons, []);

const unauthenticated = evaluateKernelZeroTrustAccess(
  { ...baseRequest, principal: { ...basePrincipal, authenticated: false } },
  now,
);
assert.equal(unauthenticated.allowed, false);
assert.ok(unauthenticated.reasons.includes("principal_not_authenticated"));

const expired = evaluateKernelZeroTrustAccess(
  {
    ...baseRequest,
    principal: { ...basePrincipal, credentialExpiresAt: "2026-08-27T15:59:59.000Z" },
  },
  now,
);
assert.equal(expired.allowed, false);
assert.ok(expired.reasons.includes("credential_expired"));

const unverifiedWorkload = evaluateKernelZeroTrustAccess(
  { ...baseRequest, principal: { ...basePrincipal, workloadIdentityVerified: false } },
  now,
);
assert.equal(unverifiedWorkload.allowed, false);
assert.ok(unverifiedWorkload.reasons.includes("workload_identity_not_verified"));

const crossTenant = evaluateKernelZeroTrustAccess(
  {
    ...baseRequest,
    resource: { ...baseRequest.resource, tenantId: "tenant-b" },
  },
  now,
);
assert.equal(crossTenant.allowed, false);
assert.ok(crossTenant.reasons.includes("tenant_isolation_denied"));

const ownerWithoutGrant = evaluateKernelZeroTrustAccess(
  {
    ...baseRequest,
    principal: {
      id: "owner-1",
      type: "owner",
      authenticated: true,
      credentialExpiresAt: "2026-08-27T17:00:00.000Z",
      tenantId: "tenant-a",
      grants: [],
    },
  },
  now,
);
assert.equal(ownerWithoutGrant.allowed, false);
assert.ok(ownerWithoutGrant.reasons.includes("scoped_grant_missing"));

const explicitDeny = evaluateKernelZeroTrustAccess(
  { ...baseRequest, explicitlyDenied: true },
  now,
);
assert.equal(explicitDeny.allowed, false);
assert.ok(explicitDeny.reasons.includes("explicit_deny"));

console.log("Pantavion kernel zero-trust contract: PASS");
