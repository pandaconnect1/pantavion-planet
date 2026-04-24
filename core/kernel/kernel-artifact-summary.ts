// core/kernel/kernel-artifact-summary.ts

import type { PantavionKernelRunArtifact } from './kernel-run-artifact';

export interface PantavionKernelArtifactSummaryBlock {
  title: string;
  lines: string[];
}

export interface PantavionKernelArtifactSummary {
  generatedAt: string;
  blocks: PantavionKernelArtifactSummaryBlock[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildKernelArtifactSummary(
  artifact: PantavionKernelRunArtifact,
): PantavionKernelArtifactSummary {
  const blocks: PantavionKernelArtifactSummaryBlock[] = [
    {
      title: 'Artifact Identity',
      lines: [
        `artifactId=${artifact.artifactId}`,
        `generatedAt=${artifact.generatedAt}`,
        `summary=${artifact.summary}`,
      ],
    },
    {
      title: 'Readiness',
      lines: [
        `status=${artifact.readinessStatus}`,
        `score=${artifact.readinessScore.toFixed(2)}`,
        `controlPlaneMode=${artifact.controlPlaneMode}`,
        `opsStatus=${artifact.opsStatus}`,
        `resilienceMode=${artifact.resilienceMode}`,
      ],
    },
    {
      title: 'Operational Priorities',
      lines: [
        `priorityCount=${artifact.priorityCount}`,
        ...artifact.topActions.map((action) => `- ${action}`),
      ],
    },
  ];

  const rendered = [
    'PANTAVION KERNEL ARTIFACT SUMMARY',
    ...blocks.flatMap((block) => [
      '',
      block.title.toUpperCase(),
      ...block.lines,
    ]),
  ].join('\n');

  return {
    generatedAt: nowIso(),
    blocks,
    rendered,
  };
}

export function renderKernelArtifactSummary(
  artifact: PantavionKernelRunArtifact,
): string {
  return buildKernelArtifactSummary(artifact).rendered;
}

export default renderKernelArtifactSummary;
