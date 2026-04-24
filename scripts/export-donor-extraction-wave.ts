// scripts/export-donor-extraction-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runDonorExtractionWave } from '../core/recovery/donor-extraction-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runDonorExtractionWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/donor-extraction-${stamp}.json`;
  const txtPath = `./exports/donor-extraction-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('DONOR_EXTRACTION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
