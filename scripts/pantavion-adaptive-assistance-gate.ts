import { resolvePantavionAdaptiveAssistance } from "../core/governance/adaptive-assistance-signal-policy";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

const learningFriction = resolvePantavionAdaptiveAssistance({
  neutralSignals: [
    "asks_for_simpler_explanation",
    "asks_for_step_by_step",
    "asks_to_repeat_or_rephrase",
  ],
  isMinor: true,
});

equal(learningFriction.mayAdaptSilently, true, "neutral friction may adapt presentation");
equal(learningFriction.accommodations.includes("plain-language-next-response"), true, "simpler explanation adapts");
equal(learningFriction.accommodations.includes("step-by-step-next-response"), true, "step-by-step adapts");
equal(learningFriction.mayAssignDiagnosis, false, "no diagnosis from interaction friction");
equal(learningFriction.mayCreateSensitiveProfileLabel, false, "no hidden sensitive profile label");

const safetyHelp = resolvePantavionAdaptiveAssistance({
  transientSafetySignals: ["family_safety_help_request"],
  isMinor: true,
});

equal(safetyHelp.offerHumanSupportPath, true, "safety help request offers human path");
equal(safetyHelp.jurisdictionSafeguardingCheckRequired, true, "minor safety request checks local safeguarding path");
equal(safetyHelp.mayPersistTransientSafetySignalAsTrait, false, "safety cue not persisted as profile trait");
equal(safetyHelp.mayAssignDiagnosis, false, "safety support is not diagnosis");

console.log(JSON.stringify({
  status: "PASS",
  checks: 9,
  discreetAdaptation: true,
  hiddenDiagnosis: false,
  sensitiveProfileLabel: false,
  transientSafetySupport: true,
}, null, 2));
