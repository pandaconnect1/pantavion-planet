const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'preseed-research-shortlist', 'shortlist.json');
const outDir = path.join(root, 'data', 'recovery', 'preseed-shortlist-quality-audit');
const expectedShortlistFingerprint = '784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6';
const expectedCount = 150;

function fail(message) {
  console.error('PANTAVION PRESEED SHORTLIST QUALITY AUDIT: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function csvEscape(value) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}
function classify(value) {
  const text = String(value || '').trim();
  if (/^\"[^\"]+:\\s*[^\"]+\"[,]?$/.test(text)) {
    return { classification:'CODE_OR_CONFIG_FRAGMENT', reasons:['quoted_config_shape'], researchEligible:false };
  }
  const literalOrIdentifier = /^("[^:"]+"|'[^:']+'|\x60[^\x60]+\x60|[A-Z][A-Z0-9_]+),?$/.test(text);
  if (literalOrIdentifier) {
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

if (!fs.existsSync(sourcePath)) fail('exact #492 shortlist missing');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!Array.isArray(source.shortlist) || source.shortlist.length !== expectedCount) fail('source shortlist count drifted');
if (source.manifest?.shortlistFingerprint !== expectedShortlistFingerprint) fail('source shortlist fingerprint drifted');

const audits = source.shortlist.map((item, index) => {
  if (item.selectionOrdinal !== index + 1) fail('source order drifted');
  const result = classify(item.atomicMechanism);
  return {
    auditOrdinal: index + 1,
    sourceSelectionOrdinal: item.selectionOrdinal,
    atomId: item.atomId,
    atomFingerprint: item.atomFingerprint,
    capabilityId: item.capabilityId,
    atomicMechanism: item.atomicMechanism,
    ...result,
    noveltyStatus: 'NO_CLAIM',
    patentabilityStatus: 'NO_CLAIM',
    priorArtResearchAllowed: false,
    applicationEvidenceAllowed: false,
    humanOverrideRecorded: false,
    sourceDeleted: false,
    executionAllowed: false,
    authorizationEffect: 'none',
  };
});
const counts = audits.reduce((acc, item) => {
  acc[item.classification] = (acc[item.classification] || 0) + 1;
  return acc;
}, {});
if (counts.CODE_OR_CONFIG_FRAGMENT !== 140 || counts.LITERAL_OR_IDENTIFIER_FRAGMENT !== 6 || counts.OTHER_INCOMPLETE_FRAGMENT !== 4) fail('quality classification count drifted');
if (audits.some(item => item.researchEligible)) fail('fragment entered research-eligible state');

const auditFingerprint = hash(audits.map(item => [
  item.auditOrdinal,
  item.atomId,
  item.atomFingerprint,
  item.classification,
  item.reasons.join('|'),
  item.researchEligible,
].join(':')).join('\n'));
const manifest = {
  id: 'pantavion_preseed_shortlist_quality_audit_v1',
  lifecycleState: 'CODED',
  sourceShortlistFingerprint: expectedShortlistFingerprint,
  auditFingerprint,
  verdict: 'REJECT_FOR_INNOVATION_RESEARCH',
  method: 'Deterministic syntax/shape audit of the exact #492 shortlist artifact. All source rows are preserved and classified; none are silently removed or promoted.',
  truthRule: 'Mechanical determinism does not establish semantic research fitness. Fragmentary code, configuration, literals and incomplete text cannot be treated as inventions or prior-art research candidates.',
  totals: {
    sourceItems: expectedCount,
    auditedItems: audits.length,
    codeOrConfigFragments: counts.CODE_OR_CONFIG_FRAGMENT,
    literalOrIdentifierFragments: counts.LITERAL_OR_IDENTIFIER_FRAGMENT,
    otherIncompleteFragments: counts.OTHER_INCOMPLETE_FRAGMENT,
    coherentTechnicalMechanisms: 0,
    researchEligible: 0,
    priorArtResearchAllowed: 0,
    applicationEvidenceAllowed: 0,
    noveltyClaims: 0,
    patentabilityClaims: 0,
    sourceRowsPreserved: audits.length,
    sourceRowsDeleted: 0,
    executionAuthorized: 0,
  },
  requiredCorrection: [
    'REBUILD_SELECTION_FROM_COHERENT_TECHNICAL_STATEMENTS',
    'REQUIRE_SEMANTIC_QUALITY_GATE_BEFORE_RANKING',
    'REVERIFY_ALL_DOWNSTREAM_RESEARCH_DOSSIERS',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify({ manifest, audits }, null, 2) + '\n');
const rows = [['ordinal','atom_id','capability_id','classification','research_eligible','reason','atomic_mechanism']];
for (const item of audits) rows.push([item.auditOrdinal,item.atomId,item.capabilityId,item.classification,item.researchEligible,item.reasons.join('|'),item.atomicMechanism]);
fs.writeFileSync(path.join(outDir, 'audit.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
