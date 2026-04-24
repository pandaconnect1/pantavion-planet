// scripts/export-cognitive-memory-stratification-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runCognitiveMemoryStratificationWave } from '../core/memory/cognitive-memory-stratification-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runCognitiveMemoryStratificationWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/cognitive-memory-stratification-${stamp}.json`;
  const txtPath = `./exports/cognitive-memory-stratification-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('COGNITIVE_MEMORY_STRATIFICATION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
