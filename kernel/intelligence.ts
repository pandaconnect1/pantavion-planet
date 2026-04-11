import type {
  IntakePacket,
  MemoryEntry,
  PriorityBand,
  PriorityState,
  RadarRing,
  SignalEntry,
  SignalType,
  TruthZone,
} from "./types";
import { clamp, createKernelId, nowIso } from "./types";

const BASE_SIGNAL_SCORES: Record<SignalType, number> = {
  urgency: 0.95,
  risk: 0.9,
  opportunity: 0.72,
  contradiction: 0.88,
  dependency: 0.62,
  missing_information: 0.5,
  escalation_needed: 0.92,
  new_strategic_thread: 0.8,
  learning_need: 0.56,
  workspace_recommendation: 0.48,
  capability_recommendation: 0.44,
  verification_needed: 0.68,
  governance_concern: 0.86,
  user_intent_shift: 0.58,
};

export const ringFromScore = (value: number): RadarRing => {
  if (value >= 0.9) return "core_immediate";
  if (value >= 0.72) return "active_near";
  if (value >= 0.52) return "monitored";
  if (value >= 0.3) return "peripheral";
  return "archived";
};

export const bandFromScore = (value: number): PriorityBand => {
  if (value >= 0.9) return "CRITICAL";
  if (value >= 0.72) return "HIGH";
  if (value >= 0.52) return "MEDIUM";
  if (value >= 0.3) return "LOW";
  return "BACKGROUND";
};

export const addSignalEntry = (input: {
  type: SignalType;
  label: string;
  reason: string;
  sourceIntakeId: string;
  score?: number;
  confidence?: number;
  truthZone?: TruthZone;
  metadata?: Record<string, unknown>;
}): SignalEntry => {
  const score = clamp(input.score ?? BASE_SIGNAL_SCORES[input.type], 0, 1);

  return {
    id: createKernelId("sig"),
    createdAt: nowIso(),
    type: input.type,
    label: input.label,
    reason: input.reason,
    sourceIntakeId: input.sourceIntakeId,
    score,
    confidence: clamp(input.confidence ?? 0.8, 0, 1),
    band: bandFromScore(score),
    ring: ringFromScore(score),
    truthZone: input.truthZone ?? "likely",
    metadata: input.metadata ?? {},
  };
};

const hasAny = (text: string, words: string[]): boolean =>
  words.some((word) => text.includes(word));

export const deriveSignalsFromIntake = (
  packet: IntakePacket,
  memories: MemoryEntry[]
): SignalEntry[] => {
  const lower = packet.normalizedText.toLowerCase();
  const results: SignalEntry[] = [];

  results.push(
    addSignalEntry({
      type: "capability_recommendation",
      label: "Capability routing candidate",
      reason: "Every intake should be eligible for capability recommendation.",
      sourceIntakeId: packet.id,
      score: 0.42,
      confidence: 0.75,
      truthZone: packet.truthZone,
    })
  );

  if (hasAny(lower, ["urgent", "asap", "critical", "αμέσως", "τώρα", "τζιαι τώρα"])) {
    results.push(
      addSignalEntry({
        type: "urgency",
        label: "Urgent handling needed",
        reason: "Urgency markers were detected in the input.",
        sourceIntakeId: packet.id,
        score: 0.96,
        confidence: 0.93,
        truthZone: packet.truthZone,
      })
    );
  }

  if (hasAny(lower, ["risk", "attack", "outage", "security", "ddos", "privacy", "νομ", "policy"])) {
    results.push(
      addSignalEntry({
        type: "risk",
        label: "Risk-sensitive topic",
        reason: "Security, policy, or resilience markers were detected.",
        sourceIntakeId: packet.id,
        score: 0.9,
        confidence: 0.86,
        truthZone: packet.truthZone,
      })
    );
  }

  if (hasAny(lower, ["build", "create", "launch", "ecosystem", "platform", "kernel", "orchestrator", "registry"])) {
    results.push(
      addSignalEntry({
        type: "opportunity",
        label: "Build opportunity detected",
        reason: "The intake indicates creation, architecture, or system-building intent.",
        sourceIntakeId: packet.id,
        score: 0.76,
        confidence: 0.82,
        truthZone: packet.truthZone,
      })
    );
  }

  if (hasAny(lower, ["pantavion", "kernel", "colossus", "continuity", "governed", "multimodal"])) {
    results.push(
      addSignalEntry({
        type: "new_strategic_thread",
        label: "Strategic Pantavion thread",
        reason: "Strategic Pantavion kernel/system markers were detected.",
        sourceIntakeId: packet.id,
        score: 0.83,
        confidence: 0.88,
        truthZone: packet.truthZone,
      })
    );
  }

  if (packet.normalizedText.length < 20) {
    results.push(
      addSignalEntry({
        type: "missing_information",
        label: "Input may be underspecified",
        reason: "Very short input may require clarification or plan extension.",
        sourceIntakeId: packet.id,
        score: 0.52,
        confidence: 0.74,
        truthZone: packet.truthZone,
      })
    );
  }

  if (hasAny(lower, ["learn", "course", "roadmap", "mastery", "study", "μάθη", "sql", "data"])) {
    results.push(
      addSignalEntry({
        type: "learning_need",
        label: "Learning or guided mastery signal",
        reason: "Learning path markers were detected.",
        sourceIntakeId: packet.id,
        score: 0.58,
        confidence: 0.78,
        truthZone: packet.truthZone,
      })
    );
  }

  if (hasAny(lower, ["verify", "fact", "source", "proof", "quote", "citation", "σίγουρο"])) {
    results.push(
      addSignalEntry({
        type: "verification_needed",
        label: "Verification-sensitive request",
        reason: "The intake indicates a need for stronger verification.",
        sourceIntakeId: packet.id,
        score: 0.7,
        confidence: 0.8,
        truthZone: packet.truthZone,
      })
    );
  }

  if (memories.length >= 2) {
    results.push(
      addSignalEntry({
        type: "dependency",
        label: "Continuity dependency detected",
        reason: "Multiple memory candidates suggest continuity-aware handling.",
        sourceIntakeId: packet.id,
        score: 0.61,
        confidence: 0.79,
        truthZone: packet.truthZone,
      })
    );
  }

  const unique = new Map<string, SignalEntry>();
  for (const signal of results) {
    const key = signal.type + "::" + signal.label;
    if (!unique.has(key)) unique.set(key, signal);
  }

  return Array.from(unique.values());
};

export const promoteTopSignal = (signals: SignalEntry[]): SignalEntry | undefined => {
  if (signals.length === 0) return undefined;
  return [...signals].sort((left, right) => right.score - left.score)[0];
};

export const buildPriorityState = (signals: SignalEntry[]): PriorityState => {
  const sorted = [...signals].sort((left, right) => right.score - left.score);
  const topSignal = sorted[0];
  const score = topSignal?.score ?? 0;

  return {
    score,
    band: bandFromScore(score),
    ring: ringFromScore(score),
    topSignalIds: sorted.slice(0, 5).map((signal) => signal.id),
    updatedAt: nowIso(),
  };
};
