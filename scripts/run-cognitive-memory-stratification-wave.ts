// scripts/run-cognitive-memory-stratification-wave.ts

import { runCognitiveMemoryStratificationWave } from '../core/memory/cognitive-memory-stratification-wave';

async function main(): Promise<void> {
  const output = await runCognitiveMemoryStratificationWave();
  console.log(output.rendered);
}

void main();
