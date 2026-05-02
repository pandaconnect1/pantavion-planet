export type EmergencyReliabilityLevel =
  | "available-now"
  | "device-dependent"
  | "hardware-required"
  | "institution-required"
  | "future-roadmap";

export type EmergencySignalChannel =
  | "cellular"
  | "wifi"
  | "bluetooth"
  | "ble-beacon"
  | "local-screen"
  | "qr"
  | "nfc"
  | "device-satellite"
  | "lora"
  | "vhf"
  | "uhf"
  | "hf"
  | "epirb"
  | "plb"
  | "elt"
  | "ais-mob"
  | "gmdss"
  | "rescue-gateway";

export type EmergencySystemLayer = {
  id: string;
  name: string;
  purpose: string;
  reliability: EmergencyReliabilityLevel;
  channels: EmergencySignalChannel[];
  availableWithNormalPhone: boolean;
  requiresSpecialHardware: boolean;
  requiresInstitutionalAgreement: boolean;
  truthBoundary: string;
};

export type EmergencyCapability = {
  id: string;
  name: string;
  description: string;
  layerId: string;
  reliability: EmergencyReliabilityLevel;
  enabledByDefault: boolean;
  legalNotice: string;
};

export type EmergencyDoctrine = {
  systemName: string;
  officialName: string;
  mission: string;
  publicClaim: string;
  forbiddenClaims: string[];
  layers: EmergencySystemLayer[];
  capabilities: EmergencyCapability[];
};
