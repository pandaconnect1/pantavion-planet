import assert from "node:assert/strict";
import { postSignInDestination, safeNextPath } from "../lib/auth/flow.ts";

assert.equal(safeNextPath("/profile?tab=privacy"), "/profile?tab=privacy");
assert.equal(safeNextPath("/dashboard#security"), "/dashboard#security");

for (const unsafe of [
  "https://attacker.example",
  "//attacker.example",
  "/\\attacker.example",
  "/%5c%5cattacker.example",
  "/%2f%2fattacker.example",
  "/profile\nLocation:https://attacker.example",
  "%2f%2fattacker.example",
]) {
  assert.equal(safeNextPath(unsafe), "/profile", `unsafe redirect accepted: ${unsafe}`);
}

assert.equal(
  postSignInDestination("email_confirmation_pending", "/dashboard"),
  "/auth/check-email",
);
assert.equal(
  postSignInDestination("profile_completion_required", "/dashboard"),
  "/auth/complete-profile",
);
assert.equal(postSignInDestination("active", "/dashboard"), "/dashboard");
assert.equal(postSignInDestination("minor_protected", "/profile"), "/profile");

for (const blocked of [null, undefined, "manual_review", "rejected", "suspended"]) {
  assert.equal(postSignInDestination(blocked, "/dashboard"), null);
}

console.log("pantavion auth flow: 18 assertions passed");
