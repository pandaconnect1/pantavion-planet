export const pantavionUniversalInterpreterContract = {
  id: "pantavion_universal_interpreter_contract_v1",
  productName: "PantaTranslate",
  status: "platform_kernel_provider_ready",
  doctrine:
    "Universal translation must live at Pantavion platform level. SOS, elder mode, travel, social, work, accessibility, camera scan, and PantaAI all use the same translation kernel.",
  lockedRequirements: {
    notSosOnly:
      "Translation must not be trapped inside SOS. SOS orange translation is one emergency mode of the universal interpreter.",
    naturalLanguageUniverseTarget:
      "Preserve 7000+ natural language / dialect / language-identity target for future provider and model expansion.",
    practicalMenu:
      "Keep at least 250 selectable practical languages now. Do not shrink to 10, 15, or provider marketing limits.",
    userLanguage:
      "Each user has a natural language and UI language that can be changed whenever the user chooses.",
    bidirectionalLiveInterpreter:
      "User A speaks naturally; User B hears/reads in their own language. User B replies naturally; User A hears/reads in their own language.",
    samePhoneMode:
      "One phone can act as two-person interpreter for street, tourism, taxi, doctor, home assistant, nightlife, and emergency use.",
    twoDeviceMode:
      "Two Pantavion devices can run a future secure shared interpreter session.",
    socialMode:
      "Pantavion social chat, voice, and video should translate across countries so users can communicate freely.",
    cameraMode:
      "Camera/text/sign/menu/document scan must be part of the same translation system, with OCR/provider gate.",
    accessibilityMode:
      "Audio, large text, captions, subtitles, and voice output must support disabled users and protected users.",
    elderSimpleMode:
      "Elders see a simplified UI: their language, speak button, listen button, SOS, and helper backup. They do not face a confusing 250-language wall unless they tap change language.",
    providerTruth:
      "Real speech-to-text, translation, OCR, and text-to-speech require configured providers. The UI must expose provider-pending truth instead of pretending."
  },
  lanes: [
    "text_to_text",
    "speech_to_text",
    "speech_to_speech",
    "voice_to_subtitles",
    "camera_to_text",
    "camera_to_voice",
    "same_phone_turns",
    "two_device_session",
    "social_message_translation",
    "pantaai_translation"
  ],
  emergencyBinding: {
    sosOrangeUsesPantaTranslate: true,
    redSosRemainsOneAction: true,
    greenAiFriendRemainsPrivate: true
  }
} as const;

export type PantavionUniversalInterpreterContract =
  typeof pantavionUniversalInterpreterContract;
