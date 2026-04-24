// scripts/print-kernel-foundation.ts

import { runPrintableFoundationPack } from '../core/kernel/kernel-printable-foundation-pack';
import { renderKernelFoundationLock } from '../core/kernel/kernel-foundation-lock';

async function main(): Promise<void> {
  const pack = await runPrintableFoundationPack();

  console.log(pack.rendered);
  console.log('');
  console.log(renderKernelFoundationLock());
}

void main();
