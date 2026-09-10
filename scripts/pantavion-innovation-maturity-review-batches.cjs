const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review', 'maturity-review-queue.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-maturity-review-batches');
const batchSize = 100;
const expectedParentQueueFingerprint = 'f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7';

function fail(message) {
  console.error('PANTAVION INNOVATION MATURITY REVIEW BATCHES: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function itemLine(item) {
  return [
    item.ordinal,
    item.atomId,
    item.atomFingerprint,
    item.reviewPriority,
    item.sourceTraceStatus,
    item.overlapSuggestionCount,
    item.decision,
  ].join(':');
}

if (!fs.existsSync(sourcePath)) fail('missing parent maturity queue');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!Array.isArray(source.reviews)) fail('parent reviews array missing');
if (source.manifest?.maturityQueueFingerprint !== expectedParentQueueFingerprint) {
  fail('exact tested parent maturity queue fingerprint drifted');
}

const batches = [];
for (let offset = 0; offset < source.reviews.length; offset += batchSize) {
  const slice = source.reviews.slice(offset, offset + batchSize);
  const sequence = batches.length + 1;
  const items = slice.map((review, index) => ({
    ordinal: offset + index + 1,
    atomId: review.atomId,
    atomFingerprint: review.atomFingerprint,
    reviewPriority: review.reviewPriority,
    sourceTraceStatus: review.sourceTraceStatus,
    overlapSuggestionCount: review.overlapSuggestionCount,
    decision: 'HOLD_EVIDENCE_REVIEW_REQUIRED',
  }));
  const batchId = 'maturity-review-batch-' + String(sequence).padStart(4, '0');
  batches.push({
    batchId,
    sequence,
    sourceQueueFingerprint: expectedParentQueueFingerprint,
    startOrdinal: offset + 1,
    endOrdinal: offset + items.length,
    itemCount: items.length,
    items,
    batchFingerprint: hash(items.map(itemLine).join('\n')),
    humanAssigned: false,
    humanReviewed: false,
    ownerApproved: false,
    maturityClaimsAllowed: false,
    semanticMergeAllowed: false,
    executionAllowed: false,
    authorizationEffect: 'none',
  });
}

const reviewBatchSetFingerprint = hash(
  batches.map(batch => batch.batchId + ':' + batch.batchFingerprint).join('\n')
);
const totals = {
  sourceReviews: source.reviews.length,
  batchedReviews: batches.reduce((sum, batch) => sum + batch.itemCount, 0),
  batchCount: batches.length,
  fullBatches: batches.filter(batch => batch.itemCount === batchSize).length,
  partialBatches: batches.filter(batch => batch.itemCount < batchSize).length,
  humanAssignedBatches: 0,
  humanReviewedBatches: 0,
  ownerApprovedBatches: 0,
  maturityClaimsAllowed: 0,
  semanticMergesAllowed: 0,
  executionAuthorizedBatches: 0,
  unsupportedNoveltyClaims: 0,
};
const manifest = {
  id: 'pantavion_innovation_maturity_review_batches_v1',
  lifecycleState: 'CODED',
  sourceMaturityQueueId: source.manifest?.id || null,
  sourceMaturityQueueFingerprint: expectedParentQueueFingerprint,
  batchSize,
  reviewBatchSetFingerprint,
  method: 'Deterministic loss-preserving partitioning of the exact tested maturity queue into bounded human-review batches.',
  truthRule: 'A batch is scheduling evidence only. It performs no adjudication, maturity inference, semantic merge, novelty claim, owner approval or execution authorization.',
  totals,
  requiredNextStage: 'FOUNDER_OR_DELEGATED_HUMAN_REVIEW',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'review-batches.json'), JSON.stringify({ manifest, batches }, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'review-batches.ndjson'), batches.map(batch => JSON.stringify(batch)).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
