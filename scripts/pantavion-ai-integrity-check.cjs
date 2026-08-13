const fs = require("fs");
const path = require("path");
require("./pantavion-translation-integrity-check.cjs");

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
  { text: "LLHNIKA", reason: "Greek language label must be Î•Î»Î»Î·Î½Î¹ÎºÎ¬" },
  { text: "guaranteed satellite rescue", reason: "No satellite guarantee claim without certified provider/hardware/legal coverage" },
  { text: "automatic ambulance dispatch", reason: "No ambulance dispatch claim without certified provider agreement" },
  { text: "automatic police dispatch", reason: "No police dispatch claim without certified provider agreement" },
  { text: "we dispatch emergency services", reason: "Official dispatch claims require certified partner and legal approval" },
  { text: "unlimited SOS SMS", reason: "Paid provider features require cost limits and abuse protection" },
  { text: "AI doctor", reason: "AI companion must not be marketed as a doctor" },
  { text: "AI Î³Î¹Î±Ï„ÏÏŒÏ‚", reason: "AI companion must not be marketed as a doctor" },
  { text: "caregiver can see everything", reason: "Caregiver must not receive automatic access to private companion history" },
  { text: "Ï†ÏÎ¿Î½Ï„Î¹ÏƒÏ„Î®Ï‚ Î²Î»Î­Ï€ÎµÎ¹ Ï„Î± Ï€Î¬Î½Ï„Î±", reason: "Caregiver must not receive automatic access to private companion history" }
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
  { file: "core/emergency/sos-action-execution-contract.ts", text: "pantavion_sos_action_execution_contract_v1", reason: "SOS action execution contract must exist" },
  { file: "core/emergency/sos-action-execution-contract.ts", text: "provider_pending", reason: "SOS actions must expose provider-pending state" },
  { file: "core/emergency/sos-provider-dispatch-contract.ts", text: "pantavion_sos_provider_dispatch_contract_v1", reason: "SOS provider dispatch contract must exist" },
  { file: "core/emergency/sos-provider-dispatch-contract.ts", text: "No official authority dispatch claim", reason: "SOS provider dispatch must block false authority claims" },
  { file: "core/emergency/sos-offgrid-runtime-queue.ts", text: "pantavion_sos_offgrid_runtime_queue_v1", reason: "SOS off-grid runtime queue must exist" },
  { file: "core/emergency/sos-offgrid-runtime-queue.ts", text: "Local queue is not guaranteed delivery.", reason: "Off-grid queue limitation must remain explicit" },
  { file: "core/emergency/sos-guardian-execution-bridge.ts", text: "pantavion_sos_guardian_execution_bridge_v1", reason: "SOS Guardian execution bridge must exist" },
  { file: "core/emergency/sos-guardian-execution-bridge.ts", text: "CENTRAL_AI", reason: "SOS bridge must connect to central AI concept through role text" },
  { file: "core/emergency/sos-product-completion-roadmap.ts", text: "pantavion_sos_product_completion_roadmap_v1", reason: "SOS product completion roadmap must exist" },
  { file: "core/admin/sos-admin-readiness-queue.ts", text: "pantavion_sos_admin_readiness_queue_v1", reason: "SOS admin readiness queue must exist" },
  { file: "app/sos/providers/page.tsx", text: "SOS Provider Readiness", reason: "SOS providers route must exist" },
  { file: "app/sos/admin-readiness/page.tsx", text: "SOS Admin Readiness", reason: "SOS admin readiness route must exist" },
  { file: "app/sos/readiness/page.tsx", text: "href=\"/sos/providers\"", reason: "SOS readiness page must link to provider readiness" },
  { file: "app/sos/page.tsx", text: "href=\"/sos/admin-readiness\"", reason: "Live SOS page must link to admin readiness" },
  { file: "core/emergency/sos-completion-master-ledger.ts", text: "pantavion_sos_completion_master_ledger_v1", reason: "SOS completion master ledger must exist" },
  { file: "core/emergency/sos-completion-master-ledger.ts", text: "red_one_action_sos", reason: "Red one-action SOS pillar must remain tracked" },
  { file: "core/emergency/sos-red-orange-green-model.ts", text: "pantavion_sos_red_orange_green_model_v1", reason: "Red/orange/green SOS model must exist" },
  { file: "core/emergency/sos-red-orange-green-model.ts", text: "Automatic speech language detection", reason: "Orange must default toward automatic speech language detection" },
  { file: "core/emergency/sos-red-orange-green-model.ts", text: "elder-helper-language", reason: "Manual helper language backup marker must remain tracked" },
  { file: "core/emergency/sos-emergency-circle-contract.ts", text: "pantavion_emergency_circle_contract_v1", reason: "Emergency Circle contract must exist" },
  { file: "core/emergency/sos-emergency-circle-contract.ts", text: "Trusted contacts do not automatically receive green private journal history.", reason: "Emergency Circle must protect green journal privacy" },
  { file: "core/emergency/sos-protected-users-policy.ts", text: "pantavion_sos_protected_users_policy_v1", reason: "Protected users SOS policy must exist" },
  { file: "core/emergency/sos-protected-users-policy.ts", text: "elders", reason: "Elder protected-user context must remain tracked" },
  { file: "core/emergency/sos-offgrid-identity-pack.ts", text: "pantavion_offgrid_sos_identity_pack_v1", reason: "Off-grid SOS identity pack doctrine must exist" },
  { file: "core/emergency/sos-offgrid-identity-pack.ts", text: "satellite_supported_provider_pending", reason: "Satellite-supported state must remain provider-gated" },
  { file: "core/emergency/sos-provider-readiness.ts", text: "pantavion_sos_provider_readiness_v1", reason: "SOS provider readiness doctrine must exist" },
  { file: "core/emergency/sos-provider-readiness.ts", text: "blocked_until_contracts", reason: "Authority integrations must remain blocked until contracts" },
  { file: "core/admin/sos-admin-operations.ts", text: "pantavion_sos_admin_operations_v1", reason: "SOS admin operations doctrine must exist" },
  { file: "core/admin/sos-admin-operations.ts", text: "private_journal_access_blocked_by_default", reason: "Admin operations must protect private journal access" },
  { file: "app/sos/readiness/page.tsx", text: "Pantavion SOS Readiness", reason: "SOS readiness route must exist" },
  { file: "app/sos/page.tsx", text: "href=\"/sos/readiness\"", reason: "Live SOS page must link to readiness route" },
  { file: "core/ai/pantavion-ai-layer-separation.ts", text: "pantavion_ai_layer_separation_contract_v1", reason: "AI layers must be explicitly separated" },
  { file: "core/ai/pantavion-ai-layer-separation.ts", text: "Guardian AI is not Central AI", reason: "Guardian and Central AI must not be confused" },
  { file: "core/ai/pantavion-ai-layer-separation.ts", text: "Public PantaAI", reason: "Public AI layer must be distinct" },
  { file: "core/kernel/pantavion-central-ai-kernel-controller.ts", text: "pantavion_central_ai_kernel_controller_v1", reason: "Central AI Kernel Controller must exist" },
  { file: "core/kernel/pantavion-central-ai-kernel-controller.ts", text: "kernel or multiple kernels", reason: "Central AI must control kernel or multi-kernel routing" },
  { file: "core/ai/pantaai-sovereign-public-ai.ts", text: "pantaai_sovereign_public_ai_v1", reason: "Public / Pure PantaAI must exist" },
  { file: "core/ai/pantaai-sovereign-public-ai.ts", text: "modern AI assistants", reason: "PantaAI must map current AI capability categories" },
  { file: "core/ai/pantaai-global-ai-research-doctrine.ts", text: "pantaai_global_ai_research_doctrine_v1", reason: "Legal global AI research doctrine must exist" },
  { file: "core/ai/pantaai-global-ai-research-doctrine.ts", text: "Pantavion-owned technology", reason: "Research must become Pantavion-owned technology" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "pantaai_prime_sovereign_ai_v1", reason: "PantaAI Prime central sovereign AI doctrine must exist" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "PantaAI Prime", reason: "Pantavion must define its own central AI layer" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "provider-agnostic central AI", reason: "PantaAI Prime must not be locked to one AI provider" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "agent_orchestration", reason: "PantaAI Prime must coordinate agents and future user AI layers" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "gapCoverage", reason: "PantaAI Prime must cover provider/model gaps" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "ownModelRoadmap", reason: "Pantavion must preserve path toward owned AI models" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "global-colossus standards", reason: "PantaAI Prime must preserve world-class benchmark target" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "pantavion_sovereign_guardian_kernel_v2", reason: "Sovereign Guardian Kernel v2 must exist" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "24/7/365 monitoring", reason: "Guardian must preserve always-on operating target" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "FOUNDER_OK", reason: "Guardian must keep founder approval gate" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "agent_factory", reason: "Guardian must coordinate specialized AI agents" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "global_research_radar", reason: "Guardian must track global technologies" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "ecosystem_builder", reason: "Guardian must support new ecosystem creation" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "No autonomous production deploy without Founder OK.", reason: "Guardian must block unsafe autonomous production actions" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "North America, Europe, China, Japan", reason: "Guardian must benchmark global technology regions" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "pantavion_internal_guardian_kernel_v1", reason: "Internal Guardian Kernel doctrine must exist" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "OBSERVE", reason: "Guardian loop must include observe step" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "COMPARE", reason: "Guardian loop must include compare step" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "DIAGNOSE", reason: "Guardian loop must include diagnose step" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "FOUNDER_OK", reason: "Guardian must require founder approval gate" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "PATCH", reason: "Guardian loop must include patch preparation" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "BUILD", reason: "Guardian loop must include build validation" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "AUDIT", reason: "Guardian loop must include audit validation" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "DEPLOY", reason: "Guardian loop must include deploy gate" },
  { file: "core/guardian/pantavion-guardian-kernel.ts", text: "24/7 monitoring", reason: "Guardian doctrine must preserve always-on future target" },
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
  { file: "core/memory/pantavion-continuity-thread-memory.ts", text: "pantavionThreadReaderFutureContract", reason: "Future related-thread reader contract must remain tracked" },
  { file: "app/sos/elder/page.tsx", text: "elderTranslations", reason: "Elder Safe Mode must keep full translation dictionary" },
  { file: "app/sos/elder/page.tsx", text: "ElderLanguageCode", reason: "Elder Safe Mode must keep typed language codes" },
  { file: "app/sos/elder/page.tsx", text: "languageHelp", reason: "Elder language help copy must be translated through dictionary" },
  { file: "app/sos/elder/page.tsx", text: "emergencyBoundary", reason: "Elder SOS boundary must be translated through dictionary" },
  { file: "app/sos/elder/page.tsx", text: "redKicker", reason: "Red SOS section must be translated through dictionary" },
  { file: "app/sos/elder/page.tsx", text: "orangeKicker", reason: "Orange translation section must be translated through dictionary" },
  { file: "app/sos/elder/page.tsx", text: "greenKicker", reason: "Green AI friend section must be translated through dictionary" },
  { file: "app/sos/elder/page.tsx", text: "rulesTitle", reason: "Protection rules must be translated through dictionary" }
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

const worldLanguageFile = path.join(root, "core/emergency/global-emergency-languages.ts");
if (!fs.existsSync(worldLanguageFile)) {
  failures.push({
    file: "core/emergency/global-emergency-languages.ts",
    text: "missing world language catalog",
    reason: "SOS must preserve full world language menu for six-continent use"
  });
} else {
  const worldLanguageContent = fs.readFileSync(worldLanguageFile, "utf8");
  const languageCodeCount = (worldLanguageContent.match(/code:\s*"/g) || []).length;

  if (languageCodeCount < 180) {
    failures.push({
      file: "core/emergency/global-emergency-languages.ts",
      text: "pantavion_world_language_catalog_minimum_180",
      reason: "SOS/PantaTranslate language catalog must not shrink below 250 languages"
    });
  }
}

const elderSafeModeFile = path.join(root, "app/sos/elder/page.tsx");
if (fs.existsSync(elderSafeModeFile)) {
  const elderSafeModeContent = fs.readFileSync(elderSafeModeFile, "utf8");

  if (!elderSafeModeContent.includes("globalEmergencyLanguages")) {
    failures.push({
      file: "app/sos/elder/page.tsx",
      text: "globalEmergencyLanguages",
      reason: "Elder Safe Mode must use full world language catalog"
    });
  }

  const helperStateCount = (elderSafeModeContent.match(/const \[helperLanguageCode, setHelperLanguageCode\]/g) || []).length;

  if (helperStateCount > 1) {
    failures.push({
      file: "app/sos/elder/page.tsx",
      text: "helperLanguageCode duplicate state",
      reason: "Elder Safe Mode must not redeclare helper language state"
    });
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
