// scripts/export-kernel-saved.ts

import { createKernelSavedExport } from '../core/kernel/kernel-saved-export';

async function main(): Promise<void> {
  const jsonExport = await createKernelSavedExport({
    kind: 'json',
    command: 'run:entrypoint',
    metadata: {
      script: 'export-kernel-saved',
    },
  });

  const summaryExport = await createKernelSavedExport({
    kind: 'summary',
    metadata: {
      script: 'export-kernel-saved',
    },
  });

  const combinedExport = await createKernelSavedExport({
    kind: 'combined',
    command: 'run:entrypoint',
    metadata: {
      script: 'export-kernel-saved',
    },
  });

  console.log('PANTAVION KERNEL SAVED EXPORT SCRIPT');
  console.log(`json=${jsonExport.filenameHint} (${jsonExport.byteLength} bytes)`);
  console.log(`summary=${summaryExport.filenameHint} (${summaryExport.byteLength} bytes)`);
  console.log(`combined=${combinedExport.filenameHint} (${combinedExport.byteLength} bytes)`);
  console.log('');
  console.log(combinedExport.text);
}

void main();
