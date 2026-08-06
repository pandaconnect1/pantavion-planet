export type ChatSecurityTier = "standard" | "private" | "secure-circle" | "elite-vault";

export type SecureChatCapabilities = {
  endToEndEncryption: boolean;
  forwardSecrecy: boolean;
  deviceVerification: boolean;
  disappearingMessages: boolean;
  attachmentEncryption: boolean;
  screenshotDeterrence: boolean;
  metadataMinimization: boolean;
  sessionRevocation: boolean;
  membershipApproval: boolean;
};

export type SecureChatReadiness = {
  tier: ChatSecurityTier;
  productionReady: boolean;
  capabilities: SecureChatCapabilities;
  blockers: string[];
};

const notYetImplemented = (tier: ChatSecurityTier): SecureChatReadiness => ({
  tier,
  productionReady: false,
  capabilities: {
    endToEndEncryption: false,
    forwardSecrecy: false,
    deviceVerification: false,
    disappearingMessages: false,
    attachmentEncryption: false,
    screenshotDeterrence: false,
    metadataMinimization: false,
    sessionRevocation: true,
    membershipApproval: tier === "secure-circle" || tier === "elite-vault",
  },
  blockers: [
    "audited encryption protocol implementation",
    "device key lifecycle and recovery design",
    "encrypted attachment pipeline",
    "independent security review and penetration testing",
  ],
});

export const SECURE_CHAT_READINESS: Record<ChatSecurityTier, SecureChatReadiness> = {
  standard: {
    tier: "standard",
    productionReady: false,
    capabilities: {
      endToEndEncryption: false,
      forwardSecrecy: false,
      deviceVerification: false,
      disappearingMessages: false,
      attachmentEncryption: false,
      screenshotDeterrence: false,
      metadataMinimization: false,
      sessionRevocation: true,
      membershipApproval: false,
    },
    blockers: ["chat database migration and production validation"],
  },
  private: notYetImplemented("private"),
  "secure-circle": notYetImplemented("secure-circle"),
  "elite-vault": notYetImplemented("elite-vault"),
};

export function canAdvertiseEndToEndEncryption(tier: ChatSecurityTier): boolean {
  const readiness = SECURE_CHAT_READINESS[tier];
  return readiness.productionReady && readiness.capabilities.endToEndEncryption;
}
