// scripts/run-runtime-hardening-wave.ts

import { runRuntimeHardeningWave } from '../core/runtime/runtime-hardening-orchestrator';

async function main(): Promise<void> {
  const output = await runRuntimeHardeningWave();
  console.log(output.rendered);
}

void main();
