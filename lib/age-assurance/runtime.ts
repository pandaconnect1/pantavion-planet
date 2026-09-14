export type AgeBand = 'UNDER_13' | '13_14' | '15_17' | '18_PLUS' | 'UNKNOWN';
export type AssuranceMethod = 'SELF_DECLARED' | 'CAMERA_LIVENESS' | 'VERIFIED_CREDENTIAL';
export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'REVIEW_REQUIRED';

export type AgeAssuranceInput = {
  method: AssuranceMethod;
  claimedDateOfBirth?: string;
  estimatedAge?: number;
  livenessPassed?: boolean;
  credentialAgeOver?: number;
  jurisdiction: string;
};

export type AgeAssuranceResult = {
  status: VerificationStatus;
  ageBand: AgeBand;
  assuranceLevel: 0 | 1 | 2 | 3;
  reasons: string[];
  featurePolicy: {
    socialDiscovery: boolean;
    dating: boolean;
    directMessagingFromUnknownAdults: boolean;
  };
};

function bandFromAge(age: number): AgeBand {
  if (age < 13) return 'UNDER_13';
  if (age < 15) return '13_14';
  if (age < 18) return '15_17';
  return '18_PLUS';
}

function ageFromDate(date: string): number | null {
  const dob = new Date(date);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const month = now.getUTCMonth() - dob.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

export function verifyAgeAssurance(input: AgeAssuranceInput): AgeAssuranceResult {
  const reasons: string[] = [];
  let age: number | null = null;
  let assuranceLevel: 0 | 1 | 2 | 3 = 0;

  if (input.method === 'VERIFIED_CREDENTIAL') {
    if (typeof input.credentialAgeOver !== 'number' || input.credentialAgeOver < 0) {
      return rejected('Missing or invalid verified credential threshold');
    }
    assuranceLevel = 3;
    age = input.credentialAgeOver;
    reasons.push('Verified age credential accepted');
  }

  if (input.method === 'CAMERA_LIVENESS') {
    if (!input.livenessPassed) return rejected('Liveness check failed');
    if (typeof input.estimatedAge !== 'number' || input.estimatedAge < 0 || input.estimatedAge > 120) {
      return rejected('Missing or invalid camera age estimate');
    }
    assuranceLevel = 2;
    age = Math.floor(input.estimatedAge);
    reasons.push('Camera liveness passed and age estimate supplied');
  }

  if (input.method === 'SELF_DECLARED') {
    if (!input.claimedDateOfBirth) return rejected('Date of birth required for self declaration');
    age = ageFromDate(input.claimedDateOfBirth);
    if (age === null) return rejected('Invalid date of birth');
    assuranceLevel = 1;
    reasons.push('Self-declared date of birth accepted as low-assurance evidence only');
  }

  if (age === null) return rejected('No usable age evidence');

  const ageBand = bandFromAge(age);
  const highRiskAllowed = assuranceLevel >= 2 && ageBand === '18_PLUS';
  const teenDiscoveryAllowed = assuranceLevel >= 2 && ageBand === '15_17';

  return {
    status: assuranceLevel === 1 ? 'REVIEW_REQUIRED' : 'VERIFIED',
    ageBand,
    assuranceLevel,
    reasons,
    featurePolicy: {
      socialDiscovery: ageBand === '18_PLUS' ? assuranceLevel >= 2 : teenDiscoveryAllowed,
      dating: highRiskAllowed,
      directMessagingFromUnknownAdults: highRiskAllowed,
    },
  };
}

function rejected(reason: string): AgeAssuranceResult {
  return {
    status: 'REJECTED',
    ageBand: 'UNKNOWN',
    assuranceLevel: 0,
    reasons: [reason],
    featurePolicy: {
      socialDiscovery: false,
      dating: false,
      directMessagingFromUnknownAdults: false,
    },
  };
}
