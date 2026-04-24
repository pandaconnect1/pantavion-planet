// scripts/export-founder-human-final-authority-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runFounderHumanFinalAuthorityWave } from '../core/governance/founder-human-final-authority-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runFounderHumanFinalAuthorityWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/founder-human-final-authority-${stamp}.json`;
  const txtPath = `./exports/founder-human-final-authority-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('FOUNDER_HUMAN_FINAL_AUTHORITY_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
