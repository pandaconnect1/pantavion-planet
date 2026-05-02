export type PantavionSosContact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: string;
};

export type PantavionSosProfile = {
  fullName: string;
  primaryLanguage: string;
  emergencyNumber: string;
  medicalNotes: string;
  allergies: string;
  bloodType: string;
  contacts: PantavionSosContact[];
  consent: boolean;
  updatedAt: string;
};

export type PantavionSosLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
};

export type PantavionSosDevice = {
  userAgent: string;
  platform: string;
  language: string;
  online: boolean;
  screen: string;
  timestamp: string;
};

export type PantavionSosPacket = {
  id: string;
  createdAt: string;
  source: "pantavion-web-pwa";
  status: "active";
  profile: PantavionSosProfile;
  location: PantavionSosLocation | null;
  device: PantavionSosDevice;
  message: string;
  offlineQueued: boolean;
  deliveryAttempts: number;
};

export type PantavionSosDispatchResult = {
  ok: boolean;
  delivery: "webhook" | "internal-api" | "queued" | "manual";
  message: string;
  receivedAt: string;
};
