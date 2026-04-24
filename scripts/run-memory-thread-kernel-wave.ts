// scripts/run-memory-thread-kernel-wave.ts

import { runMemoryThreadKernelWave } from '../core/memory/memory-thread-kernel';

async function main(): Promise<void> {
  const output = await runMemoryThreadKernelWave();
  console.log(output.rendered);
}

void main();
