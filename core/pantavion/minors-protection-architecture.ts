export const minorsProtectionArchitecture = {
  id: "minors-protection-architecture",
  title: "Minors Protection Architecture",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion is for all ages, but minors require strict separation, age-aware design, safe discovery and no adult leakage.",
  gates: [
    "Age-aware onboarding before sensitive features.",
    "No adult zone access for minors.",
    "No adult ads to minors.",
    "No sensitive targeting.",
    "No direct adult-minor discovery.",
    "Safe teen environment only within age-appropriate rules.",
    "Guardian/parent logic where legally required.",
    "School/education features separated from adult/social/dating.",
    "Reporting and escalation for grooming, exploitation or abuse.",
    "Strict moderation for youth communities."
  ],
  youthAllowedSurfaces: ["learning", "language", "culture", "safe entertainment", "family communication", "age-appropriate community", "school support"],
  youthBlockedSurfaces: ["adult connect", "explicit media", "adult ads", "high-risk finance", "unmoderated dating", "unsafe stranger discovery"]
} as const;
