import type { CapabilityFamily, ClassificationResult } from "./types";
import { recommendCapabilitiesForText, getCapabilityById } from "./registry";

const guessFamily = (text: string): CapabilityFamily => {
  const lower = text.toLowerCase();

  if (lower.includes("code") || lower.includes("api") || lower.includes("typescript") || lower.includes("kernel")) {
    return "coding_app_building";
  }

  if (lower.includes("signal") || lower.includes("trend") || lower.includes("news")) {
    return "signal_intelligence";
  }

  if (lower.includes("learn") || lower.includes("course") || lower.includes("roadmap")) {
    return "learning_mastery";
  }

  if (lower.includes("shortcut") || lower.includes("cheatsheet") || lower.includes("reference")) {
    return "reference_cheatsheets";
  }

  if (lower.includes("privacy") || lower.includes("policy") || lower.includes("security")) {
    return "security_governance";
  }

  return "assistants_reasoning";
};

export const classifyKernelInput = (text: string): ClassificationResult => {
  const recommendedCapabilityIds = recommendCapabilitiesForText(text);
  const firstCapability = getCapabilityById(recommendedCapabilityIds[0]);
  const family = firstCapability?.family ?? guessFamily(text);

  return {
    family,
    confidence: recommendedCapabilityIds.length > 2 ? 0.88 : 0.76,
    recommendedCapabilityIds,
  };
};
