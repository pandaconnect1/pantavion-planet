// scripts/export-canonical-routing-truth-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runCanonicalRoutingTruthWave } from '../core/protocol/canonical-routing-truth-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runCanonicalRoutingTruthWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/canonical-routing-truth-${stamp}.json`;
  const txtPath = `./exports/canonical-routing-truth-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('CANONICAL_ROUTING_TRUTH_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
