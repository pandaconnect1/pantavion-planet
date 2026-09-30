import {
  buildPantavionExecutionContract,
  evaluatePantavionGovernorGuard,
} from "../core/kernel/pantavion-execution-governor.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const base = {
  founderDirective: "Restore Pantavion without repeating old failures.",
  objective: "Restore the protected Water runtime with verified evidence.",
  proposedAction: "Verify current non-Vercel runtime and protected Water serving path.",
  modes: ["prompt-engineer", "research", "expert", "strategy"],
  mutationIntent: "read",
};

const allowed = evaluatePantavionGovernorGuard(base);
assert(
  allowed.decision === "ALLOW_WITH_WARNINGS",
  "Evidence-free investigation may proceed, but completion must not be implied.",
);
assert(
  allowed.governorState === "IN_PROGRESS",
  "Admitted unfinished work must immediately enter IN_PROGRESS.",
);
assert(
  typeof allowed.actionFingerprint === "string" && allowed.actionFingerprint.length === 64,
  "Every proposed action must receive a deterministic SHA-256 fingerprint.",
);
assert(
  allowed.modePlan.some((item) => item.mode === "research" && item.applied),
  "Research mode must be active.",
);
assert(
  allowed.modePlan.some((item) => item.mode === "expert" && item.applied),
  "Expert mode must be active.",
);
assert(
  allowed.modePlan.some((item) => item.mode === "prompt-engineer" && item.applied),
  "Prompt-engineer mode must be active.",
);
assert(
  allowed.modePlan.some((item) => item.mode === "strategy" && item.applied),
  "Strategy mode must be active.",
);

const vercelBlocked = evaluatePantavionGovernorGuard({
  ...base,
  targetProvider: "Vercel",
  mutationIntent: "deploy",
});
assert(
  vercelBlocked.decision === "HARD_STOP" &&
    vercelBlocked.blockers.includes("vercel_founder_blocked"),
  "Vercel must fail closed unless Founder explicitly re-enables it.",
);

const vercelOverride = evaluatePantavionGovernorGuard({
  ...base,
  targetProvider: "Vercel",
  mutationIntent: "deploy",
  explicitFounderOverrides: { reenableVercel: true },
  evidence: [{ kind: "founder-directive", reference: "explicit-override", verified: true }],
});
assert(
  vercelOverride.decision !== "HARD_STOP",
  "Explicit Founder override must be the only path to re-enable Vercel.",
);

const mapABlocked = evaluatePantavionGovernorGuard({
  ...base,
  targetResource: "Water Map A authentic source geometry",
  mutationIntent: "write",
});
assert(
  mapABlocked.decision === "HARD_STOP" &&
    mapABlocked.blockers.includes("map_a_original_mutation_forbidden"),
  "Map A source mutation must hard-stop.",
);

const falseDone = evaluatePantavionGovernorGuard({
  ...base,
  completionClaim: true,
});
assert(
  falseDone.decision === "HARD_STOP" &&
    falseDone.blockers.includes("completion_claim_without_verified_evidence"),
  "Completion claims without evidence must hard-stop.",
);

const verifiedDone = evaluatePantavionGovernorGuard({
  ...base,
  completionClaim: true,
  evidence: [{ kind: "live-check", reference: "railway://deployment-success", verified: true }],
});
assert(
  !verifiedDone.blockers.includes("completion_claim_without_verified_evidence"),
  "Verified evidence must satisfy the completion evidence gate.",
);
assert(
  verifiedDone.governorState === "VERIFIED_DONE",
  "Verified completion must enter VERIFIED_DONE.",
);

const repeatBlocked = evaluatePantavionGovernorGuard({
  ...base,
  proposedActionFingerprint: "repeat-1",
  priorFailedActionFingerprints: ["repeat-1"],
});
assert(
  repeatBlocked.decision === "HARD_STOP" &&
    repeatBlocked.blockers.includes("repeated_failed_action_without_new_evidence"),
  "Repeating a failed action without new evidence must hard-stop.",
);

const repeatWithEvidence = evaluatePantavionGovernorGuard({
  ...base,
  proposedActionFingerprint: "repeat-1",
  priorFailedActionFingerprints: ["repeat-1"],
  newEvidenceFingerprint: "new-root-cause-evidence",
});
assert(
  !repeatWithEvidence.blockers.includes("repeated_failed_action_without_new_evidence"),
  "New evidence may reopen a previously failed route.",
);

const viralTechnical = evaluatePantavionGovernorGuard({
  ...base,
  modes: ["viral", "strategy"],
  publicContentTask: false,
});
assert(
  viralTechnical.warnings.includes("viral_mode_ignored_for_non_public_execution"),
  "Viral mode must not influence technical execution.",
);
assert(
  viralTechnical.modePlan.find((item) => item.mode === "viral")?.applied === false,
  "Viral mode must be disabled for non-public tasks.",
);

const viralPublic = evaluatePantavionGovernorGuard({
  ...base,
  modes: ["viral"],
  publicContentTask: true,
  evidence: [{ kind: "source", reference: "verified-public-facts", verified: true }],
});
assert(
  viralPublic.modePlan.find((item) => item.mode === "viral")?.applied === true,
  "Viral mode may apply to public communication tasks.",
);


const waitingFounder = evaluatePantavionGovernorGuard({
  ...base,
  requiresFounderDecision: true,
  founderDecisionPrompt: "Approve the irreversible scope change?",
  evidence: [{ kind: "analysis", reference: "decision-context", verified: true }],
});
assert(
  waitingFounder.governorState === "WAITING_FOUNDER",
  "A genuine Founder decision gate must enter WAITING_FOUNDER.",
);

const cancelled = evaluatePantavionGovernorGuard({
  ...base,
  cancelledByFounder: true,
  evidence: [{ kind: "founder-directive", reference: "cancel", verified: true }],
});
assert(
  cancelled.governorState === "CANCELLED_BY_FOUNDER",
  "Explicit Founder cancellation must be terminal.",
);

const supabaseWarning = evaluatePantavionGovernorGuard({
  ...base,
  targetProvider: "Supabase",
  mutationIntent: "write",
});
assert(
  supabaseWarning.warnings.includes(
    "supabase_is_transition_only_avoid_new_strategic_lock_in",
  ),
  "New strategic Supabase writes must be flagged as transition-only.",
);

const contract = buildPantavionExecutionContract({
  ...base,
  constraints: ["Do not expose private Water masters."],
  completionGate: ["Authorized Water network is visibly verified."],
});
assert(
  contract.constraints.includes("Do not expose private Water masters."),
  "Founder-specific constraints must be preserved.",
);
assert(
  contract.completionGate.includes("Authorized Water network is visibly verified."),
  "Founder-specific completion criteria must be preserved.",
);

console.log("Pantavion Governor execution policy contract: PASS");
