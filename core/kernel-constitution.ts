import type { KernelModuleKey, DeliveryMode } from "./kernel-types";

export const KERNEL_NAME = "Pantavion Kernel OS";
export const KERNEL_VERSION = 1;

export const KERNEL_CONSTITUTION = {
  id: "pantavion-kernel-os",
  version: KERNEL_VERSION,
  mission:
    "Build, govern and evolve complex real digital ecosystems with controlled self-modernization.",
  doctrine: {
    corePrinciple: "Controlled Sovereign Self-Building",
    rule1: "No chaotic self-modification.",
    rule2: "Kernel is the single source of truth.",
    rule3: "All important changes must be remembered.",
    rule4: "All execution must be auditable.",
    rule5: "Core architecture cannot be broken by extensions.",
    rule6: "Evolution must be reviewable and reversible.",
    rule7: "Pantavion core surfaces remain ad-free outside Ads Center."
  },
  modules: [
    "Kernel",
    "People",
    "Chat",
    "Voice",
    "Pulse",
    "Compass",
    "Mind",
    "Create",
    "PantaLearn",
    "Tools Hub",
    "Business Layer",
    "Research Layer",
    "Ads Center"
  ] satisfies KernelModuleKey[],
  deliveryModes: [
    "native-feature",
    "connector",
    "catalog",
    "course",
    "workflow"
  ] satisfies DeliveryMode[]
};
