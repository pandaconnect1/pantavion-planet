export const pantavionSpeechAccessibilityContract = {
  id: "pantavion_speech_accessibility_contract_v1",
  appliesTo: ["translate", "social", "chat", "voice", "video", "group_room"],
  principles: [
    "accept_disfluent_speech",
    "accept_articulation_variation",
    "preserve_original_transcript",
    "normalize_only_when_confident",
    "preserve_names_numbers_negation_and_meaning",
    "never_diagnose_the_speaker",
    "never_require_perfect_pronunciation",
    "never_invent_when_ambiguous",
  ],
  examples: {
    disfluency: ["stutter", "word_repetition", "syllable_repetition", "hesitation"],
    articulation: ["r_sound_variation", "s_sound_variation", "other_speech_sound_variation"],
  },
} as const;
