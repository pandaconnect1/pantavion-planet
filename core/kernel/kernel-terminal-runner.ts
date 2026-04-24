// core/kernel/kernel-terminal-runner.ts

import {
  runPantavionKernelRealRunner,
  renderKernelRealRunnerSummary,
  type PantavionKernelRealRunnerOutput,
} from './kernel-real-runner';

import {
  buildKernelOpsReport,
  type PantavionKernelOpsReport,
} from './kernel-ops-report';

export interface PantavionKernelTerminalRunnerOutput {
  realRunner: PantavionKernelRealRunnerOutput;
  opsReport: PantavionKernelOpsReport;
  rendered: string;
}

function renderOpsReportBlock(
  report: PantavionKernelOpsReport,
): string {
  const lines: string[] = [];

  lines.push('OPS REPORT');
  lines.push(`status=${report.status}`);
  lines.push(`headline=${report.headline}`);
  lines.push('topActions:');

  for (const action of report.topActions) {
    lines.push(`- ${action}`);
  }

  lines.push('priorities:');
  for (const item of report.priorities.items.slice(0, 10)) {
    lines.push(
      `- [${item.severity.toUpperCase()}][${item.category}] ${item.title}: ${item.summary}`,
    );
  }

  return lines.join('\n');
}

export function renderKernelTerminalRunnerOutput(
  output: PantavionKernelTerminalRunnerOutput,
): string {
  return [
    renderKernelRealRunnerSummary(output.realRunner),
    '',
    renderOpsReportBlock(output.opsReport),
  ].join('\n');
}

export async function runPantavionKernelTerminalRunner(): Promise<PantavionKernelTerminalRunnerOutput> {
  const realRunner = await runPantavionKernelRealRunner();
  const opsReport = buildKernelOpsReport(realRunner.controlPlane);

  const rendered = renderKernelTerminalRunnerOutput({
    realRunner,
    opsReport,
    rendered: '',
  });

  return {
    realRunner,
    opsReport,
    rendered,
  };
}

export default runPantavionKernelTerminalRunner;
