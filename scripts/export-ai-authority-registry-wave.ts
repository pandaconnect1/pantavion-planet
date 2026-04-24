// scripts/export-ai-authority-registry-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runAIAuthorityRegistryWave } from '../core/intelligence/ai-authority-registry-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runAIAuthorityRegistryWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/ai-authority-registry-${stamp}.json`;
  const txtPath = `./exports/ai-authority-registry-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('AI_AUTHORITY_REGISTRY_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
