// scripts/run-provider-adapter-wave.ts

import { runProviderAdapterWave } from '../core/protocol/provider-dispatch-orchestrator';

async function main(): Promise<void> {
  const output = await runProviderAdapterWave();
  console.log(output.rendered);
}

void main();
