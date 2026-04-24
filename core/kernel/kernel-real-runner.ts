// core/kernel/kernel-real-runner.ts

import {
  runKernelControlPlane,
  type PantavionKernelControlPlaneRun,
} from './kernel-control-plane';
import {
  buildKernelReadinessReport,
  type PantavionKernelReadinessReport,
} from './kernel-readiness-report';

export interface PantavionKernelRealRunnerOutput {
  controlPlane: PantavionKernelControlPlaneRun;
  readiness: PantavionKernelReadinessReport;
  terminalSummary: string;
}

function renderCheckLine(check: PantavionKernelReadinessReport['checks'][number]): string {
  return `- [${check.status.toUpperCase()}] ${check.area}: ${check.summary}`;
}

export function renderKernelRealRunnerSummary(
  output: PantavionKernelRealRunnerOutput,
): string {
  const lines: string[] = [];

  lines.push('PANTAVION KERNEL REAL RUNNER');
  lines.push(`runId=${output.controlPlane.runId}`);
  lines.push(`mode=${output.controlPlane.mode}`);
  lines.push(`readiness=${output.readiness.status}`);
  lines.push(`score=${output.readiness.score.toFixed(2)}`);
  lines.push(`resilience=${output.controlPlane.resilienceMode}`);
  lines.push(`protocolAdapters=${output.controlPlane.gatewayStats.adapterCount}`);
  lines.push(`dispatchCount=${output.controlPlane.gatewayStats.dispatchCount}`);
  lines.push('checks:');

  for (const check of output.readiness.checks) {
    lines.push(renderCheckLine(check));
  }

  lines.push('nextWave:');
  for (const item of output.readiness.nextWave) {
    lines.push(`- ${item}`);
  }

  return lines.join('\n');
}

export async function runPantavionKernelRealRunner(): Promise<PantavionKernelRealRunnerOutput> {
  const controlPlane = await runKernelControlPlane({
    realRunner: true,
  });

  const readiness = buildKernelReadinessReport(controlPlane);

  return {
    controlPlane,
    readiness,
    terminalSummary: renderKernelRealRunnerSummary({
      controlPlane,
      readiness,
      terminalSummary: '',
    }),
  };
}

export default runPantavionKernelRealRunner;
