import assert from "node:assert/strict";
import { authorizeWaterValveFieldAction } from "../core/infrastructure/water/water-valve-operational-authorization.ts";

assert.deepEqual(authorizeWaterValveFieldAction(null), {
  ok: false,
  error: "actor_unavailable",
});

assert.deepEqual(
  authorizeWaterValveFieldAction({
    actorId: "device-only",
    role: "FIELD_TECHNICIAN",
    identityVerified: false,
    active: true,
  }),
  { ok: false, error: "actor_identity_unverified" },
);

const technician = authorizeWaterValveFieldAction({
  actorId: "tech-1",
  role: "FIELD_TECHNICIAN",
  identityVerified: true,
  active: true,
});
assert.equal(technician.ok, true);

const supervisor = authorizeWaterValveFieldAction({
  actorId: "supervisor-1",
  role: "SUPERVISOR",
  identityVerified: true,
  active: true,
});
assert.equal(supervisor.ok, true);

const founder = authorizeWaterValveFieldAction({
  actorId: "founder-session",
  role: "FOUNDER",
  identityVerified: true,
  active: true,
});
assert.equal(founder.ok, true);

console.log(JSON.stringify({
  ok: true,
  approvedDeviceAloneIsInsufficient: true,
  verifiedOperationalActorRequired: true,
}));
