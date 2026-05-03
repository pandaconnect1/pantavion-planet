export type ProtectedUserModeId =
  | "minor"
  | "elder"
  | "access"
  | "solo"
  | "standard";

export type ProtectedUserRole =
  | "user"
  | "minor"
  | "parent"
  | "legal-guardian"
  | "family-trusted-person"
  | "emergency-contact"
  | "caregiver-limited"
  | "institution-contact"
  | "founder-admin";

export type ProtectedAccessLevel =
  | "none"
  | "live-help-only"
  | "emergency-only"
  | "family-summary-only"
  | "full-user-controlled"
  | "legal-guardian-controlled"
  | "admin-aggregate-only";

export type ProtectedCapabilityStatus =
  | "implemented-now"
  | "ready-next"
  | "blocked-auth"
  | "blocked-provider"
  | "blocked-legal"
  | "blocked-native"
  | "blocked-cost";

export type ProtectedSafetyMode = {
  id: ProtectedUserModeId;
  label: string;
  greekLabel: string;
  primaryUsers: string[];
  defaultUiPrinciples: string[];
  immediateActions: string[];
  blockedUntilLater: string[];
  safetyBoundaries: string[];
};

export type ProtectedRoleAccessRule = {
  role: ProtectedUserRole;
  defaultAccess: ProtectedAccessLevel;
  canSeeGreenAiHistoryByDefault: boolean;
  canReceiveRedSosAlerts: boolean;
  canUseOrangeLiveTranslation: boolean;
  notes: string;
};

export const PANTAVION_PROTECTED_USERS_FRAMEWORK_VERSION = "1.0.0";

export const PANTAVION_PROTECTED_USERS_GREEK_REMINDER =
  "ΥΠΕΝΘΥΜΙΣΗ: Ανήλικοι, ηλικιωμένοι, άτομα με ειδικές ανάγκες και ευάλωτοι χρήστες δεν πρέπει να έχουν γενικό ίδιο flow. Θέλουν απλό UI, καθαρούς ρόλους, συναίνεση, προστασία από λάθος φροντιστή, local-first ιστορικό και κανένα ψεύτικο ιατρικό ή κρατικό SOS claim.";

export const pantavionProtectedUsersSafetyFramework: ProtectedSafetyMode[] = [
  {
    id: "minor",
    label: "Minor Protected Mode",
    greekLabel: "Λειτουργία Ανήλικου",
    primaryUsers: [
      "children",
      "teenagers",
      "school/travel contexts",
      "bullying-risk users",
      "guardian-supervised users"
    ],
    defaultUiPrinciples: [
      "very simple actions",
      "guardian-first escalation",
      "no public exposure by default",
      "safe wording",
      "no complex settings during danger",
      "clear emergency/need-help separation"
    ],
    immediateActions: [
      "SOS to predeclared trusted circle",
      "Need Help quick action",
      "Message guardian/family trusted person",
      "bullying/violence safe-exit path",
      "local incident note with date/time"
    ],
    blockedUntilLater: [
      "verified guardian account relationship",
      "cloud sync",
      "push/SMS backend",
      "school/institution role policy",
      "country-by-country minor consent review"
    ],
    safetyBoundaries: [
      "minor data must be minimized",
      "guardian access requires lawful role and consent policy",
      "no public social exposure by default",
      "no authority dispatch claim without provider/legal approval"
    ]
  },
  {
    id: "elder",
    label: "Elder Safe Mode",
    greekLabel: "Λειτουργία Ηλικιωμένου",
    primaryUsers: [
      "elderly users",
      "people living alone",
      "low-vision users",
      "panic/confusion-risk users",
      "users needing companionship"
    ],
    defaultUiPrinciples: [
      "extra large buttons",
      "high contrast colors",
      "few choices",
      "voice-first interaction",
      "date/time history",
      "local-first memory",
      "family sharing only by consent"
    ],
    immediateActions: [
      "one red SOS action",
      "orange live help/translation",
      "green AI friend/support conversation",
      "local voice/text session history",
      "important concern markers",
      "optional family summary by user permission"
    ],
    blockedUntilLater: [
      "real voice AI provider",
      "speech-to-text and text-to-speech provider",
      "secure cloud family dashboard",
      "verified emergency contacts",
      "native fall/crash/background detection"
    ],
    safetyBoundaries: [
      "caregiver does not get automatic access",
      "AI gives support and general knowledge but no diagnosis",
      "red danger signs route to SOS/local emergency help/human support",
      "stored audio/text must be visible and deletable by the user"
    ]
  },
  {
    id: "access",
    label: "Accessibility Protected Mode",
    greekLabel: "Λειτουργία Προσβασιμότητας",
    primaryUsers: [
      "low-vision users",
      "hearing-limited users",
      "mobility-limited users",
      "speech-limited users",
      "cognitive-load-sensitive users",
      "sensory-sensitive users"
    ],
    defaultUiPrinciples: [
      "extra large UI",
      "screen-reader-friendly labels",
      "voice and text alternatives",
      "reduced complexity",
      "high contrast",
      "haptic/visual/audio options",
      "minimal steps to safety"
    ],
    immediateActions: [
      "large SOS button",
      "large help/translation button",
      "AI companion conversation button",
      "text alternative for speech",
      "audio alternative for reading",
      "local accessible history"
    ],
    blockedUntilLater: [
      "native haptic control",
      "advanced accessibility preferences sync",
      "device-level sensor integration",
      "specialized assistive hardware integrations"
    ],
    safetyBoundaries: [
      "accessibility does not mean loss of privacy",
      "helper roles must be limited and explicit",
      "caregiver cannot automatically read private AI memory",
      "voice/text history sharing requires consent"
    ]
  },
  {
    id: "solo",
    label: "Solo / Lonely User Support Mode",
    greekLabel: "Λειτουργία Μοναχικού Ατόμου",
    primaryUsers: [
      "people living alone",
      "isolated users",
      "users without daily family contact",
      "users needing emotional support"
    ],
    defaultUiPrinciples: [
      "warm AI companion tone",
      "daily check-in",
      "simple voice conversation",
      "journal/memory support",
      "optional family/trusted-person contact",
      "no unsafe emotional dependency wording"
    ],
    immediateActions: [
      "AI friend conversation",
      "life story journal",
      "concern notes with date/time",
      "optional reminder to call a trusted person",
      "SOS when danger is detected or stated"
    ],
    blockedUntilLater: [
      "real PantaAI voice engine",
      "memory/summarization provider",
      "cloud sync",
      "trusted family dashboard"
    ],
    safetyBoundaries: [
      "AI is supportive, not a replacement for human care",
      "self-harm or danger signals require escalation guidance",
      "medical or legal issues must be referred to qualified humans",
      "family sharing remains consent-based"
    ]
  }
];

export const redOrangeGreenProtectedUiContract = {
  red: {
    label: "SOS",
    greekLabel: "SOS",
    intent: "Immediate danger only.",
    greekIntent: "Άμεσος κίνδυνος μόνο.",
    uiRule: "One huge red button. No clutter. No contact setup inside panic state.",
    actionModel: [
      "activate local siren/attention mode where available",
      "prepare location/SOS packet",
      "trigger trusted emergency circle through available Pantavion-controlled channels",
      "start audio/video evidence flow only where permissions and law allow",
      "show clear cancel/false-alarm safety step when appropriate"
    ],
    mustNotClaim: [
      "official police dispatch",
      "official ambulance dispatch",
      "satellite rescue",
      "24/7 response center",
      "automatic third-party app control"
    ]
  },
  orange: {
    label: "Help / Translation",
    greekLabel: "Βοήθεια / Μετάφραση",
    intent: "Live understanding with another human, without exposing private history.",
    greekIntent:
      "Ζωντανή συνεννόηση με άνθρωπο, χωρίς πρόσβαση στο προσωπικό ιστορικό.",
    uiRule: "One large orange help/translation action with voice and text fallback.",
    actionModel: [
      "speech-to-speech translation when provider exists",
      "text translation fallback",
      "large captions",
      "care/home/hospital/taxi/public-service communication",
      "no access to green AI companion history"
    ],
    mustNotClaim: [
      "certified medical interpreter unless contracted",
      "perfect translation",
      "legal certainty",
      "automatic caregiver access to private data"
    ]
  },
  green: {
    label: "AI Friend",
    greekLabel: "AI Φίλος",
    intent: "Companionship, support, memory, daily concerns and life journal.",
    greekIntent:
      "Συντροφιά, υποστήριξη, μνήμη, καθημερινές ανησυχίες και ημερολόγιο ζωής.",
    uiRule:
      "One simple conversation entry point. Voice-first, with text alternative.",
    actionModel: [
      "two-way natural conversation when AI provider exists",
      "text conversation fallback",
      "local-first transcript",
      "optional audio retention",
      "date/time/duration/session markers",
      "important concern markers",
      "family summaries only by explicit consent"
    ],
    mustNotClaim: [
      "medical diagnosis",
      "replacement for doctor or emergency services",
      "caregiver automatic visibility",
      "therapy service unless clinically governed"
    ]
  }
} as const;

export const localFirstVoiceTextHistoryContract = {
  defaultStorage: "local-device-first",
  sessionFields: [
    "sessionId",
    "protectedMode",
    "startedAt",
    "endedAt",
    "durationSeconds",
    "inputType",
    "transcript",
    "optionalAudioReference",
    "topicTags",
    "importantConcernMarkers",
    "userConsentForFamilySummary"
  ],
  greekRule:
    "Η φωνή, το κείμενο, η ημερομηνία και η ώρα αποθηκεύονται πρώτα στη συσκευή. Η οικογένεια βλέπει μόνο ό,τι επιτρέψει ο χρήστης ή ό,τι επιτρέπει νόμιμα ο guardian κανόνας.",
  privacyRules: [
    "user can delete local history",
    "family sharing is off by default",
    "caregiver access is never automatic",
    "cloud sync requires separate consent",
    "medical/emergency summaries must be clearly marked as user support notes, not diagnosis"
  ]
} as const;

export const caregiverNoAutomaticAccessDoctrine = {
  greekRule:
    "Ο φροντιστής ή η οικιακή βοήθεια δεν βλέπει αυτόματα τις πράσινες AI συνομιλίες, τη φωνή, το κείμενο ή το ιστορικό.",
  reason:
    "A caregiver can be helpful, but can also be the person controlling, pressuring or harming the vulnerable user.",
  allowedAccessOnlyWhen: [
    "user explicitly shares a specific item",
    "lawful guardian rule permits limited access",
    "emergency contact role receives red SOS alert only",
    "live orange translation is happening in the moment without history access"
  ]
} as const;

export const aiSupportBoundaryForProtectedUsers = {
  greekRule:
    "Ο AI Φίλος δεν είναι επαγγελματίας υγείας, δεν κάνει διάγνωση και δεν αντικαθιστά επείγουσα βοήθεια.",
  allowed: [
    "listen kindly",
    "provide general knowledge",
    "organize concerns",
    "create reminders",
    "suggest talking to family/trusted people",
    "suggest qualified human help when risk appears",
    "route immediate danger to SOS/local emergency help"
  ],
  notAllowed: [
    "diagnose",
    "promise cure",
    "replace medical professional",
    "hide danger",
    "encourage isolation from trusted safe people",
    "give unsafe emergency certainty"
  ]
} as const;

export const guardianAndFamilyAccessMatrix: ProtectedRoleAccessRule[] = [
  {
    role: "user",
    defaultAccess: "full-user-controlled",
    canSeeGreenAiHistoryByDefault: true,
    canReceiveRedSosAlerts: false,
    canUseOrangeLiveTranslation: true,
    notes: "The user controls local history, sharing and deletion where legally capable."
  },
  {
    role: "parent",
    defaultAccess: "legal-guardian-controlled",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: true,
    canUseOrangeLiveTranslation: true,
    notes:
      "Parent/guardian access for minors depends on age, country law, consent and child-safety policy."
  },
  {
    role: "legal-guardian",
    defaultAccess: "legal-guardian-controlled",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: true,
    canUseOrangeLiveTranslation: true,
    notes:
      "Legal guardian visibility must be explicit, auditable and limited to lawful scope."
  },
  {
    role: "family-trusted-person",
    defaultAccess: "family-summary-only",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: true,
    canUseOrangeLiveTranslation: true,
    notes:
      "Family sees summaries or shared items only when user/guardian consent permits."
  },
  {
    role: "emergency-contact",
    defaultAccess: "emergency-only",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: true,
    canUseOrangeLiveTranslation: false,
    notes: "Receives SOS alerts but not private AI companion history."
  },
  {
    role: "caregiver-limited",
    defaultAccess: "live-help-only",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: false,
    canUseOrangeLiveTranslation: true,
    notes:
      "Can participate in live orange translation/help only. No automatic private history access."
  },
  {
    role: "founder-admin",
    defaultAccess: "admin-aggregate-only",
    canSeeGreenAiHistoryByDefault: false,
    canReceiveRedSosAlerts: false,
    canUseOrangeLiveTranslation: false,
    notes:
      "Founder/admin dashboards should see aggregate readiness and safety metrics, not private medical/audio content by default."
  }
];

export const protectedUsersImplementationOrder = [
  {
    step: 1,
    id: "lock-framework",
    status: "implemented-now" as ProtectedCapabilityStatus,
    action:
      "Keep this protected-users framework tracked in repo and checked by audit."
  },
  {
    step: 2,
    id: "elder-safe-mode-ui",
    status: "ready-next" as ProtectedCapabilityStatus,
    action:
      "Create /sos/elder with red SOS, orange help/translation and green AI friend sections."
  },
  {
    step: 3,
    id: "minor-access-modes",
    status: "ready-next" as ProtectedCapabilityStatus,
    action:
      "Create minor/access mode specs and routes with simplified protected UI."
  },
  {
    step: 4,
    id: "local-history",
    status: "ready-next" as ProtectedCapabilityStatus,
    action:
      "Add local protected session history with date/time and consent flags."
  },
  {
    step: 5,
    id: "auth-roles",
    status: "blocked-auth" as ProtectedCapabilityStatus,
    action:
      "Add accounts, verified guardians, trusted family roles and permissions."
  },
  {
    step: 6,
    id: "provider-alerts",
    status: "blocked-provider" as ProtectedCapabilityStatus,
    action:
      "Add backend email/SMS/push providers with cost caps and logs."
  },
  {
    step: 7,
    id: "voice-ai",
    status: "blocked-provider" as ProtectedCapabilityStatus,
    action:
      "Add PantaAI voice/text provider, speech-to-text, text-to-speech and AI safety router."
  },
  {
    step: 8,
    id: "native-sensors",
    status: "blocked-native" as ProtectedCapabilityStatus,
    action:
      "Add native app capabilities for fall/crash/background location only after legal and app-store review."
  }
];

export function getProtectedModeById(id: ProtectedUserModeId) {
  return pantavionProtectedUsersSafetyFramework.find((mode) => mode.id === id);
}

export function getRolesWithGreenHistoryAccessByDefault() {
  return guardianAndFamilyAccessMatrix.filter(
    (rule) => rule.canSeeGreenAiHistoryByDefault
  );
}

export function getProtectedUsersReadyNextSteps() {
  return protectedUsersImplementationOrder.filter(
    (item) => item.status === "ready-next"
  );
}
