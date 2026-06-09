import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const communicationDomain: PantavionDomainRegistry = {
  id: "communication",
  name: "Communication",
  continents: pantavionContinents,
  purpose: "Translation, voice, video, messaging, subtitles, social communication and real-time multilingual interaction.",
  watchTargets: ["translation", "voice", "video", "messaging", "subtitles", "social graph"],
  capabilityTargets: ["Universal Communication", "PantaTranslate", "voice/video interpreter"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["voice cloning", "biometric features", "private message processing"],
};
