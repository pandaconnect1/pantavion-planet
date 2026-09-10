const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'preseed-research-shortlist', 'shortlist.json');
const dir = path.join(root, 'data', 'recovery', 'preseed-shortlist-quality-audit');
const manifestPath = path.join(dir, 'manifest.json');
const auditPath = path.join(dir, 'audit.json');
const csvPath = path.join(dir, 'audit.csv');
const expectedShortlistFingerprint = '784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6';

function fail(message) {
  console.error('PANTAVION PRESEED SHORTLIST QUALITY GATE: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function classify(value) {
  const text = String(value || '').trim();
  if (/^\"[^\"]+:\s*[^\"]+\"[,]?$/.test(text)) {
    return { classification:'CODE_OR_CONFIG_FRAGMENT', reasons:['quoted_config_shape'], researchEligible:false };
  }
  if (/^("[^:"]+"|'[^:']+'|\x60[^\x60]+\x60|[A-Z][A-Z0-9_]+),?$/.test(text)) {
    return { classification:'LITERAL_OR_IDENTIFIER_FRAGMENT', reasons:['standalone_literal_or_identifier'], researchEligible:false };
  }
  const startsAsCode = /^(import|export|const|let|var|function|async|return|if\b|for\b|case\b|from\(|order\(|addRecommendation\(|runKernel|isPantavion|createPantavion|NextResponse|<|\{|\[)/.test(text);
  const containsCodeSyntax = /[;{}()]|=>|<\/?[A-Za-z]/.test(text);
  const fieldOrConfig = /^[A-Za-z_$][\w$]*\??:\s*/.test(text) || /^"[^"]+":\s*/.test(text);
  if (startsAsCode || containsCodeSyntax || fieldOrConfig) {
    const reasons = [];
    if (startsAsCode) reasons.push('code_or_command_prefix');
    if (containsCodeSyntax) reasons.push('code_syntax_tokens');
    if (fieldOrConfig) reasons.push('field_or_config_shape');
    return { classification:'CODE_OR_CONFIG_FRAGMENT', reasons, researchEligible:false };
  }
  return { classification:'OTHER_INCOMPLETE_FRAGMENT', reasons:['not_a_complete_technical_mechanism'], researchEligible:false };
}
function csvRecordCount(value) {
  let quoted = false;
  let records = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '"') {
      if (quoted && value[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (value[i] === '\n' && !quoted) records += 1;
  }
  if (quoted) fail('CSV unterminated quoted field');
  return records;
}

for (const file of [sourcePath, manifestPath, auditPath, csvPath]) if (!fs.existsSync(file)) fail('missing artifact: ' + path.relative(root, file));
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');
if (!Array.isArray(source.shortlist) || !Array.isArray(projection.audits)) fail('required arrays missing');
if (source.shortlist.length !== 150 || projection.audits.length !== 150) fail('coverage count mismatch');
if (source.manifest?.shortlistFingerprint !== expectedShortlistFingerprint || manifest.sourceShortlistFingerprint !== expectedShortlistFingerprint) fail('source fingerprint mismatch');
if (manifest.id !== 'pantavion_preseed_shortlist_quality_audit_v1' || manifest.verdict !== 'REJECT_FOR_INNOVATION_RESEARCH') fail('fail-closed verdict missing');
if (JSON.stringify(manifest) !== JSON.stringify(projection.manifest)) fail('embedded manifest mismatch');

const seen = new Set();
for (let index = 0; index < source.shortlist.length; index += 1) {
  const item = source.shortlist[index];
  const audit = projection.audits[index];
  const expected = classify(item.atomicMechanism);
  if (audit.auditOrdinal !== index + 1 || audit.sourceSelectionOrdinal !== item.selectionOrdinal) fail('ordinal mismatch');
  if (seen.has(audit.atomId)) fail('duplicate atom');
  seen.add(audit.atomId);
  for (const field of ['atomId','atomFingerprint','capabilityId','atomicMechanism']) {
    if (audit[field] !== item[field]) fail('source binding mismatch: ' + field);
  }
  if (audit.classification !== expected.classification || JSON.stringify(audit.reasons) !== JSON.stringify(expected.reasons) || audit.researchEligible !== false) fail('classification mismatch');
  if (audit.noveltyStatus !== 'NO_CLAIM' || audit.patentabilityStatus !== 'NO_CLAIM' || audit.priorArtResearchAllowed !== false || audit.applicationEvidenceAllowed !== false) fail('unsupported research state');
  if (audit.humanOverrideRecorded !== false || audit.sourceDeleted !== false || audit.executionAllowed !== false || audit.authorizationEffect !== 'none') fail('unauthorized effect');
}
const counts = projection.audits.reduce((acc, item) => {
  acc[item.classification] = (acc[item.classification] || 0) + 1;
  return acc;
}, {});
if (counts.CODE_OR_CONFIG_FRAGMENT !== 140 || counts.LITERAL_OR_IDENTIFIER_FRAGMENT !== 6 || counts.OTHER_INCOMPLETE_FRAGMENT !== 4) fail('exact classification totals mismatch');
const expectedFingerprint = hash(projection.audits.map(item => [
  item.auditOrdinal,
  item.atomId,
  item.atomFingerprint,
  item.classification,
  item.reasons.join('|'),
  item.researchEligible,
].join(':')).join('\n'));
if (manifest.auditFingerprint !== expectedFingerprint) fail('audit fingerprint mismatch');
const totals = manifest.totals || {};
if (totals.sourceItems !== 150 || totals.auditedItems !== 150 || totals.codeOrConfigFragments !== 140 || totals.literalOrIdentifierFragments !== 6 || totals.otherIncompleteFragments !== 4 || totals.coherentTechnicalMechanisms !== 0 || totals.researchEligible !== 0 || totals.sourceRowsPreserved !== 150 || totals.sourceRowsDeleted !== 0) fail('manifest totals mismatch');
for (const field of ['priorArtResearchAllowed','applicationEvidenceAllowed','noveltyClaims','patentabilityClaims','executionAuthorized']) if (totals[field] !== 0) fail('forbidden non-zero total');
if (csvRecordCount(csv) !== 151) fail('CSV logical row count mismatch');

console.log(JSON.stringify({
  gate:'PANTAVION PRESEED SHORTLIST QUALITY',
  result:'PASS',
  verdict:manifest.verdict,
  sourceItems:150,
  codeOrConfigFragments:140,
  literalOrIdentifierFragments:6,
  otherIncompleteFragments:4,
  coherentTechnicalMechanisms:0,
  researchEligible:0,
  sourceRowsPreserved:150,
  sourceRowsDeleted:0,
  noveltyClaims:0,
  patentabilityClaims:0,
  executionAuthorized:0,
  auditFingerprint:manifest.auditFingerprint,
}, null, 2));
