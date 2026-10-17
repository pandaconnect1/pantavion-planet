export type AgeBand = 'UNKNOWN' | 'UNDER_13' | 'AGE_13_14' | 'AGE_15_17' | 'ADULT_18_PLUS';

export type AgeClaim = 'OVER_13' | 'OVER_15' | 'OVER_18';

export type AssuranceLevel = 'SELF_ASSERTED' | 'LOW' | 'SUBSTANTIAL' | 'HIGH';

export interface AgeEvidence {
  provider: string;
  claim: AgeClaim;
  assuranceLevel: Exclude<AssuranceLevel, 'SELF_ASSERTED'>;
  jurisdiction: string;
  issuedAt: string;
  expiresAt: string;
  evidenceId: string;
  serverVerified: boolean;
  rawIdentityStored?: false;
}

export interface VerifiedAgeAttribute {
  band: AgeBand;
  claims: AgeClaim[];
  assuranceLevel: Exclude<AssuranceLevel, 'SELF_ASSERTED'>;
  jurisdiction: string;
  evidenceId: string;
  expiresAt: string;
}

export class AgeAssuranceError extends Error {
  constructor(public readonly code: 'CLIENT_ASSERTION_REJECTED' | 'INVALID_EVIDENCE' | 'EXPIRED_EVIDENCE') {
    super(code);
    this.name = 'AgeAssuranceError';
  }
}

function deriveBand(claim: AgeClaim): AgeBand {
  if (claim === 'OVER_18') return 'ADULT_18_PLUS';
  if (claim === 'OVER_15') return 'AGE_15_17';
  return 'AGE_13_14';
}

function deriveClaims(claim: AgeClaim): AgeClaim[] {
  if (claim === 'OVER_18') return ['OVER_13', 'OVER_15', 'OVER_18'];
  if (claim === 'OVER_15') return ['OVER_13', 'OVER_15'];
  return ['OVER_13'];
}

/**
 * Converts server-verified, minimum-disclosure proof-of-age evidence into a
 * Pantavion trust attribute. Raw ID documents, exact DOB and biometric images
 * are deliberately outside this contract.
 */
export function verifyAgeEvidence(evidence: AgeEvidence, now = new Date()): VerifiedAgeAttribute {
  if (!evidence.serverVerified) throw new AgeAssuranceError('CLIENT_ASSERTION_REJECTED');
  if (!evidence.provider.trim() || !evidence.evidenceId.trim() || !evidence.jurisdiction.trim()) {
    throw new AgeAssuranceError('INVALID_EVIDENCE');
  }
  const issuedAt = Date.parse(evidence.issuedAt);
  const expiresAt = Date.parse(evidence.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > expiresAt) {
    throw new AgeAssuranceError('INVALID_EVIDENCE');
  }
  if (expiresAt <= now.getTime()) throw new AgeAssuranceError('EXPIRED_EVIDENCE');
  if (evidence.rawIdentityStored !== undefined && evidence.rawIdentityStored !== false) {
    throw new AgeAssuranceError('INVALID_EVIDENCE');
  }

  return {
    band: deriveBand(evidence.claim),
    claims: deriveClaims(evidence.claim),
    assuranceLevel: evidence.assuranceLevel,
    jurisdiction: evidence.jurisdiction.toUpperCase(),
    evidenceId: evidence.evidenceId,
    expiresAt: evidence.expiresAt,
  };
}

export function hasAgeClaim(attribute: VerifiedAgeAttribute | null | undefined, claim: AgeClaim): boolean {
  return Boolean(attribute && attribute.claims.includes(claim) && Date.parse(attribute.expiresAt) > Date.now());
}
