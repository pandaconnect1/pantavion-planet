import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const shardDir = path.join(root, 'docs/recovery/live/shards');
const canonicalDir = path.join(root, 'docs/recovery/live/canonical');
const routingDir = path.join(root, 'docs/recovery/live/routing');
const contractPath = path.join(routingDir, 'MODULE_GRAPH_ROUTING_CONTRACT_V1.json');
const manifestPath = path.join(routingDir, 'thread-5-routing-manifest.json');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readText = (file) => fs.readFileSync(file, 'utf8');
const rel = (file) => path.relative(root, file).split(path.sep).join('/');
const gitBlobSha = (text) => crypto.createHash('sha1')
  .update(Buffer.concat([
    Buffer.from(`blob ${Buffer.byteLength(text, 'utf8')}\0`, 'utf8'),
    Buffer.from(text, 'utf8'),
  ]))
  .digest('hex');

function routeId(stableRecordKey, relationshipType, targetCanonicalPath) {
  return sha256(Buffer.from(
    ['PANTAVION_ROUTE_V1', stableRecordKey, relationshipType, targetCanonicalPath].join('\0'),
    'utf8'
  ));
}

function pushEdge(edges, stableRecordKey, relationshipType, targetCanonicalPath, extra = {}) {
  const edge = {
    routeId: routeId(stableRecordKey, relationshipType, targetCanonicalPath),
    relationshipType,
    targetCanonicalPath,
    ...extra,
  };
  if (!edges.some((candidate) => candidate.routeId === edge.routeId)) edges.push(edge);
}

function addIndex(map, key, candidate) {
  if (!key) return;
  const list = map.get(key) || [];
  if (!list.some((item) => item.artifact === candidate.artifact && item.stableRecordKey === candidate.stableRecordKey)) {
    list.push(candidate);
  }
  map.set(key, list);
}

function makeArtifactIndex() {
  return { byStableKey: new Map(), byStableKeySha256: new Map() };
}

function collectCanonicalRecords(value, artifact, index, seen, inherited = {}) {
  if (!value || typeof value !== 'object') return;

  const projectId = value.projectId ?? value.project_id ?? inherited.projectId ?? null;
  const deploymentId = value.deploymentId ?? value.deployment_id ?? null;
  let stableRecordKey = typeof value.stableRecordKey === 'string' && value.stableRecordKey.length > 0
    ? value.stableRecordKey
    : null;
  let identityDerivation = stableRecordKey ? 'EXPLICIT_STABLE_RECORD_KEY' : null;

  if (!stableRecordKey && projectId && deploymentId) {
    stableRecordKey = `${projectId}:${deploymentId}`;
    identityDerivation = 'VERCEL_PROJECT_ID_PLUS_DEPLOYMENT_ID';
  }

  if (stableRecordKey) {
    const stableRecordKeySha256 = value.stableRecordKeySha256
      ?? value.stable_record_key_sha256
      ?? sha256(stableRecordKey);
    const dedupKey = `${artifact}\0${stableRecordKey}`;
    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      const derivedDeploymentId = stableRecordKey.includes(':')
        ? stableRecordKey.slice(stableRecordKey.indexOf(':') + 1)
        : null;
      const candidate = {
        artifact,
        stableRecordKey,
        stableRecordKeySha256,
        projectId,
        deploymentId: deploymentId ?? derivedDeploymentId,
        sourceFingerprint: value.sourceFingerprint ?? value.source_fingerprint ?? null,
        canonicalRecordId: value.canonicalRecordId
          ?? value.canonical_record_id
          ?? value.recordId
          ?? value.record_id
          ?? value.id
          ?? null,
        identityDerivation,
      };
      addIndex(index.byStableKey, stableRecordKey, candidate);
      addIndex(index.byStableKeySha256, stableRecordKeySha256, candidate);
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) collectCanonicalRecords(item, artifact, index, seen, { projectId });
    return;
  }
  for (const child of Object.values(value)) {
    collectCanonicalRecords(child, artifact, index, seen, { projectId });
  }
}

function buildCanonicalCatalog() {
  const global = makeArtifactIndex();
  const byArtifact = new Map();
  if (!fs.existsSync(canonicalDir)) return { global, byArtifact };

  for (const name of fs.readdirSync(canonicalDir).filter((n) => n.endsWith('.json')).sort()) {
    const file = path.join(canonicalDir, name);
    const artifact = rel(file);
    let text;
    let doc;
    try {
      text = readText(file);
      doc = JSON.parse(text);
    } catch {
      continue;
    }
    const local = makeArtifactIndex();
    collectCanonicalRecords(doc, artifact, local, new Set());
    byArtifact.set(artifact, {
      ...local,
      text,
      sha256: sha256(text),
      gitBlobSha: gitBlobSha(text),
      uniqueStableRecordKeys: local.byStableKey.size,
    });
    for (const [key, candidates] of local.byStableKey) {
      for (const candidate of candidates) addIndex(global.byStableKey, key, candidate);
    }
    for (const [key, candidates] of local.byStableKeySha256) {
      for (const candidate of candidates) addIndex(global.byStableKeySha256, key, candidate);
    }
  }
  return { global, byArtifact };
}

function tupleFields(recordTuple) {
  if (typeof recordTuple !== 'string') return [];
  const start = recordTuple.indexOf('[');
  const end = recordTuple.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  return recordTuple.slice(start + 1, end).split(',').map((field) => field.trim()).filter(Boolean);
}

function normalizeTupleClassification(classificationDoc, sourceClassification, tuple, index) {
  const fields = tupleFields(classificationDoc.recordTuple);
  if (fields.length === 0 || fields.length !== tuple.length) {
    return {
      stableRecordKey: null,
      stableRecordKeySha256: null,
      sourceFingerprint: null,
      classificationId: null,
      classificationPointer: `${sourceClassification}#records[${index}]`,
      sourceProvenance: { tupleSchema: classificationDoc.recordTuple ?? null },
      classification: {},
      normalizationError: 'UNSUPPORTED_OR_LENGTH_MISMATCH_RECORD_TUPLE',
    };
  }

  const data = Object.fromEntries(fields.map((field, position) => [field, tuple[position]]));
  const profileName = data.profile ?? data.profileName ?? null;
  const profile = profileName ? (classificationDoc?.profiles?.[profileName] || {}) : {};
  const projectId = classificationDoc?.source?.projectId ?? null;
  const deploymentId = data.deploymentId ?? data.deployment_id ?? null;
  const stableRecordKey = projectId && deploymentId ? `${projectId}:${deploymentId}` : null;

  return {
    stableRecordKey,
    stableRecordKeySha256: data.stableRecordKeySha256 ?? data.stable_record_key_sha256 ?? null,
    sourceFingerprint: data.sourceFingerprint ?? data.source_fingerprint ?? null,
    classificationId: null,
    classificationPointer: `${sourceClassification}#records[${index}]`,
    sourceProvenance: {
      projectId,
      deploymentId,
      gitSha: data.gitSha ?? data.git_sha ?? null,
      laneARecordOrdinal: data.laneARecordOrdinal ?? null,
      deploymentState: data.deploymentState ?? data.state ?? null,
      sourcePath: classificationDoc?.source?.path ?? null,
      sourceBlobSha: classificationDoc?.source?.blobSha ?? null,
      canonicalInputPath: classificationDoc?.canonicalInput?.path ?? null,
      canonicalInputBlobSha: classificationDoc?.canonicalInput?.blobSha ?? null,
      liveTruth: classificationDoc?.source?.liveTruth ?? null,
      tupleSchema: classificationDoc.recordTuple,
    },
    classification: {
      theme: profile.theme ?? null,
      section: profile.section ?? null,
      contentType: profile.type ?? null,
      module: profile.module ?? null,
      subsystem: profile.subsystem ?? null,
      capability: profile.capability ?? null,
      feature: profile.feature ?? null,
      canonicalTarget: profile.canonicalTarget ?? null,
      relatedModules: Array.isArray(profile.relatedModules) ? profile.relatedModules : [],
      confidence: data.confidence ?? null,
      reviewRequired: data.reviewRequired === true,
      implementationEvidence: data.implementationEvidence === true,
    },
  };
}

function normalizeClassificationDoc(classificationDoc, sourceClassification) {
  const records = Array.isArray(classificationDoc.records) ? classificationDoc.records : [];
  if (records.length === 0) return [];

  if (records.every((record) => Array.isArray(record))) {
    return records.map((tuple, index) => normalizeTupleClassification(
      classificationDoc,
      sourceClassification,
      tuple,
      index
    ));
  }

  return records.map((record, index) => ({
    ...record,
    stableRecordKeySha256: record.stableRecordKeySha256 ?? null,
    classificationPointer: record.classificationId
      ? `${sourceClassification}#classificationId=${record.classificationId}`
      : `${sourceClassification}#records[${index}]`,
  }));
}

function dedupeCandidates(candidates) {
  const out = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const key = `${candidate.artifact}\0${candidate.stableRecordKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function matchingCandidates(record, index) {
  let candidates = [];
  if (record.stableRecordKey) {
    candidates.push(...(index.byStableKey.get(record.stableRecordKey) || []));
  }
  if (record.stableRecordKeySha256) {
    candidates.push(...(index.byStableKeySha256.get(record.stableRecordKeySha256) || []));
  }
  candidates = dedupeCandidates(candidates);
  if (record?.sourceProvenance?.deploymentId) {
    const exactDeployment = candidates.filter(
      (candidate) => candidate.deploymentId === record.sourceProvenance.deploymentId
    );
    if (exactDeployment.length > 0) candidates = exactDeployment;
  }
  return candidates;
}

function resolveCanonical(record, classificationDoc, catalog) {
  if (record.normalizationError) {
    return { state: 'WAITING_CLASSIFICATION', reason: record.normalizationError, candidates: [] };
  }

  const canonicalInput = classificationDoc?.canonicalInput ?? null;
  if (canonicalInput?.path) {
    const local = catalog.byArtifact.get(canonicalInput.path);
    if (!local) {
      return { state: 'WAITING_CANONICAL', reason: 'DECLARED_CANONICAL_INPUT_NOT_PRESENT', candidates: [] };
    }
    if (canonicalInput.blobSha && local.gitBlobSha !== canonicalInput.blobSha) {
      return { state: 'WAITING_CANONICAL', reason: 'DECLARED_CANONICAL_INPUT_BLOB_SHA_MISMATCH', candidates: [] };
    }
    if (Number.isInteger(canonicalInput.canonicalRecordCount)
      && local.uniqueStableRecordKeys !== canonicalInput.canonicalRecordCount) {
      return { state: 'WAITING_CANONICAL', reason: 'DECLARED_CANONICAL_INPUT_COUNT_MISMATCH', candidates: [] };
    }
    const candidates = matchingCandidates(record, local);
    if (candidates.length === 1) return { state: 'BOUND', candidate: candidates[0], candidates };
    if (candidates.length === 0) {
      return { state: 'WAITING_CANONICAL', reason: 'DECLARED_CANONICAL_INPUT_NO_IDENTITY_MATCH', candidates: [] };
    }
    return { state: 'WAITING_CANONICAL', reason: 'DECLARED_CANONICAL_INPUT_AMBIGUOUS_IDENTITY', candidates };
  }

  const candidates = matchingCandidates(record, catalog.global);
  if (candidates.length === 1) return { state: 'BOUND', candidate: candidates[0], candidates };
  if (candidates.length === 0) {
    return { state: 'WAITING_CANONICAL', reason: 'NO_DURABLE_CANONICAL_LEDGER_MATCH', candidates: [] };
  }
  return { state: 'WAITING_CANONICAL', reason: 'MULTIPLE_DURABLE_CANONICAL_LEDGER_MATCHES', candidates };
}

function chooseSemanticPrimary(group) {
  return [...group].sort((a, b) => {
    const aProduction = a?.sourceProvenance?.deploymentTarget === 'production' ? 1 : 0;
    const bProduction = b?.sourceProvenance?.deploymentTarget === 'production' ? 1 : 0;
    if (aProduction !== bProduction) return bProduction - aProduction;
    return String(a.stableRecordKey).localeCompare(String(b.stableRecordKey));
  })[0];
}

function summarizeClassification(classification) {
  const canonicalTargets = Array.isArray(classification?.canonicalTarget)
    ? classification.canonicalTarget
    : classification?.canonicalTarget ? [classification.canonicalTarget] : [];
  return {
    theme: classification?.theme ?? null,
    section: classification?.section ?? null,
    contentType: classification?.contentType ?? classification?.type ?? null,
    module: classification?.module ?? null,
    subsystem: classification?.subsystem ?? null,
    capability: classification?.capability ?? null,
    feature: classification?.feature ?? null,
    canonicalTarget: canonicalTargets,
    relatedModules: Array.isArray(classification?.relatedModules) ? classification.relatedModules : [],
    implementationEvidence: classification?.implementationEvidence === true,
  };
}

function waitingBinding(record, routeState, reason, canonicalCandidates = []) {
  return {
    stableRecordKey: record.stableRecordKey ?? null,
    stableRecordKeySha256: record.stableRecordKeySha256 ?? null,
    sourceFingerprint: record.sourceFingerprint ?? null,
    canonicalLedgerPointer: null,
    classificationId: record.classificationId ?? null,
    classificationPointer: record.classificationPointer ?? null,
    classificationConfidence: record?.classification?.confidence ?? null,
    sourceProvenance: record.sourceProvenance ?? null,
    classificationSummary: summarizeClassification(record.classification || {}),
    routeState,
    waitingReason: reason,
    canonicalCandidates: canonicalCandidates.map((candidate) => ({
      artifact: candidate.artifact,
      stableRecordKey: candidate.stableRecordKey,
      stableRecordKeySha256: candidate.stableRecordKeySha256,
      canonicalRecordId: candidate.canonicalRecordId,
      sourceFingerprint: candidate.sourceFingerprint,
    })),
    graphEdges: [],
  };
}

function buildBinding(record, canonicalCandidate, mirrorsByGitSha, classificationConflict) {
  const resolvedRecord = {
    ...record,
    stableRecordKey: canonicalCandidate.stableRecordKey,
    stableRecordKeySha256: record.stableRecordKeySha256 ?? canonicalCandidate.stableRecordKeySha256,
  };
  const classification = resolvedRecord.classification || {};
  const stableRecordKey = resolvedRecord.stableRecordKey;

  if (classificationConflict) {
    return waitingBinding(resolvedRecord, 'WAITING_CLASSIFICATION', 'MULTIPLE_CLASSIFICATIONS_FOR_CANONICAL_IDENTITY');
  }
  if (!stableRecordKey || !resolvedRecord.classificationPointer) {
    return waitingBinding(resolvedRecord, 'WAITING_CANONICAL', 'MISSING_STABLE_IDENTITY_OR_CLASSIFICATION_POINTER');
  }

  const canonicalTargets = Array.isArray(classification.canonicalTarget)
    ? classification.canonicalTarget
    : classification.canonicalTarget ? [classification.canonicalTarget] : [];
  const relatedModules = Array.isArray(classification.relatedModules) ? classification.relatedModules : [];
  const canonicalLedgerPointer = {
    artifact: canonicalCandidate.artifact,
    stableRecordKey,
    stableRecordKeySha256: canonicalCandidate.stableRecordKeySha256,
    canonicalRecordId: canonicalCandidate.canonicalRecordId,
    identityDerivation: canonicalCandidate.identityDerivation ?? null,
  };
  const sourceFingerprint = resolvedRecord.sourceFingerprint ?? canonicalCandidate.sourceFingerprint ?? null;
  const edges = [];

  if (classification.reviewRequired === true) {
    const holdTarget = `review::${resolvedRecord.classificationPointer}`;
    pushEdge(edges, stableRecordKey, 'governed_hold', holdTarget, { reason: 'THREAD4_REVIEW_REQUIRED' });
    return {
      stableRecordKey,
      stableRecordKeySha256: resolvedRecord.stableRecordKeySha256,
      sourceFingerprint,
      canonicalLedgerPointer,
      classificationId: resolvedRecord.classificationId ?? null,
      classificationPointer: resolvedRecord.classificationPointer,
      classificationConfidence: classification.confidence ?? null,
      sourceProvenance: resolvedRecord.sourceProvenance ?? null,
      classificationSummary: summarizeClassification(classification),
      routeState: 'REVIEW_REQUIRED',
      graphEdges: edges,
    };
  }

  if (classification.module === 'MULTI_MODULE') {
    if (relatedModules.length === 0) {
      return {
        ...waitingBinding(resolvedRecord, 'WAITING_CLASSIFICATION', 'INVALID_MULTI_MODULE_WITHOUT_RELATED_MODULES'),
        canonicalLedgerPointer,
      };
    }
    for (const moduleName of relatedModules) {
      pushEdge(edges, stableRecordKey, 'module', `module::${moduleName}`);
    }
  } else {
    if (!classification.module || !classification.subsystem || !classification.capability || !classification.feature) {
      return {
        ...waitingBinding(resolvedRecord, 'WAITING_CLASSIFICATION', 'INCOMPLETE_THREAD4_SEMANTIC_HIERARCHY'),
        canonicalLedgerPointer,
      };
    }
    const modulePath = `module::${classification.module}`;
    const moduleRelationship = classification.module === 'Shared Core' ? 'shared_core' : 'module';
    pushEdge(edges, stableRecordKey, moduleRelationship, modulePath);

    const subsystemPath = `${modulePath}::subsystem::${classification.subsystem}`;
    pushEdge(edges, stableRecordKey, 'subsystem', subsystemPath);

    const capabilityPath = `${subsystemPath}::capability::${classification.capability}`;
    pushEdge(edges, stableRecordKey, 'capability', capabilityPath);

    const featurePath = `${capabilityPath}::feature::${classification.feature}`;
    pushEdge(edges, stableRecordKey, 'feature', featurePath);
  }

  for (const moduleName of relatedModules) {
    pushEdge(edges, stableRecordKey, 'related_evidence', `module::${moduleName}`);
  }

  const gitSha = resolvedRecord?.sourceProvenance?.gitSha || null;
  const semanticGroup = gitSha ? (mirrorsByGitSha.get(gitSha) || []) : [];
  const semanticPrimary = semanticGroup.length > 1 ? chooseSemanticPrimary(semanticGroup) : resolvedRecord;
  const isSemanticMirror = semanticPrimary?.stableRecordKey && semanticPrimary.stableRecordKey !== stableRecordKey;

  if (isSemanticMirror) {
    pushEdge(edges, stableRecordKey, 'related_evidence', `record::${semanticPrimary.stableRecordKey}`, {
      semanticMirror: true,
      reason: 'SAME_IMPLEMENTATION_GIT_SHA',
    });
  } else {
    const artifactRelationship = classification.implementationEvidence === true
      ? 'implementation_candidate'
      : 'related_evidence';
    for (const target of canonicalTargets) {
      if (target === 'REVIEW_REQUIRED') continue;
      pushEdge(edges, stableRecordKey, artifactRelationship, `artifact::${target}`);
    }
  }

  return {
    stableRecordKey,
    stableRecordKeySha256: resolvedRecord.stableRecordKeySha256,
    sourceFingerprint,
    canonicalLedgerPointer,
    classificationId: resolvedRecord.classificationId ?? null,
    classificationPointer: resolvedRecord.classificationPointer,
    classificationConfidence: classification.confidence ?? null,
    implementationSemanticKey: gitSha ? `git:${gitSha}` : null,
    semanticMirrorOf: isSemanticMirror ? semanticPrimary.stableRecordKey : null,
    implementationCandidateSuppressed: Boolean(isSemanticMirror),
    sourceProvenance: resolvedRecord.sourceProvenance ?? null,
    classificationSummary: summarizeClassification(classification),
    routeState: 'ROUTED',
    graphEdges: edges,
  };
}

if (!fs.existsSync(contractPath)) throw new Error(`Missing Thread 5 routing contract: ${rel(contractPath)}`);
fs.mkdirSync(routingDir, { recursive: true });

const classificationFiles = fs.readdirSync(shardDir)
  .filter((name) => /^thread-4-semantic-.*\.json$/.test(name))
  .sort();
if (classificationFiles.length === 0) throw new Error('No Thread 4 semantic classification artifacts found.');

const catalog = buildCanonicalCatalog();
const docs = classificationFiles.map((name) => {
  const classificationPath = path.join(shardDir, name);
  const classificationText = readText(classificationPath);
  const classificationDoc = JSON.parse(classificationText);
  const sourceClassification = rel(classificationPath);
  const records = normalizeClassificationDoc(classificationDoc, sourceClassification);
  const resolved = records.map((record) => ({
    record,
    resolution: resolveCanonical(record, classificationDoc, catalog),
  }));
  return { name, classificationPath, classificationText, classificationDoc, sourceClassification, records, resolved };
});

const classificationIdentityMap = new Map();
for (const doc of docs) {
  for (const item of doc.resolved) {
    if (item.resolution.state !== 'BOUND') continue;
    const stableRecordKey = item.resolution.candidate.stableRecordKey;
    const list = classificationIdentityMap.get(stableRecordKey) || [];
    list.push(`${doc.sourceClassification}::${item.record.classificationPointer}`);
    classificationIdentityMap.set(stableRecordKey, list);
  }
}
const classificationConflicts = new Set(
  [...classificationIdentityMap.entries()].filter(([, pointers]) => pointers.length > 1).map(([key]) => key)
);

const eligibleForMirrors = [];
for (const doc of docs) {
  for (const item of doc.resolved) {
    if (item.resolution.state !== 'BOUND') continue;
    const stableRecordKey = item.resolution.candidate.stableRecordKey;
    if (classificationConflicts.has(stableRecordKey)) continue;
    if (item.record?.classification?.reviewRequired === true) continue;
    if (item.record?.classification?.implementationEvidence !== true) continue;
    eligibleForMirrors.push({ ...item.record, stableRecordKey });
  }
}
const mirrorsByGitSha = new Map();
for (const record of eligibleForMirrors) {
  const gitSha = record?.sourceProvenance?.gitSha;
  if (!gitSha) continue;
  const group = mirrorsByGitSha.get(gitSha) || [];
  group.push(record);
  mirrorsByGitSha.set(gitSha, group);
}

const manifestEntries = [];
const globalRouteIds = [];
const globallyRoutedStableKeys = [];

for (const doc of docs) {
  const bindings = doc.resolved.map(({ record, resolution }) => {
    if (resolution.state === 'WAITING_CLASSIFICATION') {
      return waitingBinding(record, 'WAITING_CLASSIFICATION', resolution.reason, resolution.candidates || []);
    }
    if (resolution.state !== 'BOUND') {
      return waitingBinding(record, 'WAITING_CANONICAL', resolution.reason, resolution.candidates || []);
    }
    return buildBinding(
      record,
      resolution.candidate,
      mirrorsByGitSha,
      classificationConflicts.has(resolution.candidate.stableRecordKey)
    );
  });

  const graphEdgeCount = bindings.reduce((sum, binding) => sum + binding.graphEdges.length, 0);
  const routedRecords = bindings.filter((binding) => binding.routeState === 'ROUTED').length;
  const reviewRequired = bindings.filter((binding) => binding.routeState === 'REVIEW_REQUIRED').length;
  const waitingCanonical = bindings.filter((binding) => binding.routeState === 'WAITING_CANONICAL').length;
  const waitingClassification = bindings.filter((binding) => binding.routeState === 'WAITING_CLASSIFICATION').length;
  const canonicalConflicts = bindings.filter((binding) =>
    String(binding.waitingReason || '').includes('AMBIGUOUS')
    || String(binding.waitingReason || '').includes('MULTIPLE_DURABLE')
  ).length;
  const semanticMirrorsSuppressed = bindings.filter((binding) => binding.implementationCandidateSuppressed).length;
  const implementationCandidates = bindings.reduce(
    (sum, binding) => sum + binding.graphEdges.filter((edge) => edge.relationshipType === 'implementation_candidate').length,
    0
  );
  const routeIds = bindings.flatMap((binding) => binding.graphEdges.map((edge) => edge.routeId));
  const routedStableKeys = bindings
    .filter((binding) => binding.routeState === 'ROUTED' || binding.routeState === 'REVIEW_REQUIRED')
    .map((binding) => binding.stableRecordKey)
    .filter(Boolean);
  globalRouteIds.push(...routeIds);
  globallyRoutedStableKeys.push(...routedStableKeys);

  const suffix = doc.name.replace(/^thread-4-semantic-/, '').replace(/\.json$/, '');
  const outputPath = path.join(routingDir, `thread-5-routes-${suffix}.json`);
  const explicitCanonicalArtifact = doc.classificationDoc?.source?.canonicalArtifact
    ?? doc.classificationDoc?.canonicalInput?.path
    ?? null;
  const explicitCanonical = explicitCanonicalArtifact ? catalog.byArtifact.get(explicitCanonicalArtifact) : null;

  const outputDoc = {
    schema: 'pantavion_module_graph_routes_v3',
    protocol: doc.classificationDoc.protocol || 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
    thread: 5,
    scope: 'MODULE_KNOWLEDGE_GRAPH_ROUTING',
    routingContract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
    sourceClassification: doc.sourceClassification,
    sourceClassificationSchema: doc.classificationDoc.schema ?? null,
    sourceRecordTuple: doc.classificationDoc.recordTuple ?? null,
    sourceClassificationSha256: sha256(doc.classificationText),
    explicitSourceCanonicalLedger: explicitCanonicalArtifact,
    explicitSourceCanonicalLedgerSha256: explicitCanonical?.sha256 ?? null,
    explicitSourceCanonicalLedgerGitBlobSha: explicitCanonical?.gitBlobSha ?? null,
    sourceRecordCount: doc.records.length,
    summary: {
      routedRecords,
      reviewRequired,
      waitingCanonical,
      waitingClassification,
      canonicalConflicts,
      graphEdgeCount,
      semanticMirrorsSuppressed,
      implementationCandidates,
      duplicateStableRecordKeysWithinOutput: routedStableKeys.length - new Set(routedStableKeys).size,
      duplicateRouteIdsWithinOutput: routeIds.length - new Set(routeIds).size,
    },
    truthBoundary: 'Only routeState=ROUTED has semantic module/graph edges. REVIEW_REQUIRED has governed_hold only. WAITING_* has zero edges. DEPLOYED is not VERIFIED_LIVE.',
    bindings,
  };

  const outputText = `${JSON.stringify(outputDoc, null, 2)}\n`;
  fs.writeFileSync(outputPath, outputText, 'utf8');
  manifestEntries.push({
    output: rel(outputPath),
    sourceClassification: doc.sourceClassification,
    explicitSourceCanonicalLedger: explicitCanonicalArtifact,
    sha256: sha256(outputText),
    recordCount: doc.records.length,
    routedRecords,
    reviewRequired,
    waitingCanonical,
    waitingClassification,
    canonicalConflicts,
    graphEdgeCount,
    semanticMirrorsSuppressed,
    implementationCandidates,
  });
}

const duplicateGlobalRouteIds = globalRouteIds.length - new Set(globalRouteIds).size;
const duplicateGloballyRoutedStableKeys = globallyRoutedStableKeys.length - new Set(globallyRoutedStableKeys).size;
if (duplicateGlobalRouteIds !== 0) {
  throw new Error(`Thread 5 refuses duplicate routeId materialization: ${duplicateGlobalRouteIds}`);
}
if (duplicateGloballyRoutedStableKeys !== 0) {
  throw new Error(`Thread 5 refuses duplicate canonical identity routing: ${duplicateGloballyRoutedStableKeys}`);
}
for (const entry of manifestEntries) {
  const doc = JSON.parse(readText(path.join(root, entry.output)));
  for (const binding of doc.bindings) {
    if ((binding.routeState === 'WAITING_CANONICAL' || binding.routeState === 'WAITING_CLASSIFICATION')
      && binding.graphEdges.length !== 0) {
      throw new Error(`WAITING state has graph edges: ${entry.output} ${binding.classificationPointer}`);
    }
  }
}

const manifestDoc = {
  schema: 'pantavion_thread5_routing_manifest_v3',
  protocol: 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
  thread: 5,
  materializer: 'scripts/recovery/thread5-route-classifications-v2.mjs',
  contract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
  canonicalIndex: {
    artifactDirectory: 'docs/recovery/live/canonical',
    artifactCount: catalog.byArtifact.size,
    uniqueStableRecordKeys: catalog.global.byStableKey.size,
    ambiguousStableRecordKeys: [...catalog.global.byStableKey.values()].filter((candidates) => candidates.length > 1).length,
    uniqueStableRecordKeyHashes: catalog.global.byStableKeySha256.size,
    ambiguousStableRecordKeyHashes: [...catalog.global.byStableKeySha256.values()].filter((candidates) => candidates.length > 1).length,
  },
  entries: manifestEntries,
  totals: {
    classificationArtifacts: manifestEntries.length,
    sourceRecords: manifestEntries.reduce((sum, entry) => sum + entry.recordCount, 0),
    routedRecords: manifestEntries.reduce((sum, entry) => sum + entry.routedRecords, 0),
    reviewRequired: manifestEntries.reduce((sum, entry) => sum + entry.reviewRequired, 0),
    waitingCanonical: manifestEntries.reduce((sum, entry) => sum + entry.waitingCanonical, 0),
    waitingClassification: manifestEntries.reduce((sum, entry) => sum + entry.waitingClassification, 0),
    canonicalConflicts: manifestEntries.reduce((sum, entry) => sum + entry.canonicalConflicts, 0),
    classificationConflictIdentities: classificationConflicts.size,
    graphEdges: manifestEntries.reduce((sum, entry) => sum + entry.graphEdgeCount, 0),
    semanticMirrorsSuppressed: manifestEntries.reduce((sum, entry) => sum + entry.semanticMirrorsSuppressed, 0),
    implementationCandidates: manifestEntries.reduce((sum, entry) => sum + entry.implementationCandidates, 0),
    duplicateGlobalRouteIds,
    duplicateGloballyRoutedStableKeys,
  },
  rules: {
    noSourceMutation: true,
    noCanonicalMutation: true,
    noPhysicalRecordDuplication: true,
    waitingStatesHaveNoEdges: true,
    reviewRequiredNeverGuessed: true,
    idempotentRouteIds: true,
    declaredCanonicalInputPreferred: true,
    canonicalInputBlobShaVerifiedWhenDeclared: true,
    canonicalInputCountVerifiedWhenDeclared: true,
    hashFirstTupleBindingRequiresExactUniqueCanonicalMatch: true,
    deploymentIdCrossCheckAppliedWhenAvailable: true,
    classificationConflictsNotSilentlyResolved: true,
  },
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifestDoc));
