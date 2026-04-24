// scripts/run-commercial-billing-rail-wave.ts

import { runCommercialBillingRailWave } from '../core/commercial/commercial-billing-rail-wave';

async function main(): Promise<void> {
  const output = await runCommercialBillingRailWave();
  console.log(output.rendered);
}

void main();
