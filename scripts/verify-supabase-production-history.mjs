import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const baseline = JSON.parse(await readFile('supabase/production-history-baseline.json', 'utf8'));
const failures = [];
let exactMatches = 0;
let terminalLfMatches = 0;

const md5Of = (text) => createHash('md5').update(text, 'utf8').digest('hex');

for (const entry of baseline.entries) {
  const path = `supabase/migrations/${entry.version}_${entry.name}.sql`;
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    failures.push(`${path}: missing`);
    continue;
  }

  const md5 = md5Of(text);
  const chars = text.length;
  if (md5 === entry.md5 && chars === entry.chars) {
    exactMatches++;
    continue;
  }

  // Git text files conventionally end with one LF, while Supabase's migration
  // ledger may persist the submitted statement without that terminal LF.
  // Permit only this single representational difference; all other bytes must match.
  if (text.endsWith('\n') && !text.endsWith('\n\n')) {
    const withoutTerminalLf = text.slice(0, -1);
    if (withoutTerminalLf.length === entry.chars && md5Of(withoutTerminalLf) === entry.md5) {
      terminalLfMatches++;
      continue;
    }
  }

  failures.push(`${path}: expected md5=${entry.md5} chars=${entry.chars}; got md5=${md5} chars=${chars}`);
}

if (failures.length) {
  console.error('Supabase production migration provenance verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Verified ${baseline.entries.length} canonical production migration files against the captured production ledger: ` +
  `${exactMatches} exact byte matches, ${terminalLfMatches} matches differing only by one terminal LF.`
);
