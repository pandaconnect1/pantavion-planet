// scripts/export-cross-device-continuity-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runCrossDeviceContinuityWave } from '../core/continuity/cross-device-continuity-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runCrossDeviceContinuityWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/cross-device-continuity-${stamp}.json`;
  const txtPath = `./exports/cross-device-continuity-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('CROSS_DEVICE_CONTINUITY_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
