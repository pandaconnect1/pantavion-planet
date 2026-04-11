import type { ClassificationResult, NormalizedInput } from "./classifier";
import type { RegistryMapping } from "./registry";

export interface CapabilityProfile {
  capabilities: string[];
  actions: string[];
  reasons: string[];
}

export interface GapItem {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  suggestedFix: string;
}

export interface GapReport {
  status: "clear" | "has-gaps";
  items: GapItem[];
  buildTasks: string[];
}

const TYPE_CAPABILITIES: Partial<Record<ClassificationResult["type"], string[]>> = {
  AI_TOOLS: ["retrieve", "compare", "group", "suggest", "store"],
  LANGUAGE_MAP: ["classify", "group", "suggest", "store"],
  ARCHITECTURE: ["map", "plan", "generate", "review", "store"],
  WORKSPACE_STACK: ["compare", "group", "suggest", "plan", "store"],
  DATA_SCIENCE: ["classify", "compare", "summarize", "plan", "execute"],
  PROMPTING: ["group", "suggest", "generate", "compare", "store"],
  RAG_CAG: ["retrieve", "map", "plan", "review", "store"],
  MARKETING_STACK: ["group", "suggest", "generate", "compare", "execute"],
  VOICE_SYSTEM: ["route", "translate", "summarize", "execute", "store"],
  SECURITY_PATTERN: ["review", "risk-check", "block", "audit", "prioritize"],
  UNKNOWN: ["classify", "store"]
};

const INTENT_ACTIONS: Partial<Record<ClassificationResult["intent"], string[]>> = {
  exploration: ["discover", "group", "surface"],
  comparison: ["compare", "rank", "differentiate"],
  implementation: ["plan", "generate", "prepare"],
  architecture: ["map", "structure", "govern"],
  classification: ["label", "route", "store"],
  expansion: ["expand", "admit", "organize"],
  optimization: ["improve", "prioritize", "refine"],
  unknown: ["inspect", "store"]
};

export function resolveCapabilities(
  normalized: NormalizedInput,
  classification: ClassificationResult,
  mapping: RegistryMapping
): CapabilityProfile {
  const baseCapabilities = TYPE_CAPABILITIES[classification.type] || ["classify", "store"];
  const actions = INTENT_ACTIONS[classification.intent] || ["inspect", "store"];

  const capabilities = [
    ...new Set([
      ...baseCapabilities,
      ...mapping.capabilityFamilies,
      "store",
      "trace"
    ])
  ];

  const reasons = [
    `type ${classification.type} enables ${baseCapabilities.join(", ")}`,
    `intent ${classification.intent} enables ${actions.join(", ")}`,
    `workspace ${mapping.workspace} adds ${mapping.capabilityFamilies.join(", ")}`
  ];

  if (normalized.source === "image" || normalized.source === "mixed") {
    if (!capabilities.includes("visual-interpret")) capabilities.push("visual-interpret");
    reasons.push("visual source added visual-interpret capability");
  }

  return { capabilities, actions, reasons };
}

export function detectGaps(
  normalized: NormalizedInput,
  classification: ClassificationResult,
  mapping: RegistryMapping,
  profile: CapabilityProfile
): GapReport {
  const items: GapItem[] = [];
  const buildTasks: string[] = [];

  if (classification.type === "UNKNOWN") {
    items.push({
      code: "UNKNOWN_TYPE",
      severity: "high",
      message: "The input type could not be reliably classified.",
      suggestedFix: "Add stronger classification rules or supply richer input context."
    });
    buildTasks.push("Add or refine classifier rules for this signal family.");
  }

  if (classification.confidence < 0.6) {
    items.push({
      code: "LOW_CONFIDENCE",
      severity: "medium",
      message: "Classification confidence is below safe auto-structuring threshold.",
      suggestedFix: "Request more input, enrich from external sources, or add domain-specific patterns."
    });
    buildTasks.push("Enrich low-confidence inputs before deeper execution.");
  }

  if (classification.intent === "implementation" && !profile.capabilities.includes("generate")) {
    items.push({
      code: "MISSING_GENERATION_CAPABILITY",
      severity: "high",
      message: "Implementation request exists but generation capability is missing.",
      suggestedFix: "Attach code-generation or blueprint-generation capability."
    });
    buildTasks.push("Add generation path for implementation flows.");
  }

  if (mapping.policyZone.includes("sensitive") || mapping.policyZone.includes("governed")) {
    items.push({
      code: "POLICY_REVIEW_REQUIRED",
      severity: "medium",
      message: "This mapping belongs to a governed or sensitive policy zone.",
      suggestedFix: "Require policy and security review before auto-execution."
    });
    buildTasks.push("Route this category through governed approval flow.");
  }

  if (normalized.source === "image" && classification.type === "UNKNOWN") {
    items.push({
      code: "VISUAL_EXTRACTION_GAP",
      severity: "medium",
      message: "Image input exists but no reliable visual semantic extraction path was inferred.",
      suggestedFix: "Attach OCR/vision enrichment adapter before auto-classification."
    });
    buildTasks.push("Add visual extraction / image understanding adapter.");
  }

  return {
    status: items.length ? "has-gaps" : "clear",
    items,
    buildTasks: [...new Set(buildTasks)]
  };
}
