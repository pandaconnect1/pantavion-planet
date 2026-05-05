const fs = require("fs");

const file = "core/product/pantavion-product-truth-ledger.ts";

const requiredMarkers = [
  "PANTAVION_PRODUCT_TRUTH_LEDGER_V1",
  "universal_interpreter_global_product",
  "sos_emergency_translation",
  "contacts_import_phone_email_csv_apps",
  "email_hub",
  "sms_messages_hub",
  "calendar_birthdays_reminders_tasks",
  "public_panta_ai",
  "personal_panta_ai_per_user",
  "internal_guardian_ai_workforce",
  "communication_universe",
  "dating_relationships_18_plus",
  "media_music_movies_video_photo",
  "seo_public_discovery",
  "Do not claim",
  "currentTruth",
  "nextRealStep",
];

if (!fs.existsSync(file)) {
  console.error(`[FAIL] Missing ${file}`);
  process.exit(1);
}

const text = fs.readFileSync(file, "utf8");
let failed = false;

for (const marker of requiredMarkers) {
  if (!text.includes(marker)) {
    console.error(`[FAIL] Missing marker/concept: ${marker}`);
    failed = true;
  }
}

const liveWorkingMatches = [...text.matchAll(/status:\s*"LIVE_WORKING"[\s\S]{0,500}?implementationProof:/g)];
const rawLiveWorkingCount = (text.match(/status:\s*"LIVE_WORKING"/g) ?? []).length;

if (rawLiveWorkingCount !== liveWorkingMatches.length) {
  console.error("[FAIL] Any LIVE_WORKING item must include implementationProof close to the status.");
  failed = true;
}

const forbiddenClaims = [
  "AI agents are already working autonomously",
  "perfect live translation for all 7000",
  "full SMS access from browser",
  "police dispatch is active",
  "satellite SOS is active",
];

for (const claim of forbiddenClaims) {
  if (text.includes(claim) && !text.includes(`Do not claim ${claim}`)) {
    console.error(`[FAIL] Potential unsafe active claim: ${claim}`);
    failed = true;
  }
}

if (failed) {
  console.error("Pantavion product truth audit failed.");
  process.exit(1);
}

console.log("Pantavion product truth audit passed.");
