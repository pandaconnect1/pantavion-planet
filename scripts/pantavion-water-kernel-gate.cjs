const fs = require("fs");
const path = require("path");

const checks = [];
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

function assert(name, pass, details) {
  checks.push({ name, pass, details });
  if (!pass) failures.push({ name, details });
}

const pagePath = "app/professional/infrastructure/water/page.tsx";
const clientPath = "app/professional/infrastructure/water/water-network-client.tsx";
const page = read(pagePath);
const client = read(clientPath);

const combined = page + "\n" + client;

const forbidden = [
  "FounderApprovalQueue",
  "PantaAIWaterSentinel",
  "founder-approval-queue",
  "pantaai-water-sentinel",
  "example.local",
  "νδρέας",
  "ελαφρύ layer",
  "γεωμετρίες",
  "σχεδιάσιμες γεωμετρίες",
  "σχεδιάσιμα τμήματα",
  "ίκτυο Ύδρευσης",
  "ράψε οδό",
  "ναζήτηση",
  "ρες τη θέση",
  "εν φορτώθηκε",
  "ροβολή:",
];

for (const term of forbidden) {
  assert(`forbidden:${term}`, !combined.includes(term), `Found forbidden term: ${term}`);
}

const requiredClientMarkers = [
  "searchAddress",
  "nominatim.openstreetmap.org/search",
  "navigator.geolocation",
  "locateUser",
  "onWheel",
  "onPointerDown",
  "onPointerMove",
  "setPointerCapture",
  "zoomDelta",
  "panX",
  "panY",
  "changeZoom",
  "resetView",
];

for (const marker of requiredClientMarkers) {
  assert(`required:${marker}`, client.includes(marker), `Missing required marker: ${marker}`);
}

const requiredPageMarkers = [
  "WaterNetworkClient",
  "\\u0394\\u03af\\u03ba\\u03c4\\u03c5\\u03bf",
  "\\u0393\\u03c1\\u03ac\\u03c8\\u03b5",
];

for (const marker of requiredPageMarkers) {
  assert(`page:${marker}`, page.includes(marker), `Missing page marker: ${marker}`);
}

const publicDir = path.join(process.cwd(), "public");
const publicLeaks = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(kmz|kml|geojson)$/i.test(entry.name)) publicLeaks.push(full);
  }
}

walk(publicDir);
assert("no-public-water-geodata", publicLeaks.length === 0, publicLeaks.join("\n"));

if (failures.length) {
  console.error("PANTAVION WATER KERNEL GATE FAIL");
  for (const failure of failures) {
    console.error("-", failure.name, failure.details || "");
  }
  process.exit(1);
}

console.log("PANTAVION WATER KERNEL GATE PASS");
console.log("Checks:", checks.length);
