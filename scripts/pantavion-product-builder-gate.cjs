const fs = require("fs");

const checks = [
  {
    label: "builder API route present",
    file: "app/api/pantavion/product-builder/missions/route.ts",
    marker: "PANTAVION_PRODUCT_BUILDER_API_ROUTE"
  },
  {
    label: "builder page present",
    file: "app/pantavion/builder/page.tsx",
    marker: "PantavionProductBuilderClient"
  },
  {
    label: "builder client present",
    file: "components/pantavion/PantavionProductBuilderClient.tsx",
    marker: "PANTAVION_PRODUCT_BUILDER_CLIENT"
  },
  {
    label: "real API fetch present",
    file: "components/pantavion/PantavionProductBuilderClient.tsx",
    marker: "/api/pantavion/product-builder/missions"
  },
  {
    label: "founder approval boundary present",
    file: "components/pantavion/PantavionProductBuilderClient.tsx",
    marker: "Founder approve"
  }
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.label}: missing ${check.file}`);
    continue;
  }

  const text = fs.readFileSync(check.file, "utf8");
  if (!text.includes(check.marker)) {
    failures.push(`${check.label}: missing marker ${check.marker}`);
  }
}

if (failures.length) {
  console.error("PANTAVION PRODUCT BUILDER GATE: FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PANTAVION PRODUCT BUILDER GATE: PASSED");
for (const check of checks) console.log(`- ${check.label}`);
