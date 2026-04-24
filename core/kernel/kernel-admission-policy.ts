// core/kernel/kernel-admission-policy.ts

import {
  evaluateKernelAdmission,
  type PantavionAdmissionCandidateInput,
  type PantavionAdmissionRunOutput,
} from './kernel-admission';

import {
  classifyTaxonomyCandidate,
  type PantavionTaxonomyClassification,
} from './kernel-taxonomy';

export type PantavionAdmissionPolicyBand =
  | 'fast-track'
  | 'controlled'
  | 'guarded'
  | 'restricted';

export type PantavionAdmissionControl =
  | 'taxonomy-lock'
  | 'duplicate-review'
  | 'approval-packet'
  | 'security-review'
  | 'runtime-hardening'
  | 'observability-check'
  | 'smoke-required'
  | 'defer-until-gap-close';

export interface PantavionAdmissionPolicyResult {
  allowed: boolean;
  band: PantavionAdmissionPolicyBand;
  requiredControls: PantavionAdmissionControl[];
  reasons: string[];
  taxonomy: PantavionTaxonomyClassification;
  admission: PantavionAdmissionRunOutput;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function deriveBand(input: {
  candidate: PantavionAdmissionCandidateInput;
  taxonomy: PantavionTaxonomyClassification;
  admission: PantavionAdmissionRunOutput;
}): PantavionAdmissionPolicyBand {
  if (
    input.candidate.sensitivity === 'restricted' ||
    input.candidate.riskHint === 'restricted' ||
    input.admission.record.decision === 'reject'
  ) {
    return 'restricted';
  }

  if (
    input.admission.record.decision === 'review' ||
    input.admission.record.kernelGapSummary.critical > 0
  ) {
    return 'guarded';
  }

  if (
    input.admission.record.decision === 'defer' ||
    input.admission.record.kernelGapSummary.material > 0
  ) {
    return 'controlled';
  }

  if (
    input.taxonomy.recommendedLayer === 'foundation' ||
    input.taxonomy.recommendedLayer === 'runtime'
  ) {
    return 'controlled';
  }

  return 'fast-track';
}

function deriveControls(input: {
  band: PantavionAdmissionPolicyBand;
  candidate: PantavionAdmissionCandidateInput;
  taxonomy: PantavionTaxonomyClassification;
  admission: PantavionAdmissionRunOutput;
}): PantavionAdmissionControl[] {
  const controls: PantavionAdmissionControl[] = ['taxonomy-lock'];

  if (input.admission.record.registryDisposition === 'review') {
    controls.push('duplicate-review');
  }

  if (
    input.admission.record.kernelRecommendationStatus === 'approval-required' ||
    input.admission.kernel.policy.disposition === 'review'
  ) {
    controls.push('approval-packet');
  }

  if (
    input.candidate.sensitivity === 'restricted' ||
    input.candidate.riskHint === 'restricted' ||
    input.band === 'restricted'
  ) {
    controls.push('security-review');
  }

  if (
    input.taxonomy.recommendedLayer === 'runtime' ||
    input.taxonomy.recommendedFamily === 'runtime' ||
    input.taxonomy.recommendedFamily === 'workspace' ||
    input.taxonomy.recommendedFamily === 'voice' ||
    input.taxonomy.recommendedFamily === 'resilience'
  ) {
    controls.push('runtime-hardening');
  }

  if (
    input.taxonomy.recommendedLayer === 'foundation' ||
    input.candidate.objectKind === 'service' ||
    input.candidate.objectKind === 'runtime'
  ) {
    controls.push('observability-check');
    controls.push('smoke-required');
  }

  if (
    input.admission.record.kernelGapSummary.critical > 0 ||
    input.admission.record.kernelRecommendationStatus === 'gap-close-first'
  ) {
    controls.push('defer-until-gap-close');
  }

  return uniqStrings(controls) as PantavionAdmissionControl[];
}

export async function evaluateKernelAdmissionPolicy(
  candidate: PantavionAdmissionCandidateInput,
): Promise<PantavionAdmissionPolicyResult> {
  const taxonomy = classifyTaxonomyCandidate({
    title: candidate.title,
    description: candidate.description,
    targetPath: candidate.targetPath,
    targetModule: candidate.targetModule,
    tags: candidate.tags,
    requestedCapabilities: candidate.requestedCapabilities,
    metadata: candidate.metadata,
  });

  const admission = await evaluateKernelAdmission(candidate);

  const band = deriveBand({
    candidate,
    taxonomy,
    admission,
  });

  const requiredControls = deriveControls({
    band,
    candidate,
    taxonomy,
    admission,
  });

  const allowed =
    admission.record.decision === 'admit' &&
    !requiredControls.includes('defer-until-gap-close') &&
    band !== 'restricted';

  const reasons = uniqStrings([
    ...taxonomy.reasons,
    ...admission.record.reasons,
    `Admission policy band resolved as ${band}.`,
    ...(allowed
      ? ['Candidate may proceed under required controls.']
      : ['Candidate may not proceed without additional review/hardening.']),
  ]);

  return {
    allowed,
    band,
    requiredControls,
    reasons,
    taxonomy,
    admission,
  };
}

export default evaluateKernelAdmissionPolicy;
