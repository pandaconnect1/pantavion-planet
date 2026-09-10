const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review', 'maturity-review-queue.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-maturity-review-batches');
const manifestPath = path.join(dir, 'manifest.json');
const batchesPath = path.join(dir, 'review-batches.json');
const ndjsonPath = path.join(dir, 'review-batches.ndjson');
const expectedSourceReviews = 38014;
const expectedBatchSize = 100;
const expectedParentQueueFingerprint = 'f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7';

function fail(message) {
  console.error('PANTAVION INNOVATION MATURITY REVIEW BATCH GATE: FAIL - ' + message);
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

for (const file of [sourcePath, manifestPath, batchesPath, ndjsonPath]) {
  if (!fs.existsSync(file)) fail('required artifact missing: ' + path.relative(root, file));
}
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(batchesPath, 'utf8'));
const ndjson = fs.readFileSync(ndjsonPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

if (!Array.isArray(source.reviews) || !Array.isArray(projection.batches)) fail('required arrays missing');
if (manifest.id !== 'pantavion_innovation_maturity_review_batches_v1') fail('unexpected manifest id');
if (JSON.stringify(projection.manifest) !== JSON.stringify(manifest)) fail('embedded manifest mismatch');
if (JSON.stringify(ndjson) !== JSON.stringify(projection.batches)) fail('NDJSON projection mismatch');
if (source.reviews.length !== expectedSourceReviews) fail('exact parent review count drifted');
if (source.manifest?.maturityQueueFingerprint !== expectedParentQueueFingerprint) fail('exact parent queue fingerprint drifted');
if (manifest.sourceMaturityQueueFingerprint !== expectedParentQueueFingerprint) fail('manifest parent fingerprint mismatch');
if (manifest.batchSize !== expectedBatchSize) fail('unexpected batch size');

const seen = new Set();
const expectedBatchCount = Math.ceil(source.reviews.length / expectedBatchSize);
if (projection.batches.length !== expectedBatchCount) fail('batch count mismatch');

for (let batchIndex = 0; batchIndex < projection.batches.length; batchIndex += 1) {
  const batch = projection.batches[batchIndex];
  const expectedSlice = source.reviews.slice(batchIndex * expectedBatchSize, (batchIndex + 1) * expectedBatchSize);
  const expectedSequence = batchIndex + 1;
  const expectedId = 'maturity-review-batch-' + String(expectedSequence).padStart(4, '0');
  if (batch.batchId !== expectedId || batch.sequence !== expectedSequence) fail('batch identity mismatch: ' + expectedId);
  if (batch.sourceQueueFingerprint !== expectedParentQueueFingerprint) fail('batch parent fingerprint mismatch: ' + expectedId);
  if (batch.startOrdinal !== batchIndex * expectedBatchSize + 1) fail('batch start ordinal mismatch: ' + expectedId);
  if (batch.endOrdinal !== batch.startOrdinal + batch.itemCount - 1) fail('batch end ordinal mismatch: ' + expectedId);
  if (batch.itemCount !== expectedSlice.length || !Array.isArray(batch.items) || batch.items.length !== expectedSlice.length) {
    fail('batch item count mismatch: ' + expectedId);
  }
  if (batch.itemCount < 1 || batch.itemCount > expectedBatchSize) fail('batch bounds violated: ' + expectedId);
  for (let itemIndex = 0; itemIndex < batch.items.length; itemIndex += 1) {
    const item = batch.items[itemIndex];
    const review = expectedSlice[itemIndex];
    const expectedOrdinal = batchIndex * expectedBatchSize + itemIndex + 1;
    if (item.ordinal !== expectedOrdinal || item.atomId !== review.atomId) fail('canonical item order mismatch: ' + expectedId);
    if (seen.has(item.atomId)) fail('duplicate atom across batches: ' + item.atomId);
    seen.add(item.atomId);
    if (item.atomFingerprint !== review.atomFingerprint ||
        item.reviewPriority !== review.reviewPriority ||
        item.sourceTraceStatus !== review.sourceTraceStatus ||
        item.overlapSuggestionCount !== review.overlapSuggestionCount) {
      fail('item evidence mismatch: ' + item.atomId);
    }
    if (item.decision !== 'HOLD_EVIDENCE_REVIEW_REQUIRED') fail('unsupported item decision: ' + item.atomId);
  }
  if (batch.batchFingerprint !== hash(batch.items.map(itemLine).join('\n'))) fail('batch fingerprint mismatch: ' + expectedId);
  for (const field of ['humanAssigned','humanReviewed','ownerApproved','maturityClaimsAllowed','semanticMergeAllowed','executionAllowed']) {
    if (batch[field] !== false) fail('unauthorized batch state: ' + field + ' for ' + expectedId);
  }
  if (batch.authorizationEffect !== 'none') fail('authorization effect must remain none: ' + expectedId);
}

if (seen.size !== source.reviews.length) fail('source reviews were omitted or duplicated');
for (const review of source.reviews) if (!seen.has(review.atomId)) fail('source atom omitted: ' + review.atomId);
const expectedSetFingerprint = hash(projection.batches.map(batch => batch.batchId + ':' + batch.batchFingerprint).join('\n'));
if (manifest.reviewBatchSetFingerprint !== expectedSetFingerprint) fail('batch set fingerprint mismatch');

const totals = manifest.totals || {};
const expectedFullBatches = Math.floor(source.reviews.length / expectedBatchSize);
const expectedPartialBatches = source.reviews.length % expectedBatchSize === 0 ? 0 : 1;
if (totals.sourceReviews !== expectedSourceReviews || totals.batchedReviews !== expectedSourceReviews) fail('coverage totals mismatch');
if (totals.batchCount !== expectedBatchCount || totals.fullBatches !== expectedFullBatches || totals.partialBatches !== expectedPartialBatches) fail('batch totals mismatch');
for (const field of ['humanAssignedBatches','humanReviewedBatches','ownerApprovedBatches','maturityClaimsAllowed','semanticMergesAllowed','executionAuthorizedBatches','unsupportedNoveltyClaims']) {
  if (totals[field] !== 0) fail('non-zero forbidden total: ' + field);
}

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION MATURITY REVIEW BATCHES',
  result: 'PASS',
  sourceReviews: expectedSourceReviews,
  batchedReviews: seen.size,
  batchCount: expectedBatchCount,
  fullBatches: expectedFullBatches,
  finalBatchItems: projection.batches[projection.batches.length - 1].itemCount,
  omittedReviews: expectedSourceReviews - seen.size,
  duplicateReviews: 0,
  humanReviewedBatches: 0,
  ownerApprovedBatches: 0,
  maturityClaimsAllowed: 0,
  semanticMergesAllowed: 0,
  executionAuthorizedBatches: 0,
  unsupportedNoveltyClaims: 0,
  reviewBatchSetFingerprint: manifest.reviewBatchSetFingerprint,
}, null, 2));
