export type AgeBand = "child" | "teen" | "adult";

export type AccountKind =
  | "person"
  | "creator"
  | "business"
  | "organization"
  | "public-body"
  | "education"
  | "nonprofit";

export type SocialCapability =
  | "social.feed.read"
  | "social.post.create"
  | "social.story.create"
  | "social.live.create"
  | "relationships.connect"
  | "communities.join"
  | "communities.create"
  | "messaging.direct"
  | "messaging.group"
  | "calling.voice"
  | "calling.video"
  | "dating.discover"
  | "dating.match"
  | "nearby.discover"
  | "marketplace.buy"
  | "marketplace.sell"
  | "business.manage"
  | "events.create"
  | "events.join"
  | "circles.secure.create"
  | "circles.secure.join"
  | "contacts.import"
  | "messages.import"
  | "search.global";

export type VerificationLevel =
  | "none"
  | "email"
  | "phone"
  | "age"
  | "identity"
  | "organization";

export interface Jurisdiction {
  countryCode: string;
  regionCode?: string;
}

export interface SocialActor {
  id: string;
  ageBand: AgeBand;
  accountKind: AccountKind;
  jurisdiction: Jurisdiction;
  verification: VerificationLevel[];
  guardianConsent?: boolean;
}

export interface PolicyContext {
  actor: SocialActor;
  capability: SocialCapability;
  targetAgeBand?: AgeBand;
  targetAccountKind?: AccountKind;
  featureFlags?: Readonly<Record<string, boolean>>;
}

export type PolicyDecisionCode =
  | "allowed"
  | "adult-only"
  | "guardian-consent-required"
  | "age-verification-required"
  | "identity-verification-required"
  | "cross-age-contact-restricted"
  | "feature-disabled"
  | "jurisdiction-restricted";

export interface PolicyDecision {
  allowed: boolean;
  code: PolicyDecisionCode;
  reason: string;
  requiredVerification?: VerificationLevel;
}

export interface SocialCoreModule {
  id:
    | "identity"
    | "relationships"
    | "feed"
    | "communities"
    | "secure-circles"
    | "messaging"
    | "voice-video"
    | "dating"
    | "teen-world"
    | "search"
    | "contacts-migration"
    | "translation"
    | "ai"
    | "business"
    | "events"
    | "marketplace"
    | "trust-safety"
    | "governance";
  name: string;
  capabilities: readonly SocialCapability[];
}
