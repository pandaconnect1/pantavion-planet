import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const baseline = JSON.parse(await readFile('supabase/production-history-baseline.json', 'utf8'));
const failures = [];

for (const entry of baseline.entries) {
  const path = `supabase/migrations/${entry.version}_${entry.name}.sql`;
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    failures.push(`${path}: missing`);
    continue;
  }
  const md5 = createHash('md5').update(text, 'utf8').digest('hex');
  const chars = text.length;
  if (md5 !== entry.md5 || chars !== entry.chars) {
    failures.push(`${path}: expected md5=${entry.md5} chars=${entry.chars}; got md5=${md5} chars=${chars}`);
  }
}

if (failures.length) {
  console.error('Supabase production migration provenance verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${baseline.entries.length} canonical production migration files byte-for-byte against the captured production ledger.`);
