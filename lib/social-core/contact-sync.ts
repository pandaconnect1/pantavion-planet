export type ContactSource = "device" | "google" | "apple" | "microsoft" | "sim" | "manual";

export type ContactSyncConsent = {
  userId: string;
  source: ContactSource;
  grantedAt: string;
  revokedAt?: string;
  allowDiscovery: boolean;
  allowInvites: boolean;
};

export type NormalizedContact = {
  localId: string;
  displayName?: string;
  phones: string[];
  emails: string[];
  source: ContactSource;
};

export type ContactMatch = {
  pantavionUserId: string;
  matchedBy: "phone_hash" | "email_hash";
  confidence: "exact";
};

export type ContactSyncPolicy = {
  uploadRawContacts: false;
  persistRawContacts: false;
  requireExplicitConsent: true;
  allowImmediateRevocation: true;
  hashIdentifiersBeforeMatching: true;
  separateDiscoveryFromInvites: true;
};

export const CONTACT_SYNC_POLICY: ContactSyncPolicy = {
  uploadRawContacts: false,
  persistRawContacts: false,
  requireExplicitConsent: true,
  allowImmediateRevocation: true,
  hashIdentifiersBeforeMatching: true,
  separateDiscoveryFromInvites: true,
};

export function normalizePhone(input: string): string {
  return input.replace(/[^+\d]/g, "");
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function prepareContactForPrivateMatching(contact: NormalizedContact) {
  return {
    localId: contact.localId,
    source: contact.source,
    phones: contact.phones.map(normalizePhone).filter(Boolean),
    emails: contact.emails.map(normalizeEmail).filter(Boolean),
  };
}
