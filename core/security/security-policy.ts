type UnknownRecord = Record<string, unknown>;

function buildSearchText(request: UnknownRecord): string {
  return [
    request.title,
    request.description,
    request.inputText,
    request.requestedOperation,
    request.targetPath,
    request.targetModule,
  ]
    .filter(Boolean)
    .map((item) => String(item))
    .join(' ')
    .toLowerCase();
}

export async function evaluatePolicy(context: UnknownRecord): Promise<UnknownRecord> {
  const request = (context.request as UnknownRecord | undefined) ?? {};
  const classification = (context.classification as UnknownRecord | undefined) ?? {};
  const capabilityPlan = (context.capabilityPlan as UnknownRecord | undefined) ?? {};

  const searchText = buildSearchText(request);
  const sensitivity = String(request.sensitivity ?? 'internal');
  const reasons: string[] = [];
  const appliedRules: string[] = [];
  const requiredApprovals: string[] = [];
  const allowedScopes = Array.isArray((context.identity as UnknownRecord | undefined)?.effectiveScopes)
    ? (((context.identity as UnknownRecord).effectiveScopes as unknown[]) ?? []).map((item) => String(item))
    : [];

  let disposition: 'allow' | 'review' | 'deny' = 'allow';
  let riskPosture = String(classification.riskPosture ?? 'normal');

  if (sensitivity === 'restricted') {
    disposition = 'review';
    riskPosture = 'restricted';
    reasons.push('Restricted sensitivity requires review.');
    appliedRules.push('privacy / memory sovereignty rules');
    requiredApprovals.push('Security approval required.');
  }

  if (
    searchText.includes('delete') ||
    searchText.includes('destructive') ||
    searchText.includes('global permission shift')
  ) {
    disposition = 'deny';
    riskPosture = 'restricted';
    reasons.push('Potentially destructive operation detected.');
    appliedRules.push('legal / safety hard rules');
    requiredApprovals.push('Blocked pending explicit safeguarded protocol.');
  }

  const restrictedCapabilities = Array.isArray(capabilityPlan.restrictedCapabilities)
    ? capabilityPlan.restrictedCapabilities
    : [];

  const missingCapabilities = Array.isArray(capabilityPlan.missingCapabilities)
    ? capabilityPlan.missingCapabilities
    : [];

  if (restrictedCapabilities.length > 0 && disposition !== 'deny') {
    disposition = 'review';
    reasons.push('Restricted capabilities require review.');
    appliedRules.push('capability availability / trust / health');
    requiredApprovals.push('Restricted capability review required.');
  }

  if (missingCapabilities.length > 0 && disposition === 'allow') {
    disposition = 'review';
    reasons.push('Missing capabilities reduce confidence.');
    appliedRules.push('capability availability / trust / health');
  }

  if (reasons.length === 0) {
    reasons.push('No blocking conflict detected.');
    appliedRules.push('truth / provenance requirements');
  }

  return {
    disposition,
    riskPosture,
    score: disposition === 'deny' ? 0.1 : disposition === 'review' ? 0.72 : 0.93,
    reasons,
    appliedRules,
    requiredApprovals,
    allowedScopes,
  };
}

export async function evaluateSecurity(context: UnknownRecord): Promise<UnknownRecord> {
  return evaluatePolicy(context);
}
