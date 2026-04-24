// scripts/export-kernel-intake-expansion-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runKernelIntakeExpansionWave } from '../core/intake/kernel-intake-expansion-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runKernelIntakeExpansionWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/kernel-intake-expansion-${stamp}.json`;
  const txtPath = `./exports/kernel-intake-expansion-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('KERNEL_INTAKE_EXPANSION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
