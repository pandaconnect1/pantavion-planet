import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const hardwareDomain: PantavionDomainRegistry = {
  id: "hardware",
  name: "Hardware",
  continents: pantavionContinents,
  purpose: "Devices, sensors, edge systems, offline packs, SOS hardware integration and field equipment.",
  watchTargets: ["sensors", "edge devices", "satellite devices", "mobile", "NFC", "QR", "offline storage"],
  capabilityTargets: ["off-grid SOS", "field devices", "water telemetry", "edge runtime"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["hardware provider integration", "device identity", "safety-critical hardware actions"],
};
