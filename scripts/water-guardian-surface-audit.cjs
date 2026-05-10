const fs = require("fs");
const path = require("path");

const root = process.cwd();
let failures = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  failures += 1;
  console.error("[FAIL] " + message);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail("Required file missing: " + relativePath);
    return "";
  }

  pass("Required file exists: " + relativePath);
  return read(relativePath);
}

function requireMarker(content, label, marker) {
  if (content.includes(marker)) {
    pass("Marker present in " + label + ": " + marker);
  } else {
    fail("Marker missing in " + label + ": " + marker);
  }
}

function forbidMarker(content, label, marker) {
  if (content.includes(marker)) {
    fail("Forbidden marker found in " + label + ": " + marker);
  } else {
    pass("Forbidden marker absent in " + label + ": " + marker);
  }
}

console.log("=== Pantavion Water Guardian Surface Audit v6 ===");

const liveClient = requireFile("app/professional/infrastructure/water/live/controlled-water-segment-client.tsx");
const bboxRoute = requireFile("app/api/professional/infrastructure/water/segment/bbox/route.ts");
const addressRoute = requireFile("app/api/professional/infrastructure/water/address/search/route.ts");
const provider = requireFile("core/infrastructure/water/controlled-water-segment-index-provider.ts");

requireMarker(liveClient, "live water map", "Πραγματικός χάρτης δικτύου ύδρευσης");
requireMarker(liveClient, "live water map", "Αναζήτηση διεύθυνσης");
requireMarker(liveClient, "live water map", "Οδός");
requireMarker(liveClient, "live water map", "Αριθμός");
requireMarker(liveClient, "live water map", "Ταχυδρομικός");
requireMarker(liveClient, "live water map", "Διάλεξε σωστή υποψήφια περιοχή");
requireMarker(liveClient, "live water map", "tile.openstreetmap.org");
requireMarker(liveClient, "live water map", "leaflet.geoJSON");
requireMarker(liveClient, "live water map", "invalidateSize");
requireMarker(liveClient, "live water map", "Advanced bbox τεχνικά στοιχεία");
requireMarker(liveClient, "live water map", "/api/professional/infrastructure/water/address/search");
requireMarker(liveClient, "live water map", "/api/professional/infrastructure/water/segment/bbox");

forbidMarker(liveClient, "live water map", "<svg");
forbidMarker(liveClient, "live water map", "viewBox=\"0 0 1000 620\"");
forbidMarker(liveClient, "live water map", "Viewer token");
forbidMarker(liveClient, "live water map", "local_protected_master");

requireMarker(addressRoute, "address search route", "selectedCandidateIdRequired: true");
requireMarker(addressRoute, "address search route", "mayAutoPickAmbiguousAddress: false");
requireMarker(addressRoute, "address search route", "nominatim.openstreetmap.org");
requireMarker(addressRoute, "address search route", "houseNumber");
requireMarker(addressRoute, "address search route", "postalCode");

requireMarker(bboxRoute, "bbox route", "getControlledWaterSegmentFromPrivateIndex");
requireMarker(bboxRoute, "bbox route", "completeNetworkReturned: false");
requireMarker(bboxRoute, "bbox route", "rawMasterReturned: false");

requireMarker(provider, "private index provider", "private_index_from_authentic_kmz");
requireMarker(provider, "private index provider", "sampleAsFinal: false");
requireMarker(provider, "private index provider", "previewAsProduction: false");
requireMarker(provider, "private index provider", "browserFullNetworkLoaded: false");

console.log("Failures: " + failures);

if (failures > 0) {
  process.exit(1);
}
