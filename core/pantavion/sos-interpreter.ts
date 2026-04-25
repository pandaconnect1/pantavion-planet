export const pantavionSosInterpreter = {
  id: "pantavion-sos-interpreter",
  title: "Pantavion SOS+Interpreter",
  status: "mandatory-life-safety-foundation",
  priority: "critical-red-zone",
  summary:
    "Pantavion SOS+Interpreter combines emergency assistance, multilingual interpretation, offline identity support, emergency-circle routing, elder care support, tourism help and public-safety communication into one governed life-protection layer.",
  supremeRule:
    "SOS+Interpreter must never be fake, casual, decorative or overpromised. It must assist, translate, preserve context, guide the user, notify approved contacts where available and clearly state legal/provider limits.",
  coreModes: [
    "Normal Interpreter",
    "Emergency Interpreter",
    "Offline Emergency Identity Pack",
    "Emergency Circle",
    "Institutional Alerts"
  ],
  emergencyContexts: [
    "medical distress",
    "allergy",
    "lost person",
    "elderly confusion",
    "accident",
    "violence threat",
    "war/conflict",
    "earthquake",
    "fire",
    "flood",
    "maritime danger",
    "aviation incident",
    "remote-area danger",
    "no signal",
    "weak signal",
    "language barrier with authority",
    "public utility outage",
    "community alert"
  ],
  fallbackStates: [
    {
      state: "online",
      behavior:
        "Use live translation, emergency-circle routing, provider-backed services where connected and audit logging."
    },
    {
      state: "weak_network",
      behavior:
        "Prioritize short emergency phrases, compressed messages, cached contacts and retry queue."
    },
    {
      state: "offline",
      behavior:
        "Show offline identity pack, cached phrases, QR/NFC/local display, siren/flash/haptic options and later-sync queue."
    },
    {
      state: "provider_required",
      behavior:
        "Clearly mark functions that need certified satellite, emergency, telephony, authority, medical or legal providers."
    }
  ],
  blockedClaims: [
    "Do not claim guaranteed rescue.",
    "Do not claim certified emergency dispatch without provider contracts.",
    "Do not claim medical diagnosis.",
    "Do not claim legal advice.",
    "Do not claim perfect translation in high-risk contexts.",
    "Do not claim satellite SOS unless certified hardware/provider integration exists.",
    "Do not silently track or notify contacts."
  ],
  gates: [
    "Emergency data consent model exists.",
    "Emergency Circle setup exists.",
    "Offline Identity Pack schema exists.",
    "Translation confidence model is connected.",
    "High-risk disclaimer exists.",
    "Minors protection route exists.",
    "Provider-required functions are labeled.",
    "Human review path exists for Red Zone.",
    "Audit and founder report triggers exist."
  ],
  motto:
    "When language, danger and time collide, Pantavion must remain clear, lawful, calm, helpful and honest."
} as const;
