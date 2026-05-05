const fs = require("fs");

const checks = [
  {
    file: "core/growth/pantavion-public-growth-ledger.ts",
    markers: [
      "PANTAVION_PUBLIC_GROWTH_LEDGER_V1",
      "PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1",
      "PANTAVION_NEWSPAPER_ADS_CENTER_V1",
      "PANTAVION_DISCOVERY_PLATFORM_CHECKLIST_V1",
      "Google indexing and ranking are not guaranteed",
      "No intrusive popups",
      "continent",
      "country",
      "city",
      "removed_from_public",
    ],
  },
  {
    file: "app/sitemap.ts",
    markers: [
      "https://pantavion.com",
      "/translate",
      "/panta-ai",
      "/life-connector",
      "/communication",
      "/advertise",
      "/newspaper",
      "/discovery",
      "/product-status",
    ],
  },
  {
    file: "app/robots.ts",
    markers: [
      "sitemap",
      "https://pantavion.com/sitemap.xml",
      "disallow",
      "/api/",
    ],
  },
  {
    file: "app/discovery/page.tsx",
    markers: [
      "PANTAVION_PUBLIC_GROWTH_LEDGER_V1",
      "Google Search",
      "Bing / MSN / IndexNow",
      "Apple ecosystem",
      "No fake growth claim",
    ],
  },
  {
    file: "app/advertise/page.tsx",
    markers: [
      "PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1",
      "Advertise on Pantavion without disturbing users",
      "No intrusive ads rule",
      "Submit advertising inquiry",
    ],
  },
  {
    file: "app/newspaper/page.tsx",
    markers: [
      "PANTAVION_NEWSPAPER_ADS_CENTER_V1",
      "Pantavion Newspaper",
      "Listing lifecycle",
      "Sold",
      "Rented",
      "Fulfilled",
      "Removed from public",
    ],
  },
  {
    file: "app/panta-ai/page.tsx",
    markers: [
      "PANTAVION_AI_TRUTH_SURFACE_V1",
      "Provider-required",
      "Database/auth-required",
      "Audit-runner-required",
    ],
  },
  {
    file: "app/life-connector/page.tsx",
    markers: [
      "PANTAVION_LIFE_CONNECTOR_HUB_V1",
      "Phone contacts",
      "Email hub",
      "SMS / messages hub",
      "Calendar",
      "Birthdays",
    ],
  },
  {
    file: "app/communication/page.tsx",
    markers: [
      "PANTAVION_COMMUNICATION_UNIVERSE_V1",
      "PantaChat",
      "PantaChannels",
      "PantaDating / Relationships 18+",
      "Under-18",
    ],
  },
  {
    file: "app/product-status/page.tsx",
    markers: [
      "PANTAVION_PRODUCT_TRUTH_LEDGER_V1",
      "Product truth before public claims",
      "Provider-required",
      "Database/moderation-required",
    ],
  },
];

const forbidden = [
  "guaranteed traffic",
  "guaranteed revenue",
  "Google will rank Pantavion",
  "Apple will promote Pantavion",
  "paid checkout is live",
  "automatic payment is live",
  "ads inside SOS",
  "adult ads to minors",
  "all 7000 languages are live",
  "AI agents are already working autonomously",
];

let failed = false;

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    console.error(`[FAIL] Missing ${check.file}`);
    failed = true;
    continue;
  }

  const text = fs.readFileSync(check.file, "utf8");

  for (const marker of check.markers) {
    if (!text.includes(marker)) {
      console.error(`[FAIL] ${check.file} missing marker: ${marker}`);
      failed = true;
    }
  }

  for (const bad of forbidden) {
    if (text.toLowerCase().includes(bad.toLowerCase())) {
      console.error(`[FAIL] ${check.file} contains forbidden claim: ${bad}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("Pantavion public growth audit failed.");
  process.exit(1);
}

console.log("Pantavion public growth audit passed.");
