// scripts/export-memory-thread-kernel-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runMemoryThreadKernelWave } from '../core/memory/memory-thread-kernel';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runMemoryThreadKernelWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/memory-thread-kernel-${stamp}.json`;
  const txtPath = `./exports/memory-thread-kernel-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('MEMORY_THREAD_KERNEL_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
