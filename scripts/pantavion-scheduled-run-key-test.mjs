import assert from "node:assert/strict";

import { createScheduledRunKey } from "../core/runtime/scheduled-run-key.ts";

assert.equal(
  createScheduledRunKey("pantavion-intelligence-5m", new Date("2026-08-30T18:00:00.000Z"), 5),
  "pantavion-intelligence-5m:2026-08-30T18:00",
);
assert.equal(
  createScheduledRunKey("pantavion-intelligence-5m", new Date("2026-08-30T18:04:59.999Z"), 5),
  "pantavion-intelligence-5m:2026-08-30T18:00",
);
assert.equal(
  createScheduledRunKey("pantavion-intelligence-5m", new Date("2026-08-30T18:05:00.000Z"), 5),
  "pantavion-intelligence-5m:2026-08-30T18:05",
);
assert.equal(
  createScheduledRunKey("pantavion-intelligence-5m", new Date("2026-08-30T18:59:59.999Z"), 5),
  "pantavion-intelligence-5m:2026-08-30T18:55",
);
assert.equal(
  createScheduledRunKey("legacy-hourly", new Date("2026-08-30T18:59:59.999Z")),
  "legacy-hourly:2026-08-30T18",
  "default hourly run-key compatibility must remain unchanged",
);
assert.throws(
  () => createScheduledRunKey("pantavion-intelligence-5m", new Date("2026-08-30T18:00:00Z"), 7),
  /scheduled_worker_bucket_minutes_invalid/,
);
assert.throws(
  () => createScheduledRunKey(" ", new Date("2026-08-30T18:00:00Z"), 5),
  /scheduled_worker_name_required/,
);

console.log("Pantavion scheduled run-key contract: PASS");
console.log("Five-minute buckets: PASS");
console.log("Hourly compatibility: PASS");
