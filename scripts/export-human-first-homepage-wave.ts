// scripts/export-human-first-homepage-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runHumanFirstHomepageWave } from '../core/public-surface/human-first-homepage-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = runHumanFirstHomepageWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/human-first-homepage-${stamp}.json`;
  const txtPath = `./exports/human-first-homepage-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('HUMAN_FIRST_HOMEPAGE_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
