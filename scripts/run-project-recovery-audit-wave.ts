// scripts/run-project-recovery-audit-wave.ts

import { runProjectRecoveryAuditWave } from '../core/recovery/project-recovery-audit-wave';

async function main(): Promise<void> {
  const output = await runProjectRecoveryAuditWave();
  console.log(output.rendered);
}

void main();
