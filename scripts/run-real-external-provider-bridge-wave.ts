// scripts/run-real-external-provider-bridge-wave.ts

import { runRealExternalProviderBridgeWave } from '../core/protocol/external-provider-bridge-orchestrator';

async function main(): Promise<void> {
  const output = await runRealExternalProviderBridgeWave();
  console.log(output.rendered);
}

void main();
