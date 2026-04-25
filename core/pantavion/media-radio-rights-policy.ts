export const mediaRadioRightsPolicy = {
  id: "media-radio-rights-policy",
  title: "Media, Radio and Broadcast Rights Policy",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion Radio and Media can become a 24-hour multilingual network for news, sports, culture, music, creator shows, emergency announcements and user messages.",
  gates: [
    "No copyrighted music, video or sports broadcast without license.",
    "Separate news, opinion, sponsorship and user-submitted content.",
    "Moderate user messages before broadcast.",
    "Verified authorities only can trigger emergency/public alert interruption lanes.",
    "Use licensed or consented voices for TTS and dubbing.",
    "Maintain correction policy, source policy and sponsor labels."
  ],
  modules: [
    "Internet Radio",
    "News Desk",
    "Sports Desk",
    "Culture Desk",
    "Creator Shows",
    "User Message to Broadcast",
    "Text/Voice to Translated Voice",
    "Emergency Broadcast Lane",
    "Local Authority Channel",
    "Music Rights Lane",
    "Sponsorship Disclosure"
  ]
} as const;
