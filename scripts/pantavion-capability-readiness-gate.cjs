const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];
const warnings = [];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  const filePath = absolute(relativePath);

  if (!fs.existsSync(filePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function requireIncludes(relativePath, markers) {
  const text = read(relativePath);

  for (const marker of markers) {
    if (!text.includes(marker)) {
      failures.push(relativePath + " missing marker: " + marker);
    }
  }

  return text;
}

function requirePackageScript(packageJson, name, expected) {
  const actual = packageJson.scripts && packageJson.scripts[name];

  if (actual !== expected) {
    failures.push(
      'package.json must include "' + name + '": "' + expected + '"',
    );
  }
}

const ecosystemRegistry = requireIncludes(
  "core/intelligence/pantavion-ecosystem-signal-registry.ts",
  [
    "pantavion_ecosystem_signal_registry_v1",
    "realRouteRequired",
    "realLogicRequired",
    "realStateDataFlowRequired",
    "providerOrDataSourceRequired",
    "clearDisabledBetaInternalStatusRequired",
    "greenAuditBuildTypecheckRequired",
    "founderApprovalRequiredForSensitiveChanges",
    "createPantavionDailyEcosystemBrief",
    "evaluatePantavionCapabilityProposal",
  ],
);

requireIncludes("core/ai/pantavion-agent-protocol-registry.ts", [
  "pantavion_agent_protocol_registry_v1",
  "MCP",
  "A2A",
  "Agent Identity",
  "capability token",
  "evaluatePantavionAgentProtocolInvocation",
  "founderApprovalRequired",
  "canExecute",
]);

requireIncludes("core/security/pantavion-agent-delegation-policy.ts", [
  "pantavion_agent_delegation_policy_v1",
  "auditGreen",
  "buildGreen",
  "typecheckGreen",
  "founderApprovalRecorded",
  "createPantavionAgentDelegationDecision",
  "production_deploy",
  "user_access",
  "private_infrastructure",
]);

requireIncludes("core/communication/pantavion-translation-runtime-contract.ts", [
  "pantavion_translation_runtime_contract_v1",
  "automatic_speech_detection",
  "manual_helper_language_backup",
  "text_only_fallback",
  "provider_required",
  "assistive_not_legal_medical_guarantee",
  "createPantavionTranslationRuntimeSession",
  "evaluatePantavionRealtimeTranslationProvider",
]);

requireIncludes("app/api/translation/realtime/session/route.ts", [
  "PANTAVION_REALTIME_TRANSLATION_PROVIDER_REQUIRED",
  "provider_adapter_not_implemented",
  "createPantavionTranslationRuntimeSession",
  "evaluatePantavionRealtimeTranslationProvider",
  "export async function GET",
  "export async function POST",
  'runtime = "nodejs"',
]);

requireIncludes("app/api/pantavion/ecosystem-signals/route.ts", [
  "createPantavionDailyEcosystemBrief",
  "getPantavionEcosystemSignals",
  "pantavionCapabilityReadinessChecklist",
  "export async function GET",
  'status: "internal"',
]);

const packageText = read("package.json");
let packageJson = null;

try {
  packageJson = JSON.parse(packageText);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  requirePackageScript(
    packageJson,
    "audit:capability-readiness",
    "node scripts/pantavion-capability-readiness-gate.cjs",
  );

  const verifyScript = packageJson.scripts && packageJson.scripts["verify:runtime-safety"];
  if (!verifyScript || !verifyScript.includes("npm run audit:capability-readiness")) {
    failures.push("verify:runtime-safety must run audit:capability-readiness before build/deploy readiness.");
  }
}

if (/status:\s*["']production["']/.test(ecosystemRegistry)) {
  failures.push("New ecosystem capabilities must not be marked production by this gate.");
}

if (/guaranteed translation/i.test(ecosystemRegistry)) {
  failures.push("Translation capability must not claim guaranteed translation.");
}

if (failures.length > 0) {
  console.error("PANTAVION CAPABILITY READINESS GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION CAPABILITY READINESS GATE: PASSED");
  console.log("- ecosystem signal registry present");
  console.log("- agent protocol registry present");
  console.log("- delegation policy present");
  console.log("- realtime translation runtime contract present");
  console.log("- real API route boundaries present");
  console.log("- package verification script wired");
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn("- " + warning);
}
