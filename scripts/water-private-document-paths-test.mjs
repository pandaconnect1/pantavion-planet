import assert from "node:assert/strict";

import {
  isWaterPrivateDocumentPath,
  safeWaterDocumentSegment,
  waterPrivateDocumentPath,
  waterPrivateDocumentPrefix,
} from "../core/water/water-private-document-paths.ts";

// Keys must match the historical blob keys byte for byte.
assert.equal(
  waterPrivateDocumentPath("field-submissions", "abc123"),
  "water/private/field-submissions/abc123.json",
);
assert.equal(
  waterPrivateDocumentPath("approved-devices", "device-9"),
  "water/private/approved-devices/device-9.json",
);
assert.equal(
  waterPrivateDocumentPath("fault-approval-inbox/founder-admin", "R-2024-17"),
  "water/private/fault-approval-inbox/founder-admin/R-2024-17.json",
);
assert.equal(
  waterPrivateDocumentPrefix("access-requests"),
  "water/private/access-requests/",
);
assert.equal(
  waterPrivateDocumentPrefix("help-threads", "req-1"),
  "water/private/help-threads/req-1/",
);

// Traversal, separators and control characters must never produce a key.
for (const bad of [
  "..",
  ".",
  "a/b",
  "a\\b",
  "a\u0000b",
  "a\u007f",
  "",
  "   ",
  "x".repeat(201),
  null,
  undefined,
  42,
]) {
  assert.equal(safeWaterDocumentSegment(bad), null, `segment ${String(bad)}`);
  assert.equal(
    waterPrivateDocumentPath("field-submissions", bad),
    null,
    `path ${String(bad)}`,
  );
}

assert.equal(isWaterPrivateDocumentPath("water/private/help-requests/a.json"), true);
for (const bad of [
  "water/private/help-requests/a.txt",
  "other/private/help-requests/a.json",
  "water/private/../secret/a.json",
  "water/private//a.json",
  "water/private/a\u0000.json",
  "",
  null,
]) {
  assert.equal(isWaterPrivateDocumentPath(bad), false, `guard ${String(bad)}`);
}

console.log("water private document paths: PASS");
