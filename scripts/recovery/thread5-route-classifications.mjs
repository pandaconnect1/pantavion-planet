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

function collectStableRecords(value, artifact, out, seen) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.stableRecordKey === 'string') {
    const dedupKey = `${artifact}\0${value.stableRecordKey}`;
    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      const list = out.get(value.stableRecordKey) || [];
      list.push({
        artifact,
        stableRecordKey: value.stableRecordKey,
        sourceFingerprint: value.sourceFingerprint ?? null,
        canonicalRecordId: value.canonicalRecordId ?? value.recordId ?? value.id ?? null,
      });
      out.set(value.stableRecordKey, list);
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStableRecords(item, artifact, out, seen);
    return;
  }
  for (const child of Object.values(value)) collectStableRecords(child, artifact, out, seen);
}

function buildCanonicalIndex() {
  const out = new Map();
  const seen = new Set();
  if (!fs.existsSync(canonicalDir)) return out;
  for (const name of fs.readdirSync(canonicalDir).filter((n) => n.endsWith('.json')).sort()) {
    const file = path.join(canonicalDir, name);
    let doc;
    try {
      doc = JSON.parse(readText(file));
    } catch {
      continue;
    }
    collectStableRecords(doc, rel(file), out, seen);
  }
  return out;
}

function normalizeClassificationDoc(classificationDoc, sourceClassification) {
  const records = Array.isArray(classificationDoc.records) ? classificationDoc.records : [];
  if (records.length === 0) return [];

  if (records.every((record) => Array.isArray(record))) {
    const projectId = classificationDoc?.source?.projectId ?? null;
    const profiles = classificationDoc?.profiles || {};
    return records.map((tuple, index) => {
      const [deploymentId, gitSha, profileName, confidence, reviewRequired, implementationEvidence] = tuple;
      const profile = profiles[profileName] || {};
      const stableRecordKey = projectId && deploymentId ? `${projectId}:${deploymentId}` : null;
      return {
        stableRecordKey,
        sourceFingerprint: null,
        classificationId: null,
        classificationPointer: `${sourceClassification}#records[${index}]`,
        sourceProvenance: {
          projectId,
          deploymentId: deploymentId ?? null,
          gitSha: gitSha ?? null,
          sourcePath: classificationDoc?.source?.path ?? null,
          sourceBlobSha: classificationDoc?.source?.blobSha ?? null,
          liveTruth: classificationDoc?.source?.liveTruth ?? null,
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
          confidence: confidence ?? null,
          reviewRequired: reviewRequired === true,
          implementationEvidence: implementationEvidence === true,
        },
      };
    });
  }

  return records.map((record, index) => ({
    ...record,
    classificationPointer: record.classificationId
      ? `${sourceClassification}#classificationId=${record.classificationId}`
      : `${sourceClassification}#records[${index}]`,
  }));
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

function waitingBinding(record, reason, canonicalCandidates = []) {
  return {
    stableRecordKey: record.stableRecordKey ?? null,
    sourceFingerprint: record.sourceFingerprint ?? null,
    canonicalLedgerPointer: null,
    classificationId: record.classificationId ?? null,
    classificationPointer: record.classificationPointer ?? null,
    classificationConfidence: record?.classification?.confidence ?? null,
    sourceProvenance: record.sourceProvenance ?? null,
    classificationSummary: summarizeClassification(record.classification || {}),
    routeState: 'WAITING_CANONICAL',
    waitingReason: reason,
    canonicalCandidates: canonicalCandidates.map((candidate) => ({
      artifact: candidate.artifact,
      canonicalRecordId: candidate.canonicalRecordId,
      sourceFingerprint: candidate.sourceFingerprint,
    })),
    graphEdges: [],
  };
}

function buildBinding(record, canonicalCandidate, mirrorsByGitSha) {
  const classification = record.classification || {};
  const stableRecordKey = record.stableRecordKey;
  if (!stableRecordKey || !record.classificationPointer) {
    return waitingBinding(record, 'MISSING_STABLE_IDENTITY_OR_CLASSIFICATION_POINTER');
  }

  const canonicalTargets = Array.isArray(classification.canonicalTarget)
    ? classification.canonicalTarget
    : classification.canonicalTarget ? [classification.canonicalTarget] : [];
  const relatedModules = Array.isArray(classification.relatedModules) ? classification.relatedModules : [];
  const canonicalLedgerPointer = {
    artifact: canonicalCandidate.artifact,
    stableRecordKey,
    canonicalRecordId: canonicalCandidate.canonicalRecordId,
  };
  const sourceFingerprint = record.sourceFingerprint ?? canonicalCandidate.sourceFingerprint ?? null;
  const edges = [];

  if (classification.reviewRequired === true) {
    const holdTarget = `review::${record.classificationPointer}`;
    pushEdge(edges, stableRecordKey, 'governed_hold', holdTarget, {
      reason: 'THREAD4_REVIEW_REQUIRED',
    });
    return {
      stableRecordKey,
      sourceFingerprint,
      canonicalLedgerPointer,
      classificationId: record.classificationId ?? null,
      classificationPointer: record.classificationPointer,
      classificationConfidence: classification.confidence ?? null,
      sourceProvenance: record.sourceProvenance ?? null,
      classificationSummary: summarizeClassification(classification),
      routeState: 'REVIEW_REQUIRED',
      graphEdges: edges,
    };
  }

  if (classification.module === 'MULTI_MODULE') {
    if (relatedModules.length === 0) {
      return {
        ...waitingBinding(record, 'INVALID_MULTI_MODULE_WITHOUT_RELATED_MODULES'),
        canonicalLedgerPointer,
        routeState: 'WAITING_CLASSIFICATION',
      };
    }
    for (const moduleName of relatedModules) {
      pushEdge(edges, stableRecordKey, 'module', `module::${moduleName}`);
    }
  } else {
    if (!classification.module || !classification.subsystem || !classification.capability || !classification.feature) {
      return {
        ...waitingBinding(record, 'INCOMPLETE_THREAD4_SEMANTIC_HIERARCHY'),
        canonicalLedgerPointer,
        routeState: 'WAITING_CLASSIFICATION',
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

  const gitSha = record?.sourceProvenance?.gitSha || null;
  const semanticGroup = gitSha ? (mirrorsByGitSha.get(gitSha) || []) : [];
  const semanticPrimary = semanticGroup.length > 1 ? chooseSemanticPrimary(semanticGroup) : record;
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
    sourceFingerprint,
    canonicalLedgerPointer,
    classificationId: record.classificationId ?? null,
    classificationPointer: record.classificationPointer,
    classificationConfidence: classification.confidence ?? null,
    implementationSemanticKey: gitSha ? `git:${gitSha}` : null,
    semanticMirrorOf: isSemanticMirror ? semanticPrimary.stableRecordKey : null,
    implementationCandidateSuppressed: Boolean(isSemanticMirror),
    sourceProvenance: record.sourceProvenance ?? null,
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

if (classificationFiles.length === 0) {
  throw new Error('No Thread 4 semantic classification artifacts found.');
}

const canonicalIndex = buildCanonicalIndex();
const docs = classificationFiles.map((name) => {
  const classificationPath = path.join(shardDir, name);
  const classificationText = readText(classificationPath);
  const classificationDoc = JSON.parse(classificationText);
  const sourceClassification = rel(classificationPath);
  return {
    name,
    classificationPath,
    classificationText,
    classificationDoc,
    sourceClassification,
    records: normalizeClassificationDoc(classificationDoc, sourceClassification),
  };
});

const eligibleForMirrors = [];
for (const doc of docs) {
  for (const record of doc.records) {
    const candidates = record.stableRecordKey ? (canonicalIndex.get(record.stableRecordKey) || []) : [];
    if (candidates.length === 1) eligibleForMirrors.push(record);
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

for (const doc of docs) {
  const bindings = doc.records.map((record) => {
    if (!record.stableRecordKey) {
      return waitingBinding(record, 'MISSING_STABLE_RECORD_KEY');
    }
    const candidates = canonicalIndex.get(record.stableRecordKey) || [];
    if (candidates.length === 0) {
      return waitingBinding(record, 'NO_DURABLE_CANONICAL_LEDGER_MATCH');
    }
    if (candidates.length > 1) {
      return waitingBinding(record, 'MULTIPLE_DURABLE_CANONICAL_LEDGER_MATCHES', candidates);
    }
    return buildBinding(record, candidates[0], mirrorsByGitSha);
  });

  const graphEdgeCount = bindings.reduce((sum, binding) => sum + binding.graphEdges.length, 0);
  const routedRecords = bindings.filter((binding) => binding.routeState === 'ROUTED').length;
  const reviewRequired = bindings.filter((binding) => binding.routeState === 'REVIEW_REQUIRED').length;
  const waitingCanonical = bindings.filter((binding) => binding.routeState === 'WAITING_CANONICAL').length;
  const waitingClassification = bindings.filter((binding) => binding.routeState === 'WAITING_CLASSIFICATION').length;
  const canonicalConflicts = bindings.filter(
    (binding) => binding.waitingReason === 'MULTIPLE_DURABLE_CANONICAL_LEDGER_MATCHES'
  ).length;
  const semanticMirrorsSuppressed = bindings.filter((binding) => binding.implementationCandidateSuppressed).length;
  const implementationCandidates = bindings.reduce(
    (sum, binding) => sum + binding.graphEdges.filter((edge) => edge.relationshipType === 'implementation_candidate').length,
    0
  );
  const stableKeys = doc.records.map((record) => record.stableRecordKey).filter(Boolean);
  const routeIds = bindings.flatMap((binding) => binding.graphEdges.map((edge) => edge.routeId));

  const suffix = doc.name.replace(/^thread-4-semantic-/, '').replace(/\.json$/, '');
  const outputPath = path.join(routingDir, `thread-5-routes-${suffix}.json`);
  const explicitCanonicalArtifact = doc.classificationDoc?.source?.canonicalArtifact ?? null;
  const explicitCanonicalPath = explicitCanonicalArtifact ? path.join(root, explicitCanonicalArtifact) : null;
  const explicitCanonicalSha256 = explicitCanonicalPath && fs.existsSync(explicitCanonicalPath)
    ? sha256(readText(explicitCanonicalPath))
    : null;

  const outputDoc = {
    schema: 'pantavion_module_graph_routes_v2',
    protocol: doc.classificationDoc.protocol || 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
    thread: 5,
    scope: 'MODULE_KNOWLEDGE_GRAPH_ROUTING',
    routingContract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
    sourceClassification: doc.sourceClassification,
    sourceClassificationSchema: doc.classificationDoc.schema ?? null,
    sourceClassificationSha256: sha256(doc.classificationText),
    explicitSourceCanonicalLedger: explicitCanonicalArtifact,
    explicitSourceCanonicalLedgerSha256: explicitCanonicalSha256,
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
      duplicateStableRecordKeys: stableKeys.length - new Set(stableKeys).size,
      duplicateRouteIds: routeIds.length - new Set(routeIds).size,
    },
    truthBoundary: 'Only routeState=ROUTED has durable module/graph edges. WAITING_* and REVIEW_REQUIRED are not completion; DEPLOYED is not VERIFIED_LIVE.',
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

const manifestDoc = {
  schema: 'pantavion_thread5_routing_manifest_v2',
  protocol: 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
  thread: 5,
  contract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
  canonicalIndex: {
    artifactDirectory: 'docs/recovery/live/canonical',
    uniqueStableRecordKeys: canonicalIndex.size,
    ambiguousStableRecordKeys: [...canonicalIndex.values()].filter((candidates) => candidates.length > 1).length,
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
    graphEdges: manifestEntries.reduce((sum, entry) => sum + entry.graphEdgeCount, 0),
    semanticMirrorsSuppressed: manifestEntries.reduce((sum, entry) => sum + entry.semanticMirrorsSuppressed, 0),
    implementationCandidates: manifestEntries.reduce((sum, entry) => sum + entry.implementationCandidates, 0),
  },
  rules: {
    noSourceMutation: true,
    noCanonicalMutation: true,
    noPhysicalRecordDuplication: true,
    waitingCanonicalHasNoEdges: true,
    reviewRequiredNeverGuessed: true,
    idempotentRouteIds: true,
    canonicalBindingMatchedByStableRecordKey: true,
  },
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifestDoc));
