// scripts/run-final-closure-audit-wave.ts

import { runFinalClosureAuditWave } from '../core/kernel/final-closure-audit-wave';

async function main(): Promise<void> {
  const output = await runFinalClosureAuditWave();
  console.log(output.rendered);
}

void main();
