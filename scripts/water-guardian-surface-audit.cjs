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

console.log("=== Pantavion Water Guardian Surface Audit v8 ===");

const liveClient = requireFile("app/professional/infrastructure/water/live/controlled-water-segment-client.tsx");
const addressRoute = requireFile("app/api/professional/infrastructure/water/address/search/route.ts");
const bboxRoute = requireFile("app/api/professional/infrastructure/water/segment/bbox/route.ts");
const layout = requireFile("app/layout.tsx");

requireMarker(layout, "app layout", "leaflet/dist/leaflet.css");

requireMarker(liveClient, "live water map", "Χάρτης δικτύου ύδρευσης");
requireMarker(liveClient, "live water map", "Αναζήτηση διεύθυνσης");
requireMarker(liveClient, "live water map", "Οδός");
requireMarker(liveClient, "live water map", "Αριθμός");
requireMarker(liveClient, "live water map", "Περιοχή / Δήμος");
requireMarker(liveClient, "live water map", "Ταχυδρομικός");
requireMarker(liveClient, "live water map", "Διάλεξε σωστή διεύθυνση");
requireMarker(liveClient, "live water map", "leaflet.geoJSON");
requireMarker(liveClient, "live water map", "tile.openstreetmap.org");
requireMarker(liveClient, "live water map", "Φόρτωσε δίκτυο στην περιοχή του χάρτη");

forbidMarker(liveClient, "live water map", "Κατάσταση segment");
forbidMarker(liveClient, "live water map", "Κατάσταση");
forbidMarker(liveClient, "live water map", "Advanced bbox");
forbidMarker(liveClient, "live water map", "Viewer token");
forbidMarker(liveClient, "live water map", "Min longitude");
forbidMarker(liveClient, "live water map", "Min latitude");
forbidMarker(liveClient, "live water map", "Max longitude");
forbidMarker(liveClient, "live water map", "Max latitude");
forbidMarker(liveClient, "live water map", "Master feature count");
forbidMarker(liveClient, "live water map", "Matching features");
forbidMarker(liveClient, "live water map", "Segment returned");
forbidMarker(liveClient, "live water map", "Complete network returned");
forbidMarker(liveClient, "live water map", "Raw master returned");
forbidMarker(liveClient, "live water map", "Source");
forbidMarker(liveClient, "live water map", "<svg");
forbidMarker(liveClient, "live water map", "viewBox=\"0 0 1000 620\"");

requireMarker(addressRoute, "address search route", "selectedCandidateIdRequired: true");
requireMarker(addressRoute, "address search route", "mayAutoPickAmbiguousAddress: false");
requireMarker(bboxRoute, "bbox route", "completeNetworkReturned: false");
requireMarker(bboxRoute, "bbox route", "rawMasterReturned: false");

console.log("Failures: " + failures);

if (failures > 0) {
  process.exit(1);
}
