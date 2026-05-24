export const pantavionVoiceTranslationCompletionLedger = {
  id: "pantavion_voice_translation_completion_ledger_v1",
  truth:
    "Voice Translation is not complete until it supports live microphone input, automatic language detection, streaming transcription, translation, subtitles, voice output, bidirectional conversation, domain terminology, offline phrase packs, and provider-backed production configuration.",
  requiredRuntimeCapabilities: [
    "mic_input",
    "auto_language_detection",
    "streaming_transcription",
    "live_translation",
    "live_subtitles",
    "speech_output",
    "two_person_conversation_mode",
    "professional_terminology_memory",
    "medical_legal_scientific_emergency_modes",
    "offline_phrase_packs",
    "global_user_language_memory",
    "provider_router_production_keys",
  ],
  currentReality:
    "Pantavion has translation API, live text route, and browser speech foundation. It is not yet complete world-class voice translation.",
  nextBuildOrder: [
    "Provider Router v1",
    "Speech Provider Adapter v1",
    "Conversation Session Runtime",
    "Terminology Memory Store",
    "Offline Phrase Pack Runtime",
    "Subtitle Stream Runtime",
  ],
} as const;
