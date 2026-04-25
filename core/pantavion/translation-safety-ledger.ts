export const translationSafetyLedger = {
  id: "translation-safety-ledger",
  title: "Pantavion Translation and Interpreter Safety Ledger",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Pantavion translation is central, but current claims must stay assistive unless certified human/professional interpreter support exists.",
  currentStatus: "assistive_translation_foundation",
  targetStatus: "high_confidence_interpreter_roadmap",
  blockedClaim:
    "Do not claim 100 percent certified legal, medical, court, police, immigration or professional translation accuracy without certified support.",
  requiredCapabilities: [
    "source language detection",
    "target language selection",
    "confidence score",
    "fallback emergency phrases",
    "medical/legal/emergency disclaimer",
    "elder mode",
    "offline phrase pack",
    "domain glossary",
    "human review path for high-risk contexts"
  ],
  highRiskContexts: [
    "medical",
    "legal",
    "court",
    "police",
    "immigration",
    "government",
    "contract",
    "financial",
    "emergency",
    "child/minor safety"
  ],
  gates: [
    "Every high-risk translation shows assistive disclaimer.",
    "Emergency phrases prefer verified phrase library.",
    "Confidence score required before professional claims.",
    "Human interpreter/provider path required for certified translation claims.",
    "Offline phrase pack must label timestamp/language/source."
  ],
  motto:
    "Translation unites people, but high-risk translation must be honest, labeled and reviewable."
} as const;
