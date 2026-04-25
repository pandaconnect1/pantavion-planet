export const translationConfidenceModel = {
  id: "translation-confidence-model",
  title: "Global Interpreter and Translation Confidence Model",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion's second heart is bidirectional language access: speech, text, captions, radio, elder support, tourism, work, seminars and elite communication.",
  gates: [
    "Do not publicly claim perfect translation before validation.",
    "Show confidence levels for important translations.",
    "Use domain glossaries for medicine, law, government, aviation, maritime, finance and emergency contexts.",
    "Escalate high-risk translation to human/professional verification where needed.",
    "Provide offline phrase packs for elder care, travel and emergency survival contexts.",
    "Allow user to hear, read, speak and respond in their own language."
  ],
  modes: [
    "Everyday Conversation",
    "Live Bidirectional Voice",
    "Captions and Subtitles",
    "Radio Translation",
    "Message Translation",
    "Emergency Phrase Mode",
    "Elder Care Mode",
    "Tourism Mode",
    "Professional Seminar Mode",
    "Elite Interpreter Mode",
    "Medical/Legal Warning Mode",
    "Offline Phrase Pack"
  ]
} as const;
