export type PantaAIAgentStage =
  | "define-role"
  | "structure-io"
  | "govern-behavior"
  | "reason-and-tools"
  | "orchestrate"
  | "memory-rag"
  | "multimodal"
  | "deliver"
  | "surface"
  | "evaluate";

export type PantaAICriticalThinkingCheck =
  | "facts-vs-opinions"
  | "question-assumptions"
  | "opposing-views"
  | "bias-check"
  | "logic-test"
  | "ripple-effects"
  | "devils-advocate"
  | "verify-sources"
  | "blind-spots"
  | "other-perspectives"
  | "define-precisely"
  | "challenge-status-quo";

export interface PantaAIAgentContract {
  key: string;
  role: string;
  goal: string;
  audience: "public" | "user" | "internal" | "business" | "creator" | "sos";
  inputSchema: string[];
  outputSchema: string[];
  allowedTools: string[];
  memoryPolicy: "none" | "session" | "consent-long-term";
  orchestration: "single" | "specialist-team";
  multimodal: ("text" | "voice" | "image" | "video")[];
  review: "standard" | "verified" | "restricted" | "human-required";
}

export const PANTA_AI_AGENT_BUILD_STAGES: ReadonlyArray<{
  stage: PantaAIAgentStage;
  requirement: string;
}> = [
  { stage: "define-role", requirement: "Every agent must have a bounded role, goal and target audience." },
  { stage: "structure-io", requirement: "Inputs and outputs must be typed/structured enough for validation and audit." },
  { stage: "govern-behavior", requirement: "Behavior must be policy, permission, risk-lane and truth-mode governed." },
  { stage: "reason-and-tools", requirement: "Tools are allow-listed; tool results are evidence, not unquestioned truth." },
  { stage: "orchestrate", requirement: "Multi-agent work uses explicit specialist roles, handoffs and result ownership." },
  { stage: "memory-rag", requirement: "Memory is consent-aware; retrieval preserves provenance and access boundaries." },
  { stage: "multimodal", requirement: "Voice/image/video are enabled only where the capability and provider are verified." },
  { stage: "deliver", requirement: "Outputs must be readable, machine-parseable where needed, and carry uncertainty/evidence." },
  { stage: "surface", requirement: "UI exposure requires a real backend route; no static/fake capability buttons." },
  { stage: "evaluate", requirement: "Production agents need evals, tracing, failure metrics, rollback and continuous monitoring." },
] as const;

export const PANTA_AI_CRITICAL_THINKING_PROTOCOL: ReadonlyArray<{
  check: PantaAICriticalThinkingCheck;
  instruction: string;
}> = [
  { check: "facts-vs-opinions", instruction: "Separate verifiable facts, interpretations and preferences." },
  { check: "question-assumptions", instruction: "Identify assumptions that materially change the answer." },
  { check: "opposing-views", instruction: "Represent strong relevant alternatives before concluding." },
  { check: "bias-check", instruction: "Check framing, selection and confirmation bias." },
  { check: "logic-test", instruction: "Test whether conclusions follow from premises and evidence." },
  { check: "ripple-effects", instruction: "Consider meaningful second-order effects and dependencies." },
  { check: "devils-advocate", instruction: "Test the strongest credible counter-case for important decisions." },
  { check: "verify-sources", instruction: "For verified-required work, use current primary/authoritative evidence and provenance." },
  { check: "blind-spots", instruction: "Identify missing information that could reverse the recommendation." },
  { check: "other-perspectives", instruction: "Seek domain/user/stakeholder perspectives when they change the outcome." },
  { check: "define-precisely", instruction: "Resolve ambiguous terms before high-impact execution." },
  { check: "challenge-status-quo", instruction: "Do not preserve an old design merely because it already exists; compare safer/better alternatives." },
] as const;

export function buildPantaAICriticalThinkingInstruction(): string {
  return PANTA_AI_CRITICAL_THINKING_PROTOCOL.map(
    (item, index) => `${index + 1}. ${item.instruction}`,
  ).join("\n");
}

export function validatePantaAIAgentContract(contract: PantaAIAgentContract): string[] {
  const errors: string[] = [];
  if (!contract.key.trim()) errors.push("agent key is required");
  if (!contract.role.trim()) errors.push("agent role is required");
  if (!contract.goal.trim()) errors.push("agent goal is required");
  if (!contract.inputSchema.length) errors.push("at least one input field is required");
  if (!contract.outputSchema.length) errors.push("at least one output field is required");
  if (contract.memoryPolicy === "consent-long-term" && contract.audience === "public") {
    errors.push("public anonymous agents cannot silently use long-term memory");
  }
  if (contract.review === "human-required" && contract.orchestration === "single" && !contract.allowedTools.length) {
    errors.push("human-required execution must identify an auditable handoff/tool path");
  }
  return errors;
}
