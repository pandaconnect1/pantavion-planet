// scripts/export-commercial-billing-rail-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runCommercialBillingRailWave } from '../core/commercial/commercial-billing-rail-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runCommercialBillingRailWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/commercial-billing-rail-${stamp}.json`;
  const txtPath = `./exports/commercial-billing-rail-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('COMMERCIAL_BILLING_RAIL_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
