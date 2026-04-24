// scripts/run-ai-authority-registry-wave.ts

import { runAIAuthorityRegistryWave } from '../core/intelligence/ai-authority-registry-wave';

async function main(): Promise<void> {
  const output = await runAIAuthorityRegistryWave();
  console.log(output.rendered);
}

void main();
