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
  { text: "Λληνικά", reason: "Greek language label must be Ελληνικά" },
  { text: "guaranteed satellite rescue", reason: "No guaranteed satellite rescue claim without certified provider/hardware/legal coverage" },
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
  { file: "core/emergency/sos-alert-policy.ts", reason: "SOS alert policy must stay tracked in the repo" }
];

const requiredContent = [
  { file: "app/sos/page.tsx", text: 'href="/sos/contacts"', reason: "Live SOS must link to trusted contacts" },

  { file: "core/emergency/sos-gap-ledger.ts", text: "backend-sms-alerts", reason: "SMS gap must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "age-role-sos-protection", reason: "Age-based SOS protection for minors, elders and guardians must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "minor-guardian-consent-sos", reason: "Minor and guardian SOS consent gap must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "elder-simple-sos-mode", reason: "Elder simplified SOS mode must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "violence-bullying-safe-exit-evidence", reason: "Violence, bullying and abuse-safe SOS path must remain tracked" },

  { file: "core/emergency/sos-gap-ledger.ts", text: "one-tap-sos-auto-media-alert", reason: "One-tap SOS for elders/minors must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "orange-live-translation-no-history-access", reason: "Orange translation/help must remain separate from private AI companion history" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "elder-ai-companion-local-voice-memory", reason: "Green AI companion local voice/text memory must remain tracked" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "caregiver-no-auto-access", reason: "Caregiver must not get automatic access to private elder AI history" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "ai-health-support-not-doctor", reason: "AI companion must not be represented as a doctor or diagnosis system" },
  { file: "core/emergency/sos-gap-ledger.ts", text: "family-consent-summary-sharing", reason: "Family sharing must be consent-based and tracked" },

  { file: "core/emergency/sos-provider-roadmap.ts", text: "sms-provider", reason: "SMS provider roadmap must remain tracked" },
  { file: "core/emergency/sos-alert-policy.ts", text: "PANTAVION_SOS_MAX_TRUSTED_CONTACTS", reason: "SOS max-contact cost/safety limit must remain tracked" },
  { file: "core/emergency/sos-alert-policy.ts", text: "PANTAVION_SOS_SMS_ENABLED", reason: "SMS provider must be Founder-controlled through environment flag" },
  { file: "core/emergency/sos-alert-policy.ts", text: "vulnerableUserReminder", reason: "SOS policy must remember minors, elders, guardians and vulnerable users" },
  { file: "core/emergency/sos-alert-policy.ts", text: "elderCompanionRules", reason: "SOS policy must include green AI companion privacy/health-support rules" }
];

function walk(dir) {
  const out = [];

  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "out"].includes(item.name)) continue;
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
  "PASS: no known public debug strings, wrong Greek label, non-global language keys, unsafe SOS claims, missing SOS provider ledgers, or unsafe AI companion claims found."
);
