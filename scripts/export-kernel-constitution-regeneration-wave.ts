// scripts/export-kernel-constitution-regeneration-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runKernelConstitutionRegenerationWave } from '../core/kernel/kernel-constitution-regeneration-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runKernelConstitutionRegenerationWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/kernel-constitution-regeneration-${stamp}.json`;
  const txtPath = `./exports/kernel-constitution-regeneration-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('KERNEL_CONSTITUTION_REGENERATION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
