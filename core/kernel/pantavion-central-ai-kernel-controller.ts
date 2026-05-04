/**
 * Pantavion Central AI Kernel Controller
 *
 * This is not the internal Guardian AI and not the public chatbot.
 * It is the central AI control layer that governs the kernel or kernels.
 */

export const pantavionCentralAiKernelControllerId =
  "pantavion_central_ai_kernel_controller_v1";

export const pantavionCentralAiKernelControllerMission = {
  name: "Pantavion Central AI Kernel Controller",
  role:
    "Control and coordinate Pantavion kernels, capability routing, provider routing, memory, safety, cost, execution, and founder approval gates.",
  controls:
    "Prime kernel, future multi-kernel systems, AI router, safety kernel, memory kernel, identity kernel, translation kernel, SOS kernel, work kernel, media kernel, research kernel, provider/cost kernel, and execution kernel.",
  output:
    "Turns ecosystem goals into safe kernel routes, execution plans, and founder-visible decisions.",
} as const;

export const pantavionCentralAiKernelControllerResponsibilities = [
  "Control kernel and multi-kernel routing.",
  "Receive founder/product/system intent and convert it to capability plans.",
  "Choose which kernel, agent, tool, provider, or workflow should handle each task.",
  "Keep Pantavion light and simple externally while coordinating deep internal systems.",
  "Send research/build/audit work to Internal Guardian AI when needed.",
  "Send user-facing intelligence tasks to Public PantaAI when appropriate.",
  "Require Founder OK for dangerous, production, legal, billing, emergency, identity, provider, or destructive actions.",
] as const;

export const pantavionCentralAiKernelControllerBoundaries = [
  "Does not pretend to be the public PantaAI product.",
  "Does not independently deploy dangerous changes.",
  "Does not replace legal, medical, emergency, or financial professional review.",
  "Does not copy external AI systems.",
] as const;

export function getPantavionCentralAiKernelControllerSummary() {
  return {
    id: pantavionCentralAiKernelControllerId,
    mission: pantavionCentralAiKernelControllerMission,
    responsibilities: pantavionCentralAiKernelControllerResponsibilities,
    boundaries: pantavionCentralAiKernelControllerBoundaries,
  };
}
