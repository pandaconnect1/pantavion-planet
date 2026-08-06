export type AdaptiveContextSource =
  | "user-preference"
  | "conversation-context"
  | "profile-country"
  | "profile-language"
  | "explicit-search";

export interface CrossCultureProfile {
  countryCode?: string;
  languageCode?: string;
  interests?: readonly string[];
}

export interface ConversationSignal {
  topics: readonly string[];
  mentionedCountries?: readonly string[];
  mentionedPlaces?: readonly string[];
  mentionedCultures?: readonly string[];
}

export interface AdaptiveSocialViewRequest {
  viewer: CrossCultureProfile;
  counterpart?: CrossCultureProfile;
  conversation?: ConversationSignal;
  manualFocus?: {
    countryCode?: string;
    city?: string;
    category?: "culture" | "places" | "food" | "history" | "events" | "people" | "business";
    query?: string;
  };
}

export interface AdaptiveSocialCard {
  id: string;
  title: string;
  summary: string;
  countryCode?: string;
  city?: string;
  category: "culture" | "places" | "food" | "history" | "events" | "people" | "business";
  source: AdaptiveContextSource;
  relevanceReason: string;
}

export interface AdaptiveSocialView {
  mode: "automatic" | "manual" | "hybrid";
  primaryCountryCode?: string;
  counterpartCountryCode?: string;
  cards: readonly AdaptiveSocialCard[];
  userCanOverride: true;
  personalizationExplanationRequired: true;
}

export function resolveAdaptiveViewMode(
  request: AdaptiveSocialViewRequest,
): AdaptiveSocialView["mode"] {
  if (request.manualFocus) {
    return request.conversation ? "hybrid" : "manual";
  }

  return "automatic";
}
