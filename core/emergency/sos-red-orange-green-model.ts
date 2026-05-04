/**
 * Pantavion SOS Red / Orange / Green Model
 */

export const pantavionSosRedOrangeGreenModelId =
  "pantavion_sos_red_orange_green_model_v1";

export const pantavionSosRedModel = {
  color: "red",
  name: "Red SOS",
  role:
    "Immediate high-stress emergency mode with one dominant action, local packet creation, device actions, trusted contact readiness, and provider-gated delivery.",
  elderRule:
    "For elders and protected users, red must stay one clear action first, not a confusing list of equal buttons.",
  boundary:
    "Red can trigger local/browser/device/provider-ready actions. Official emergency integrations require approved providers and legal coverage.",
} as const;

export const pantavionSosOrangeModel = {
  color: "orange",
  name: "Orange Translation and Help",
  role:
    "Assistive translation/help mode for communication with helper, nurse, doctor, taxi, public service, home assistant, family, or other person.",
  defaultMode:
    "Automatic speech language detection is the default target for future live provider integration.",
  backupMode:
    "Manual second/helper language is backup only, exposed through elder-helper-language selector.",
  boundary:
    "Translation is assistive, not guaranteed legal, medical, emergency, or professional interpretation.",
} as const;

export const pantavionSosGreenModel = {
  color: "green",
  name: "Green AI Friend and Journal",
  role:
    "Companionship, local journal, emotional support, memory notes, and daily continuity for protected users.",
  privacy:
    "Green history is private by default. Family or caregiver access requires consent, guardian policy, or lawful process.",
  boundary:
    "Green companion must not diagnose, prescribe, replace emergency help, or replace medical care.",
} as const;

export const pantavionSosColorSeparationRules = [
  "Red emergency action must not expose private green journal by default.",
  "Orange translation/help must not grant caregiver access to green history.",
  "Green companion must escalate to red/orange guidance when emergency or immediate danger appears.",
  "Each color lane must preserve language memory and continuity.",
] as const;

export function getPantavionSosRedOrangeGreenModel() {
  return {
    id: pantavionSosRedOrangeGreenModelId,
    red: pantavionSosRedModel,
    orange: pantavionSosOrangeModel,
    green: pantavionSosGreenModel,
    separationRules: pantavionSosColorSeparationRules,
  };
}
