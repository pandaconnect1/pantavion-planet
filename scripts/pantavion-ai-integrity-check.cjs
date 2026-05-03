const fs = require("fs");
const path = require("path");

const root = process.cwd();
const roots = ["app", "core", "components", "kernel"].filter((dir) =>
  fs.existsSync(path.join(root, dir))
);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbidden = [
  { text: "Route not mapped", reason: "public debug route text must not appear live" },
  { text: "works-now", reason: "internal registry language must not appear live" },
  { text: "next integrations", reason: "internal roadmap text must not appear live" },
  { text: "pantavion-home-language", reason: "language must be global, not homepage-only" },
  { text: "pantavion-emergency-language", reason: "language must be global, not emergency-only" },
  { text: "LLHNIKA", reason: "Greek language label must be Ελληνικά" },
  { text: "guaranteed satellite rescue", reason: "No satellite guarantee claim without certified provider/hardware/legal coverage" },
  { text: "automatic ambulance dispatch", reason: "No ambulance dispatch claim without certified provider agreement" },
  { text: "automatic police dispatch", reason: "No police dispatch claim without certified provider agreement" },
  { text: "we dispatch emergency services", reason: "Official dispatch claims require certified partner and legal approval" },
  { text: "unlimited SOS SMS", reason: "Paid provider features require cost limits and abuse protection" },
  { text: "AI doctor", reason: "AI companion must not be marketed as a doctor" },
  { text: "AI γιατρός", reason: "AI companion must not be marketed as a doctor" },
  { text: "caregiver can see everything", reason: "Caregiver must not receive automatic access to private companion history" },
  { text: "φροντιστής βλέπει τα πάντα", reason: "Caregiver must not receive automatic access to private companion history" }
];

const requiredPaths = [
  { file: "app/sos/page.tsx", reason: "Live SOS route must exist" },
  { file: "app/sos/contacts/page.tsx", reason: "Trusted contacts route must exist" },
  { file: "app/feedback/page.tsx", reason: "Feedback route must exist for public problem reports" },
  { file: "core/emergency/sos-gap-ledger.ts", reason: "SOS gaps must stay tracked in the repo" },
  { file: "core/emergency/sos-provider-roadmap.ts", reason: "SOS provider roadmap must stay tracked in the repo" },
  { file: "core/emergency/sos-alert-policy.ts", reason: "SOS alert policy must stay tracked in the repo" },
  { file: "core/emergency/sos-competitive-synthesis.ts", reason: "SOS competitive synthesis map must stay tracked in the repo" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", reason: "Pantavion continuity/thread memory framework must stay tracked in the repo" }
];

const requiredContent = [
  { file: "app/sos/page.tsx", text: 'href="/sos/contacts"', reason: "Live SOS must link to trusted contacts" },

  { file: "core/emergency/sos-gap-ledger.ts", text: "backend-sms-alerts", reason: "SMS gap must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "age-role-sos-protection", reason: "Age-role SOS protection must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "minor-guardian-consent-sos", reason: "Minor and guardian SOS consent must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "elder-simple-sos-mode", reason: "Elder simplified SOS mode must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "violence-bullying-safe-exit-evidence", reason: "Violence/bullying/abuse-safe SOS path must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "one-tap-sos-auto-media-alert", reason: "One-tap SOS must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "orange-live-translation-no-history-access", reason: "Orange translation/help must remain separate from green private history" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "elder-ai-companion-local-voice-memory", reason: "Green AI companion local voice/text memory must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "caregiver-no-auto-access", reason: "Caregiver automatic access must remain blocked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "ai-health-support-not-doctor", reason: "AI companion must not be doctor/diagnosis system" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "family-consent-summary-sharing", reason: "Family sharing must be consent-based" },

  { file: "core/emergency/sos-provider-roadmap.ts", text: "sms-provider", reason: "SMS provider roadmap must remain tracked" },

  { file: "core/emergency/sos-alert-policy.ts", text: "PANTAVION_SOS_MAX_TRUSTED_CONTACTS", reason: "SOS max-contact safety/cost limit must remain tracked" },
  { file: "core/emergency/sos-alert-policy.ts", text: "PANTAVION_SOS_SMS_ENABLED", reason: "SMS provider must be Founder-controlled through env flag" },
  { file: "core/emergency/sos-alert-policy.ts", text: "vulnerableUserReminder", reason: "Policy must remember minors, elders, guardians and vulnerable users" },
  { file: "core/emergency/sos-alert-policy.ts", text: "elderCompanionRules", reason: "Policy must include green AI companion privacy/health-support rules" },

  { file: "core/emergency/sos-competitive-synthesis.ts", text: "pantavionLegalAbsorptionRules", reason: "Legal absorption rules must remain tracked" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "apple-emergency-satellite-pattern", reason: "Apple-style satellite-aware pattern must remain tracked safely" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "garmin-inreach-response-pattern", reason: "Dedicated satellite response pattern must remain tracked safely" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "life360-family-safety-pattern", reason: "Family safety pattern must remain tracked" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "noonlight-dispatch-api-pattern", reason: "Dispatch-provider pattern must remain tracked as blocked provider path" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "google-personal-safety-pattern", reason: "Device personal safety pattern must remain tracked" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "what3words-location-pattern", reason: "Precise location pattern must remain tracked without copying provider system" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "secure-messaging-emergency-channel-pattern", reason: "Messaging emergency channel pattern must remain tracked" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "ai-companion-life-journal-pattern", reason: "AI companion/journal pattern must remain tracked safely" },
  { file: "core/emergency/sos-competitive-synthesis.ts", text: "getPantavionOwnedSosOpportunitySummary", reason: "Pantavion-owned synthesis summary must remain tracked" },
  { file: "app/sos/elder/page.tsx", text: "pantavion_global_language_v1", reason: "Elder Safe Mode must use global language memory key" },
  { file: "app/sos/elder/page.tsx", text: "languageOptions", reason: "Elder Safe Mode must keep language selection options" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "pantavionContinuityThreadMemoryRules", reason: "Continuity/thread memory rules must remain tracked" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "topic-thread-retrieval", reason: "Topic-related thread retrieval doctrine must remain tracked" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "language-never-forgotten", reason: "Language must not be forgotten in critical flows" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "founder-approval-before-automation", reason: "Founder approval gate must remain tracked for future autonomous execution" },
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "pantavionThreadReaderFutureContract", reason: "Future related-thread reader contract must remain tracked" }
];

function walk(dir) {
  const out = [];

  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "out"].includes(item.name)) {
        continue;
      }

      out.push(...walk(rel));
    } else if (extensions.has(path.extname(item.name))) {
      out.push(rel);
    }
  }

  return out;
}

const files = roots.flatMap(walk);
const failures = [];

for (const file of files) {
  const fileContent = fs.readFileSync(path.join(root, file), "utf8");

  for (const rule of forbidden) {
    if (fileContent.includes(rule.text)) {
      failures.push({ file, text: rule.text, reason: rule.reason });
    }
  }
}

for (const item of requiredPaths) {
  if (!fs.existsSync(path.join(root, item.file))) {
    failures.push({ file: item.file, text: "missing required file", reason: item.reason });
  }
}

for (const item of requiredContent) {
  const absolute = path.join(root, item.file);

  if (!fs.existsSync(absolute)) {
    failures.push({
      file: item.file,
      text: item.text,
      reason: item.reason + " because file is missing"
    });
    continue;
  }

  const fileContent = fs.readFileSync(absolute, "utf8");

  if (!fileContent.includes(item.text)) {
    failures.push({ file: item.file, text: item.text, reason: item.reason });
  }
}

console.log("\nPANTAVION AI READINESS AUDIT");
console.log("Checked files:", files.length);

if (failures.length) {
  console.log("\nFAILURES:");

  for (const item of failures) {
    console.log(
      "- " +
        item.file +
        " contains/requires " +
        JSON.stringify(item.text) +
        " -> " +
        item.reason
    );
  }

  process.exit(1);
}

console.log(
  "PASS: no known public debug strings, wrong Greek label, non-global language keys, unsafe SOS claims, missing SOS provider ledgers, missing competitive synthesis, or unsafe AI companion claims found."
);
