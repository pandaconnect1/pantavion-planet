// scripts/run-kernel-persistence-wave.ts

import { runKernelPersistenceWave } from '../core/storage/kernel-persistence-orchestrator';

async function main(): Promise<void> {
  const output = await runKernelPersistenceWave();
  console.log(output.rendered);
}

void main();
