export const PANTAVION_SOS_MAX_TRUSTED_CONTACTS = 3;
export const PANTAVION_SOS_DEFAULT_DAILY_SMS_LIMIT = 20;
export const PANTAVION_SOS_DEFAULT_DAILY_EMAIL_LIMIT = 100;

export const PANTAVION_SOS_SMS_ENABLED_ENV = "PANTAVION_SOS_SMS_ENABLED";
export const PANTAVION_SOS_EMAIL_ENABLED_ENV = "PANTAVION_SOS_EMAIL_ENABLED";
export const PANTAVION_SOS_DAILY_SMS_LIMIT_ENV = "PANTAVION_SOS_DAILY_SMS_LIMIT";
export const PANTAVION_SOS_MAX_CONTACTS_ENV = "PANTAVION_SOS_MAX_CONTACTS";

export const pantavionSosAlertPolicy = {
  name: "Pantavion SOS Alert Policy",
  version: "1.0.0",
  greekReminder:
    "Το SMS/email backend χρησιμοποιείται μόνο για SOS trusted contacts, όχι για marketing, spam ή μαζικές αποστολές.",
  vulnerableUserReminder:
    "Ανήλικοι, ηλικιωμένοι, γονείς, guardians και ευάλωτοι χρήστες πρέπει να έχουν ειδικό SOS σχεδιασμό, όχι γενικό ίδιο flow για όλους.",
  principles: [
    "Trusted contacts first.",
    "Local emergency number remains primary in immediate danger.",
    "No official authority escalation claim without certified provider agreement.",
    "No satellite rescue claim without compatible hardware/provider/legal coverage.",
    "Backend SMS/email must be disabled by default until Founder approval and provider keys exist.",
    "Every paid provider path must have daily limits, rate limits, logs and abuse protection.",
    "Minors, elders and vulnerable users require stronger consent and guardian rules."
  ],
  immediateLowCostLayers: [
    "browser call link",
    "browser SMS link",
    "browser email link",
    "native share action",
    "copy SOS packet",
    "local trusted contacts",
    "offline/local SOS queue"
  ],
  nextProviderLayers: [
    "server email fallback",
    "SOS-only SMS provider",
    "real user accounts",
    "verified trusted contact invites",
    "push notifications after account/device registration"
  ],
  elderCompanionRules: [
    "The green AI companion is private by default.",
    "Caregivers or home helpers do not receive automatic access to private voice/text history.",
    "The AI companion may provide emotional support, general knowledge and help organize concerns, but it is not a doctor and does not diagnose.",
    "Voice, text, date, time, duration and topic markers should be stored local-first when the user consents.",
    "Family or trusted-person visibility must be explicit, revocable and consent-based.",
    "Orange live translation/help must not expose green companion history."
  ],
  blockedAdvancedLayers: [
    "certified emergency dispatch",
    "satellite provider integration",
    "24/7 response center",
    "native crash/fall detection",
    "encrypted evidence cloud vault"
  ]
} as const;

export function assertSosProviderCanSend(params: {
  enabled: boolean;
  contactCount: number;
  dailyCount: number;
  dailyLimit: number;
  hasConsent: boolean;
}) {
  if (!params.enabled) {
    return { ok: false, reason: "provider-disabled" as const };
  }

  if (!params.hasConsent) {
    return { ok: false, reason: "missing-consent" as const };
  }

  if (params.contactCount < 1) {
    return { ok: false, reason: "no-trusted-contacts" as const };
  }

  if (params.contactCount > PANTAVION_SOS_MAX_TRUSTED_CONTACTS) {
    return { ok: false, reason: "too-many-contacts" as const };
  }

  if (params.dailyCount >= params.dailyLimit) {
    return { ok: false, reason: "daily-limit-reached" as const };
  }

  return { ok: true, reason: "allowed" as const };
}
