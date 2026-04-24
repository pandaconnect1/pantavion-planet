// scripts/run-kernel-constitution-regeneration-wave.ts

import { runKernelConstitutionRegenerationWave } from '../core/kernel/kernel-constitution-regeneration-wave';

async function main(): Promise<void> {
  const output = await runKernelConstitutionRegenerationWave();
  console.log(output.rendered);
}

void main();
