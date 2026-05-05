export const PANTAVION_SOS_AI_CENTER_LOCK = {
  marker: "PANTAVION_SOS_AI_CENTER_V1",
  doctrine:
    "SOS Pantavion is a life-protection layer. It can use the Universal Interpreter, trusted contacts, local emergency identity, elder-simple mode, and AI wording. It must not claim automatic authority dispatch without certified provider agreements.",
  universalInterpreterRoute: "/translate",
  emergencyCircleFirst: true,
  authorityDispatchRequiresContract: true,
  offGridRoadmap: true,
} as const;

export const PANTAVION_SOS_SAFE_PHRASES = [
  "I need help.",
  "Please call my emergency contact.",
  "I do not speak this language.",
  "I am lost.",
  "I feel unsafe.",
  "I need a doctor.",
  "I need the police.",
  "I need an ambulance.",
  "Please stay with me.",
  "Please write slowly.",
] as const;
