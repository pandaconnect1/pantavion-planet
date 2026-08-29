import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const baseline = JSON.parse(await readFile('supabase/production-history-baseline.json', 'utf8'));
const failures = [];
let exactMatches = 0;
let terminalLfMatches = 0;
let scopedSemanticMatches = 0;

const md5Of = (text) => createHash('md5').update(text, 'utf8').digest('hex');
const whitespaceNormalized = (text) => text.trim().replace(/\s+/g, ' ');
const codePoints = (value) => [...String(value)].map((char) => char.codePointAt(0));

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

  if (text.endsWith('\n') && !text.endsWith('\n\n')) {
    const withoutTerminalLf = text.slice(0, -1);
    if (withoutTerminalLf.length === entry.chars && md5Of(withoutTerminalLf) === entry.md5) {
      terminalLfMatches++;
      continue;
    }
  }

  if (entry.verificationMode === 'whitespace_normalized') {
    const normalized = whitespaceNormalized(text);
    if (
      normalized.length === entry.normalizedChars &&
      md5Of(normalized) === entry.whitespaceNormalizedMd5
    ) {
      scopedSemanticMatches++;
      continue;
    }
  }

  failures.push(
    `${path}: expected md5=${entry.md5} chars=${entry.chars}; got md5=${md5} chars=${chars}; ` +
      `expectedMd5Length=${String(entry.md5).length} gotMd5Length=${md5.length}; ` +
      `expectedCharsType=${typeof entry.chars} gotCharsType=${typeof chars}; ` +
      `expectedMd5Codes=${JSON.stringify(codePoints(entry.md5))}; gotMd5Codes=${JSON.stringify(codePoints(md5))}`,
  );
}

if (failures.length) {
  console.error('Supabase production migration provenance verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Verified ${baseline.entries.length} canonical production migration files against the captured production ledger: ` +
  `${exactMatches} exact byte matches, ${terminalLfMatches} matches differing only by one terminal LF, ` +
  `${scopedSemanticMatches} explicitly audited whitespace-normalized match.`
);