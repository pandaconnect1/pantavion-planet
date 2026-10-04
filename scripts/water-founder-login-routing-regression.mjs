import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const live = await readFile(
  new URL("../app/professional/infrastructure/water/live/controlled-water-segment-client.tsx", import.meta.url),
  "utf8",
);
const adminAccess = await readFile(
  new URL("../app/professional/infrastructure/water/admin/access/page.tsx", import.meta.url),
  "utf8",
);
const segmentRoute = await readFile(
  new URL("../app/api/professional/infrastructure/water/segment/bbox/route.ts", import.meta.url),
  "utf8",
);

assert.match(
  live,
  /href="\/auth\/login\?next=%2Fprofessional%2Finfrastructure%2Fwater%2Flive"/,
  "denied Founder/Admin access must route through canonical Pantavion login",
);
assert.doesNotMatch(
  live,
  /href="\/professional\/infrastructure\/water\/admin\/access\?next=%2Fprofessional%2Finfrastructure%2Fwater%2Flive"/,
  "Water live must not strand an unauthenticated founder on a derived admin-session page",
);
assert.match(
  adminAccess,
  /response\.status === 401[\s\S]*json\.error === "founder_sign_in_required"/,
  "admin access must detect a missing authenticated founder session",
);
assert.match(
  adminAccess,
  /window\.location\.href = `\/auth\/login\?next=\$\{encodeURIComponent\(nextPath\)\}`/,
  "missing founder auth must recover through same-origin canonical login",
);


assert.match(
  segmentRoute,
  /access\.mode === "approved-device" && deviceId && deviceToken/,
  "Founder/Admin segment requests must not fall through to device-only authorization",
);
assert.doesNotMatch(
  segmentRoute,
  /if \(deviceId && deviceToken\) \{/,
  "A valid Founder/Admin segment request must not be denied by an unapproved browser device",
);

console.log("water founder login routing regression: PASS");
