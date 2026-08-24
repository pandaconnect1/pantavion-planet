import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const roboticsDomain: PantavionDomainRegistry = {
  id: "robotics",
  name: "Robotics",
  continents: pantavionContinents,
  purpose: "Automation, industrial robotics, inspection systems, drones and future physical-world execution.",
  watchTargets: ["robots", "drones", "inspection systems", "automation", "control systems"],
  capabilityTargets: ["inspection agents", "field automation", "infrastructure monitoring"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["physical-world action", "robotic control", "safety-critical automation"],
};
