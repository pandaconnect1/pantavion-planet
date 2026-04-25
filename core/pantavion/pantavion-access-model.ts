export const pantavionAccessModel = {
  id: "pantavion-access-model",
  title: "Pantavion Access Model",
  status: "mandatory-foundation",
  priority: "critical",
  summary:
    "Pantavion access must be governed by identity, age, consent, risk, payment status, verification, jurisdiction and capability level. No user should see unsafe, illegal, fake, empty or inappropriate surfaces.",
  gates: [
    "Every user has an access class before sensitive features unlock.",
    "Every user has age-aware routing before social, adult, messaging, marketplace or payment features.",
    "Every commercial action requires clear pricing, refund logic and Stripe-safe classification.",
    "Every restricted area requires explicit status, verification and legal boundary.",
    "Every provider-heavy function is marked provider-required until connected.",
    "Every high-risk function requires safety, jurisdiction, audit and escalation path.",
    "No adult access for minors.",
    "No fake free-unlimited promise that can be abused.",
    "No hidden monetization or unclear billing.",
    "No elite/private access without verification and approval."
  ],
  accessClasses: [
    {
      key: "visitor",
      name: "Visitor",
      description:
        "Public user who can view landing, ecosystem, legal, pricing and public foundation pages.",
      allowed: ["home", "ecosystem", "pricing", "legal", "public SEO pages"],
      blocked: ["private messages", "imports", "adult", "elite", "payments without account"]
    },
    {
      key: "registered",
      name: "Registered User",
      description:
        "Basic account with access to dashboard, messages foundation, language tools and normal user surfaces.",
      allowed: ["dashboard", "messages", "language", "market browsing", "studio foundation"],
      blocked: ["adult restricted", "elite secure", "regulated services without checks"]
    },
    {
      key: "verified",
      name: "Verified User",
      description:
        "Identity, email or phone verified user with higher trust and access to stronger communication, marketplace and import paths.",
      allowed: ["contact import", "listing creation", "creator tools", "business profile"],
      blocked: ["adult restricted unless adult verified", "elite unless approved"]
    },
    {
      key: "minor",
      name: "Minor / Youth",
      description:
        "Age-aware protected environment for education, family-safe social, language and entertainment.",
      allowed: ["learning", "safe language", "family contacts", "youth community"],
      blocked: ["adult", "unmoderated dating", "adult ads", "high-risk finance", "unsafe strangers"]
    },
    {
      key: "adult_verified",
      name: "Adult Verified 18+",
      description:
        "Strictly separated future adult lane, requiring legal review, age verification and separate processor decision.",
      allowed: ["adult restricted surfaces only after legal launch"],
      blocked: ["main youth surfaces", "Stripe-first adult monetization until reviewed"]
    },
    {
      key: "creator",
      name: "Creator",
      description:
        "User who creates media, radio messages, video, voice, music, posts, studio assets and monetizable content.",
      allowed: ["studio", "radio submissions", "creator profile", "media workflows"],
      blocked: ["copyright violations", "voice cloning without consent", "unlicensed broadcast"]
    },
    {
      key: "business",
      name: "Business / Professional",
      description:
        "Professional account for listings, services, build requests, business pages, paid visibility and client acquisition.",
      allowed: ["market listings", "business profile", "build-services", "featured placements"],
      blocked: ["illegal goods", "fake guarantees", "regulated services without compliance"]
    },
    {
      key: "institution",
      name: "Institution / Public Body",
      description:
        "Verified organization, municipality, school, ministry, authority, NGO or public-service channel.",
      allowed: ["verified public channels", "emergency communications after approval", "institution pages"],
      blocked: ["unverified public alerts", "political manipulation", "unsafe mass messaging"]
    },
    {
      key: "elite",
      name: "Pantavion Elite",
      description:
        "High-trust private access layer with secure channels, full ecosystem access, priority execution and custom capability creation paths.",
      allowed: ["secure channel", "priority execution", "private workflows", "custom build requests"],
      blocked: ["bypassing law", "bypassing safety", "unaudited sensitive operations"]
    },
    {
      key: "operator",
      name: "Operator / Founder",
      description:
        "Internal control-room access for reviewing gaps, reports, release gates, risk, deployments and system status.",
      allowed: ["kernel audit", "release gates", "founder reports", "system oversight"],
      blocked: ["unsafe manual override", "unlogged privileged action"]
    }
  ],
  subscriptionModel: [
    {
      key: "founding_trial",
      name: "Founding Trial",
      description:
        "Early access period designed to let people understand Pantavion without being exploited or misled.",
      rule: "Limited fair-use access, no fake unlimited promise, clear upgrade path."
    },
    {
      key: "personal",
      name: "Personal",
      description:
        "Affordable user access for AI, communication, translation, social, media and daily life."
    },
    {
      key: "creator",
      name: "Creator",
      description:
        "Media, studio, voice, video, radio, content and monetization-oriented access."
    },
    {
      key: "business",
      name: "Business",
      description:
        "Listings, services, marketplace, build requests, business pages and professional workflows."
    },
    {
      key: "elite",
      name: "Elite",
      description:
        "High-trust private access, secure channels, priority execution and custom creation lane."
    }
  ],
  firstMonthPolicy:
    "Pantavion may offer a first-month trial or founding access, but it must have fair-use limits, abuse protection, clear conversion terms and no misleading promise of unlimited unpaid work.",
  billingBoundaries: [
    "Stripe-first products must avoid adult restricted content.",
    "Stripe-first products must avoid forex/trading signals and regulated guarantees.",
    "Stripe-first products must avoid medical/legal professional claims unless reviewed.",
    "Every paid product needs price, renewal, cancellation and refund explanation.",
    "Business listings and featured placements must be labeled clearly.",
    "Build services require quote, scope, acceptance and delivery terms."
  ],
  motto:
    "Right user, right access, right risk lane, right price, right legal boundary, no confusion."
} as const;
