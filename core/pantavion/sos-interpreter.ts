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
    {
      key: "normal_interpreter",
      name: "Normal Interpreter",
      risk: "green-yellow",
      description:
        "Everyday bidirectional translation for travel, work, family, social communication, care workers, seminars and professional situations.",
      allowed: [
        "text translation",
        "voice translation",
        "conversation mode",
        "captions",
        "phrase help",
        "tourism assistance",
        "elder-care communication"
      ],
      boundaries: [
        "Show confidence when relevant.",
        "Do not claim certified legal or medical interpretation unless provider/human review exists."
      ]
    },
    {
      key: "emergency_interpreter",
      name: "Emergency Interpreter",
      risk: "red",
      description:
        "High-priority translation for danger, injury, illness, police, rescue, maritime, aviation, war, disaster, lost person, elderly confusion or urgent public-safety context.",
      allowed: [
        "emergency phrases",
        "large-screen local display",
        "read-aloud translation",
        "medical/allergy phrase display",
        "location/context prompt",
        "emergency-circle message draft"
      ],
      boundaries: [
        "Do not diagnose.",
        "Do not guarantee rescue.",
        "Do not impersonate authorities.",
        "Do not auto-dispatch authorities without contracts and lawful integration."
      ]
    },
    {
      key: "offline_identity_pack",
      name: "Offline Emergency Identity Pack",
      risk: "red",
      description:
        "Local device emergency profile for weak-signal/offline situations, including opt-in identity, language, emergency contacts, medical phrases, allergies and QR/NFC/local display support.",
      allowed: [
        "offline profile display",
        "QR/NFC rescue card",
        "cached emergency phrases",
        "emergency contacts",
        "language and country flags",
        "local event queue for later sync"
      ],
      boundaries: [
        "Requires opt-in data.",
        "Must be editable/deletable by user.",
        "Must not expose sensitive data without deliberate emergency display mode."
      ]
    },
    {
      key: "emergency_circle",
      name: "Emergency Circle",
      risk: "red",
      description:
        "Trusted contacts chosen by the user for urgent alerts before any institutional integration exists.",
      allowed: [
        "trusted contact selection",
        "urgent message draft",
        "last-known context when permitted",
        "language-aware emergency notice",
        "weak/offline pending queue"
      ],
      boundaries: [
        "No hidden tracking.",
        "No silent surveillance.",
        "No contact messaging without user permission or explicit emergency-mode rules."
      ]
    },
    {
      key: "institutional_alerts",
      name: "Institutional Alerts",
      risk: "red-regulated",
      description:
        "Future verified authority, municipality, school, hospital, maritime, aviation or public body alert channel.",
      allowed: [
        "verified public alerts",
        "local emergency notices",
        "radio interruption requests",
        "multilingual public announcements",
        "institution dashboards"
      ],
      boundaries: [
        "Provider/legal/institution contracts required.",
        "Verified authority only.",
        "Full audit trail required.",
        "No fake official alerts."
      ]
    }
  ],
  userGroups: [
    "elderly users",
    "tourists",
    "families",
    "care workers",
    "immigrants",
    "workers abroad",
    "drivers",
    "maritime users",
    "aviation travelers",
    "students",
    "disabled users",
    "public institutions",
    "emergency contacts",
    "elite/private users"
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
  requiredControls: [
    "Explicit user consent for stored emergency data.",
    "Emergency Circle setup before live alerts.",
    "Offline mode labels: online, weak network, offline, satellite-supported only if certified provider exists.",
    "No automatic authority dispatch without signed institutional/provider contracts.",
    "Human/professional review path for medical, legal, police, immigration, public safety and institutional use.",
    "Clear disclaimer: assistive translation, not guaranteed certified interpretation.",
    "Large emergency display mode for rescuers or nearby humans.",
    "Audit trail for critical events.",
    "Local-only fallback when no network exists.",
    "Founder/operator report for provider gaps, failures or future institutional opportunities."
  ],
  aiRiskZones: {
    green: [
      "general phrase translation",
      "tourism help",
      "basic conversation mode",
      "elder-care daily communication",
      "read-aloud non-critical text"
    ],
    yellow: [
      "professional interpretation",
      "care instructions",
      "route guidance",
      "urgent context summarization",
      "family alert drafting"
    ],
    red: [
      "medical emergency",
      "police/legal context",
      "authority communication",
      "life-threatening danger",
      "minors emergency",
      "public safety alerts",
      "institutional broadcasts",
      "SOS dispatch logic"
    ]
  },
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
    },
    {
      state: "human_review_required",
      behavior:
        "Escalate high-risk translation or alert flows to human/professional/institutional review where required."
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
  releaseGates: [
    "Emergency data consent model exists.",
    "Emergency Circle setup exists.",
    "Offline Identity Pack data schema exists.",
    "Translation confidence model is connected.",
    "High-risk disclaimer exists.",
    "Minors protection route exists.",
    "No-dead-button status is clear.",
    "Provider-required functions are labeled.",
    "Human review path exists for Red Zone.",
    "Audit and founder report triggers exist."
  ],
  founderReportTriggers: [
    "SOS activation",
    "offline SOS activation",
    "emergency-circle failure",
    "translation confidence too low in Red Zone",
    "missing emergency provider",
    "public safety alert request",
    "institutional integration request",
    "elder/minor safety event",
    "maritime/aviation/satellite provider requirement"
  ],
  motto:
    "When language, danger and time collide, Pantavion must remain clear, lawful, calm, helpful and honest."
} as const;
