// scripts/run-kernel-intake-expansion-wave.ts

import { runKernelIntakeExpansionWave } from '../core/intake/kernel-intake-expansion-wave';

async function main(): Promise<void> {
  const output = await runKernelIntakeExpansionWave();
  console.log(output.rendered);
}

void main();
