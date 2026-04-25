export const officialAlertAuthorityMatrix = {
  id: "official-alert-authority-matrix",
  title: "Pantavion Official Alert Authority Matrix",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Pantavion users may participate in audio/radio shows, dedications and community submissions, but emergency interrupt alerts are reserved for verified authorities, civic institutions or approved Pantavion safety operators under legal framework.",
  correction:
    "Normal users do not issue emergency broadcast interruptions. They may send wishes, call-ins, community messages and submissions for moderated programs.",
  participationTypes: [
    {
      type: "user_dedication",
      actor: "registered_user",
      interruptsFlow: false,
      reviewRequired: true,
      allowedUse:
        "Wishes, dedications, greetings and program participation."
    },
    {
      type: "user_call_in",
      actor: "registered_user",
      interruptsFlow: false,
      reviewRequired: true,
      allowedUse:
        "Participation in specific shows, interviews or moderated radio segments."
    },
    {
      type: "community_message",
      actor: "user_or_community",
      interruptsFlow: false,
      reviewRequired: true,
      allowedUse:
        "Local announcements, cultural messages, marketplace audio or community notices."
    },
    {
      type: "local_incident_tip",
      actor: "user",
      interruptsFlow: false,
      reviewRequired: true,
      allowedUse:
        "User may submit information to review. It never becomes an official emergency alert automatically."
    },
    {
      type: "official_civic_alert",
      actor: "verified_civic_authority",
      interruptsFlow: true,
      reviewRequired: true,
      allowedUse:
        "Municipality, hospital, police, coast guard, fire service, civil defense or government alert after official onboarding."
    },
    {
      type: "emergency_interrupt",
      actor: "verified_authority_or_pantavion_safety_operator",
      interruptsFlow: true,
      reviewRequired: true,
      allowedUse:
        "Critical public safety interruption only with severity, geography, audit and legal authorization."
    }
  ],
  verifiedAuthorityTypes: [
    "police",
    "hospital",
    "figal_review_required"
    },
    {
      region: "China",
      privacy: "PIPL / Cybersecurity / data localization review required",
      platformSafety: "Local platform and content rules required",
      ai: "China AI regulatory review required",
      payments: "Local payment rules required",
      minors: "Strict local rules required",
      adult: "Highly restricted; blocked",
      data: "Localization and security assessment likely required",
      status: "blocked_until_special_review"
    },
    {
      region: "Russia",
      privacy: "Data localization and local law review required",
      platformSafety: "Local content and platform rules required",
      ai: "Local AI/data rules review required",
      payments: "Sanctions/payment restrictions review required",
      minors: "Local minors rules required",
      adult: "Restricted; blocked until legal review",
      data: "Localization review required",
      status: "blocked_until_special_review"
    },
    {
      region: "Middle East",
      privacy: "Country-specific privacy and telecom review required",
      platformSafety: "Religious, cultural and speech restrictions vary by country",
      ai: "Country-specific AI/data rules review required",
      payments: "Local payment and business registration review required",
      minors: "Strict safeguards required",
      adult: "Likely blocked in many jurisdictions",
      data: "Local hosting/transfer rules may apply",
      status: "legal_review_required"
    },
    {
      region: "Africa",
      privacy: "Country-by-country privacy and telecom review required",
      platformSafety: "Local platform rules vary",
      ai: "Emerging AI regulation review required",
      payments: "Mobile money/payment partner review required",
      minors: "Protection rules required",
      adult: "Country-by-country review required",
      data: "Local rules vary",
      status: "legal_review_required"
    },
    {
      region: "India",
      privacy: "DPDP and sector rules review required",
      platformSafety: "Intermediary/content rules review required",
      ai: "AI/data rules review required",
      payments: "Local payments and tax rules review required",
      minors: "Youth protection required",
      adult: "Restricted; legal review required",
      data: "Localization/transfer review required",
      status: "legal_review_required"
    },
    {
      region: "Latin America",
      privacy: "LGPD and country privacy laws review required",
      platformSafety: "Country-by-country content and consumer rules review required",
      ai: "Emerging AI rules review required",
      payments: "Local payment/refund/tax rules required",
      minors: "Protection rules required",
      adult: "Country-by-country review required",
      data: "Transfer rules review required",
      status: "legal_review_required"
    },
    {
      region: "Oceania",
      privacy: "Australia/NZ privacy and online safety review required",
      platformSafety: "Online safety and child protection review required",
      ai: "AI governance review required",
      payments: "Consumer/payment/refund rules required",
      minors: "Strict minors protections required",
      adult: "Legal review and age gate required",
      data: "Transfer rules review required",
      status: "legal_review_required"
    }
  ],
  gates: [
    "No global launch without jurisdiction status.",
    "No adult zone without country-by-country legal gate.",
    "No real SOS authority integration without local legal/institutional opt-in.",
    "No payment launch without country, tax and merchant status.",
    "No contact/message import without data law and platform terms review.",
    "No AI red-zone deployment without jurisdiction and human review."
  ],
  motto:
    "Global ambition requires local legal truth."
} as const;
