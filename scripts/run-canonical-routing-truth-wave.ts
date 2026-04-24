// scripts/run-canonical-routing-truth-wave.ts

import { runCanonicalRoutingTruthWave } from '../core/protocol/canonical-routing-truth-wave';

async function main(): Promise<void> {
  const output = await runCanonicalRoutingTruthWave();
  console.log(output.rendered);
}

void main();
