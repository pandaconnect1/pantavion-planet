import { runKernelGovernorCycle } from "../services/kernel-governor/index.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function job(execution) {
  return {
    id: "governor-test-job",
    type: "kernel_cycle",
    priority: "high",
    createdAt: "2026-09-30T14:00:00.000Z",
    payload: {
      intake: {
        id: "intake-governor-test",
        content: "Founder command for Pantavion execution.",
        truthZone: "verified",
        sensitivity: "internal",
        intentHint: "verify and execute",
      },
      execution,
    },
  };
}

const safe = runKernelGovernorCycle(
  job({
    founderDirective: "Verify the current Pantavion runtime and continue implementation.",
    objective: "Continue implementation using evidence.",
    proposedAction: "Inspect current runtime truth before mutation.",
    modes: ["prompt-engineer", "research", "expert", "strategy"],
    mutationIntent: "read",
  }),
);

assert(safe.status === "completed", "Safe governed execution must be admitted.");
assert(
  safe.result?.governor?.decision === "ALLOW_WITH_WARNINGS",
  "Evidence-free investigation must remain non-terminal and warn.",
);

const blockedVercel = runKernelGovernorCycle(
  job({
    founderDirective: "Vercel is blocked.",
    objective: "Keep blocked provider outside execution.",
    proposedAction: "Deploy to Vercel.",
    targetProvider: "Vercel",
    mutationIntent: "deploy",
  }),
);

assert(blockedVercel.status === "blocked", "Blocked provider must stop runtime execution.");
assert(
  blockedVercel.blockers?.includes("vercel_founder_blocked"),
  "Governor runtime must expose the exact Vercel hard-stop reason.",
);

const blockedMapA = runKernelGovernorCycle(
  job({
    founderDirective: "Do not alter Map A.",
    objective: "Repair Water serving without source mutation.",
    proposedAction: "Rewrite authentic Map A geometry.",
    targetResource: "Water Map A authentic source geometry",
    mutationIntent: "write",
  }),
);

assert(blockedMapA.status === "blocked", "Map A source mutation must stop runtime execution.");
assert(
  blockedMapA.blockers?.includes("map_a_original_mutation_forbidden"),
  "Governor runtime must expose the Map A source hard stop.",
);

const falseDone = runKernelGovernorCycle(
  job({
    founderDirective: "Finish only with evidence.",
    objective: "Verified live completion.",
    proposedAction: "Declare VERIFIED_DONE.",
    completionClaim: true,
    mutationIntent: "read",
  }),
);

assert(falseDone.status === "blocked", "False completion must stop runtime execution.");
assert(
  falseDone.blockers?.includes("completion_claim_without_verified_evidence"),
  "Governor must expose the missing-evidence completion blocker.",
);

console.log("Pantavion kernel-governor runtime contract: PASS");
