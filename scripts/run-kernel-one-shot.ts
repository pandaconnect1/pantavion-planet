// scripts/run-kernel-one-shot.ts

import { runPantavionKernelOneShotRunner } from '../core/kernel/kernel-one-shot-runner';

async function main(): Promise<void> {
  const output = await runPantavionKernelOneShotRunner();
  console.log(output.rendered);
}

void main();
