// scripts/run-external-routing-promotion-mini-wave.ts

import { runExternalRoutingPromotionMiniWave } from '../core/protocol/external-routing-promotion-mini-wave';

async function main(): Promise<void> {
  const output = await runExternalRoutingPromotionMiniWave();
  console.log(output.rendered);
}

void main();
