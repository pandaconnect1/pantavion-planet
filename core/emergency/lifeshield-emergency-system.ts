import type {
  EmergencyCapability,
  EmergencyDoctrine,
  EmergencySystemLayer,
} from "@/types/pantavion-emergency";

export const PANTAVION_EMERGENCY_SYSTEM_NAME =
  "Pantavion LifeShield Emergency System";

export const emergencyLayers: EmergencySystemLayer[] = [
  {
    id: "human-survival-layer",
    name: "Human Survival Layer",
    purpose:
      "Keeps the person identifiable, translatable, and medically understandable even without internet.",
    reliability: "available-now",
    channels: ["local-screen", "qr", "nfc"],
    availableWithNormalPhone: true,
    requiresSpecialHardware: false,
    requiresInstitutionalAgreement: false,
    truthBoundary:
      "Works locally on the device when the emergency profile has been created in advance.",
  },
  {
    id: "phone-emergency-layer",
    name: "Phone Emergency Layer",
    purpose:
      "Uses the phone first: SOS UI, offline event queue, last known location, flash, siren, haptics, and emergency contacts when signal returns.",
    reliability: "device-dependent",
    channels: [
      "cellular",
      "wifi",
      "bluetooth",
      "ble-beacon",
      "local-screen",
      "device-satellite",
    ],
    availableWithNormalPhone: true,
    requiresSpecialHardware: false,
    requiresInstitutionalAgreement: false,
    truthBoundary:
      "A normal phone cannot transmit HF, VHF, UHF, LoRa, EPIRB, PLB, or ELT signals without compatible hardware.",
  },
  {
    id: "nearby-signal-layer",
    name: "Nearby Signal Layer",
    purpose:
      "Discovers or alerts nearby devices and rescue scanners where the operating system permits local radio discovery.",
    reliability: "device-dependent",
    channels: ["bluetooth", "ble-beacon", "wifi"],
    availableWithNormalPhone: true,
    requiresSpecialHardware: false,
    requiresInstitutionalAgreement: false,
    truthBoundary:
      "Bluetooth, BLE, and Wi-Fi behavior depends on OS permissions, hardware support, battery, terrain, and rescue-side scanning tools.",
  },
  {
    id: "disaster-mesh-layer",
    name: "Disaster Mesh Layer",
    purpose:
      "Adds LoRa rescue nodes, village hubs, mountain relays, disaster-zone boxes, and rescue-team gateways.",
    reliability: "hardware-required",
    channels: ["lora", "rescue-gateway"],
    availableWithNormalPhone: false,
    requiresSpecialHardware: true,
    requiresInstitutionalAgreement: false,
    truthBoundary:
      "LoRa and mesh rescue coverage require deployed hardware, tuned radios, gateways, power planning, and field testing.",
  },
  {
    id: "maritime-aviation-remote-layer",
    name: "Maritime / Aviation / Remote Layer",
    purpose:
      "Connects Pantavion emergency identity and routing with certified maritime, aviation, satellite, and remote rescue systems.",
    reliability: "institution-required",
    channels: ["epirb", "plb", "elt", "ais-mob", "gmdss", "hf", "vhf", "uhf"],
    availableWithNormalPhone: false,
    requiresSpecialHardware: true,
    requiresInstitutionalAgreement: true,
    truthBoundary:
      "EPIRB, PLB, ELT, GMDSS, HF, VHF, and UHF emergency operations require certified devices, legal radio use, rescue authority processes, and institutional agreements.",
  },
  {
    id: "institutional-sar-layer",
    name: "Institutional SAR Gateway",
    purpose:
      "Routes verified emergency events to lawful rescue partners, authorities, hospitals, coast guards, civil protection, and SAR centers.",
    reliability: "institution-required",
    channels: ["rescue-gateway"],
    availableWithNormalPhone: false,
    requiresSpecialHardware: false,
    requiresInstitutionalAgreement: true,
    truthBoundary:
      "Pantavion must not promise automatic authority dispatch before signed agreements, verified routing, false-alarm controls, and audit procedures exist.",
  },
];

export const emergencyCapabilities: EmergencyCapability[] = [
  {
    id: "offline-emergency-identity-pack",
    name: "Offline Emergency Identity Pack",
    description:
      "Stores opt-in emergency identity, language, medical basics, allergies, trusted contacts, survival phrases, QR/NFC rescue card, and last known context.",
    layerId: "human-survival-layer",
    reliability: "available-now",
    enabledByDefault: true,
    legalNotice:
      "User-controlled, opt-in, minimal emergency data. Not a substitute for official medical records.",
  },
  {
    id: "pantavion-disaster-mode",
    name: "Pantavion Disaster Mode",
    description:
      "Emergency state for earthquakes, fires, floods, war zones, infrastructure collapse, blackouts, and mass network failure.",
    layerId: "phone-emergency-layer",
    reliability: "device-dependent",
    enabledByDefault: true,
    legalNotice:
      "Availability depends on device power, OS permissions, local laws, network return, and configured emergency contacts.",
  },
  {
    id: "pantavion-offline-beacon",
    name: "Pantavion Offline Beacon",
    description:
      "Local emergency beacon using screen, QR, NFC, flash, siren, vibration, offline queue, and nearby-device discovery where possible.",
    layerId: "phone-emergency-layer",
    reliability: "device-dependent",
    enabledByDefault: true,
    legalNotice:
      "A phone beacon is not an EPIRB, PLB, ELT, satellite beacon, or certified rescue transmitter.",
  },
  {
    id: "pantavion-multi-signal-sos",
    name: "Pantavion Multi-Signal SOS",
    description:
      "Uses every lawful and available signal path: cellular, Wi-Fi, Bluetooth, BLE, compatible device satellite, LoRa hardware, rescue gateways, and certified emergency integrations.",
    layerId: "nearby-signal-layer",
    reliability: "hardware-required",
    enabledByDefault: false,
    legalNotice:
      "Radio, LoRa, HF, VHF, UHF, maritime, aviation, and SAR integrations require compatible hardware, certification, and legal operating authority.",
  },
  {
    id: "pantavion-safepulse",
    name: "Pantavion SafePulse",
    description:
      "Future life-signal and survival-state capability using motion, sound, device sensors, wearables, rescue hardware, and explicit user consent.",
    layerId: "disaster-mesh-layer",
    reliability: "future-roadmap",
    enabledByDefault: false,
    legalNotice:
      "No claim of guaranteed vital-sign detection under rubble or through concrete. Requires validated sensors and rescue-grade testing.",
  },
  {
    id: "pantavion-global-emergency-network",
    name: "Pantavion Global Emergency Network",
    description:
      "The long-term planetary emergency network connecting people, phones, offline identity, local mesh, rescue hardware, institutions, and SAR partners.",
    layerId: "institutional-sar-layer",
    reliability: "institution-required",
    enabledByDefault: false,
    legalNotice:
      "Global rescue routing requires formal agreements, jurisdiction controls, audit logs, consent, and false-alarm governance.",
  },
];

export const pantavionEmergencyDoctrine: EmergencyDoctrine = {
  systemName: "lifeshield",
  officialName: PANTAVION_EMERGENCY_SYSTEM_NAME,
  mission:
    "Keep a human being visible, identifiable, translatable, locatable, and reachable under degraded or collapsed network conditions.",
  publicClaim:
    "Phone-first. Offline-ready. Satellite-aware. Hardware-expandable. Institution-compatible. Truth-governed.",
  forbiddenClaims: [
    "Pantavion saves everyone everywhere.",
    "A normal phone can transmit HF, VHF, UHF, LoRa, EPIRB, PLB, or ELT without special hardware.",
    "Pantavion can send emergency messages through ten meters of concrete.",
    "Pantavion guarantees rescue dispatch without institutional agreements.",
    "Pantavion detects vital signs under rubble without validated sensors.",
    "Pantavion replaces official emergency services, EPIRB, PLB, ELT, GMDSS, or certified SAR systems.",
  ],
  layers: emergencyLayers,
  capabilities: emergencyCapabilities,
};

export function getEmergencyLayerById(layerId: string) {
  return emergencyLayers.find((layer) => layer.id === layerId) ?? null;
}

export function getEmergencyCapabilitiesByLayer(layerId: string) {
  return emergencyCapabilities.filter((capability) => capability.layerId === layerId);
}

export function getAvailableNowEmergencyCapabilities() {
  return emergencyCapabilities.filter(
    (capability) =>
      capability.reliability === "available-now" ||
      capability.reliability === "device-dependent"
  );
}

export function getHardwareRequiredEmergencyCapabilities() {
  return emergencyCapabilities.filter(
    (capability) =>
      capability.reliability === "hardware-required" ||
      capability.reliability === "institution-required"
  );
}
