/**
 * Pantavion AI Layer Separation Contract
 *
 * This file prevents conceptual mixing between three different AI layers.
 *
 * 1. Internal Guardian AI
 *    Internal worker/director/researcher/auditor/builder.
 *
 * 2. Central AI Kernel Controller
 *    Controls the kernel or multiple kernels, routes capabilities, governs
 *    memory/safety/providers/execution, and keeps Pantavion as one organism.
 *
 * 3. Public / Pure PantaAI
 *    The Pantavion-owned AI product layer comparable by capability category
 *    to modern AI assistants, coding agents, research assistants, multimodal
 *    AI, translation AI, tool-using AI, and future model systems.
 *
 * Non-negotiable:
 * Guardian AI is not Central AI.
 * Central AI is not Public PantaAI.
 * Public PantaAI is not copied from any provider.
 */

export const pantavionAiLayerSeparationId =
  "pantavion_ai_layer_separation_contract_v1";

export const pantavionAiLayerSeparationDoctrine = {
  internalGuardianAI:
    "Internal AI that observes, researches, finds gaps, audits, prepares upgrades, coordinates builders/agents/tools, and reports to founder approval gates.",
  centralAIKernelController:
    "Central AI controller that governs Pantavion kernel or multi-kernel routing, capability orchestration, memory, safety, providers, and execution decisions.",
  publicPurePantaAI:
    "Pantavion-owned AI product layer for users and businesses: reasoning, chat, coding, research, translation, multimodal creation, tools, agents, documents, education, work, and automation.",
  legalTechnologyRule:
    "Pantavion studies global AI capabilities legally and builds its own technologies, architecture, orchestration, workflows, UI, data rules, safety systems, and provider abstractions.",
} as const;

export const pantavionAiLayerOrder = [
  "FOUNDER",
  "CENTRAL_AI_KERNEL_CONTROLLER",
  "KERNELS",
  "INTERNAL_GUARDIAN_AI",
  "AGENTS_TOOLS_BUILDERS_RESEARCHERS",
  "PUBLIC_PANTA_AI",
  "USERS_BUSINESSES_SERVICES",
] as const;

export const pantavionAiLayerNonConfusionRules = [
  "Internal Guardian AI must not be described as the public AI product.",
  "Central AI Kernel Controller must not be described as only a chatbot.",
  "Public PantaAI must not be described as the internal Guardian.",
  "Public PantaAI may use providers, tools, agents, and models, but must remain Pantavion-owned in orchestration, governance, memory, UX, and execution doctrine.",
  "Legal global research may study capabilities and patterns, not copy protected code, brands, private data, proprietary UI, logos, model claims, or restricted implementations.",
] as const;

export function getPantavionAiLayerSeparationSummary() {
  return {
    id: pantavionAiLayerSeparationId,
    doctrine: pantavionAiLayerSeparationDoctrine,
    order: pantavionAiLayerOrder,
    rules: pantavionAiLayerNonConfusionRules,
  };
}
