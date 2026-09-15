import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const shardDir = path.join(root, 'docs/recovery/live/shards');
const routingDir = path.join(root, 'docs/recovery/live/routing');
const contractPath = path.join(routingDir, 'MODULE_GRAPH_ROUTING_CONTRACT_V1.json');
const manifestPath = path.join(routingDir, 'thread-5-routing-manifest.json');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readText = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(readText(file));
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

function chooseSemanticPrimary(group) {
  return [...group].sort((a, b) => {
    const aProduction = a?.sourceProvenance?.deploymentTarget === 'production' ? 1 : 0;
    const bProduction = b?.sourceProvenance?.deploymentTarget === 'production' ? 1 : 0;
    if (aProduction !== bProduction) return bProduction - aProduction;
    return String(a.stableRecordKey).localeCompare(String(b.stableRecordKey));
  })[0];
}

function buildBinding(record, source, mirrorsByGitSha) {
  const classification = record.classification || {};
  const stableRecordKey = record.stableRecordKey;
  if (!stableRecordKey || !record.classificationId || !record.sourceFingerprint) {
    throw new Error(`Thread 5 cannot route classification missing stable identity: ${JSON.stringify(record)}`);
  }

  const edges = [];
  const canonicalTargets = Array.isArray(classification.canonicalTarget)
    ? classification.canonicalTarget
    : classification.canonicalTarget ? [classification.canonicalTarget] : [];
  const relatedModules = Array.isArray(classification.relatedModules) ? classification.relatedModules : [];
  const reviewRequired = classification.reviewRequired === true;

  if (reviewRequired) {
    const holdTarget = `review::${record.classificationId}`;
    pushEdge(edges, stableRecordKey, 'governed_hold', holdTarget, {
      reason: 'THREAD4_REVIEW_REQUIRED',
    });
    return {
      stableRecordKey,
      sourceFingerprint: record.sourceFingerprint,
      classificationId: record.classificationId,
      classificationConfidence: classification.confidence ?? null,
      sourceProvenance: record.sourceProvenance,
      classificationSummary: {
        theme: classification.theme ?? null,
        section: classification.section ?? null,
        contentType: classification.contentType ?? null,
        module: classification.module ?? null,
        subsystem: classification.subsystem ?? null,
        capability: classification.capability ?? null,
        feature: classification.feature ?? null,
        canonicalTarget: canonicalTargets,
      },
      routeState: 'REVIEW_REQUIRED',
      graphEdges: edges,
    };
  }

  if (classification.module === 'MULTI_MODULE') {
    if (relatedModules.length === 0) {
      throw new Error(`MULTI_MODULE classification has no relatedModules: ${stableRecordKey}`);
    }
    for (const moduleName of relatedModules) {
      pushEdge(edges, stableRecordKey, 'module', `module::${moduleName}`);
    }
  } else {
    if (!classification.module || !classification.subsystem || !classification.capability || !classification.feature) {
      throw new Error(`Incomplete semantic hierarchy for ${stableRecordKey}`);
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
  const isSemanticMirror = semanticPrimary.stableRecordKey !== stableRecordKey;

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
      pushEdge(edges, stableRecordKey, artifactRelationship, `artifact::${target}`);
    }
  }

  return {
    stableRecordKey,
    sourceFingerprint: record.sourceFingerprint,
    classificationId: record.classificationId,
    classificationConfidence: classification.confidence ?? null,
    implementationSemanticKey: gitSha ? `git:${gitSha}` : null,
    semanticMirrorOf: isSemanticMirror ? semanticPrimary.stableRecordKey : null,
    implementationCandidateSuppressed: isSemanticMirror,
    sourceProvenance: record.sourceProvenance,
    classificationSummary: {
      theme: classification.theme ?? null,
      section: classification.section ?? null,
      contentType: classification.contentType ?? null,
      module: classification.module ?? null,
      subsystem: classification.subsystem ?? null,
      capability: classification.capability ?? null,
      feature: classification.feature ?? null,
      canonicalTarget: canonicalTargets,
      relatedModules,
      implementationEvidence: classification.implementationEvidence === true,
    },
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

const manifestEntries = [];

for (const name of classificationFiles) {
  const classificationPath = path.join(shardDir, name);
  const classificationText = readText(classificationPath);
  const classificationDoc = JSON.parse(classificationText);
  const canonicalArtifact = classificationDoc?.source?.canonicalArtifact;
  if (!canonicalArtifact) throw new Error(`Missing source.canonicalArtifact in ${rel(classificationPath)}`);

  const canonicalPath = path.join(root, canonicalArtifact);
  if (!fs.existsSync(canonicalPath)) {
    throw new Error(`Thread 5 refuses semantic routing without canonical ledger: ${canonicalArtifact}`);
  }
  const canonicalText = readText(canonicalPath);

  const records = Array.isArray(classificationDoc.records) ? classificationDoc.records : [];
  const mirrorsByGitSha = new Map();
  for (const record of records) {
    const gitSha = record?.sourceProvenance?.gitSha;
    if (!gitSha) continue;
    const group = mirrorsByGitSha.get(gitSha) || [];
    group.push(record);
    mirrorsByGitSha.set(gitSha, group);
  }

  const bindings = records.map((record) => buildBinding(record, classificationDoc.source, mirrorsByGitSha));
  const graphEdgeCount = bindings.reduce((sum, binding) => sum + binding.graphEdges.length, 0);
  const routedRecords = bindings.filter((binding) => binding.routeState === 'ROUTED').length;
  const reviewRequired = bindings.filter((binding) => binding.routeState === 'REVIEW_REQUIRED').length;
  const semanticMirrorsSuppressed = bindings.filter((binding) => binding.implementationCandidateSuppressed).length;
  const implementationCandidates = bindings.reduce(
    (sum, binding) => sum + binding.graphEdges.filter((edge) => edge.relationshipType === 'implementation_candidate').length,
    0
  );

  const suffix = name.replace(/^thread-4-semantic-/, '').replace(/\.json$/, '');
  const outputPath = path.join(routingDir, `thread-5-routes-${suffix}.json`);
  const outputDoc = {
    schema: 'pantavion_module_graph_routes_v1',
    protocol: classificationDoc.protocol || 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
    thread: 5,
    scope: 'MODULE_KNOWLEDGE_GRAPH_ROUTING',
    routingContract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
    sourceClassification: rel(classificationPath),
    sourceClassificationSha256: sha256(classificationText),
    sourceCanonicalLedger: canonicalArtifact,
    sourceCanonicalLedgerSha256: sha256(canonicalText),
    sourceRecordCount: records.length,
    summary: {
      routedRecords,
      reviewRequired,
      graphEdgeCount,
      semanticMirrorsSuppressed,
      implementationCandidates,
      duplicateStableRecordKeys: records.length - new Set(records.map((record) => record.stableRecordKey)).size,
      duplicateRouteIds: graphEdgeCount - new Set(bindings.flatMap((binding) => binding.graphEdges.map((edge) => edge.routeId))).size,
    },
    truthBoundary: 'MODULE_ROUTED means durable graph-binding artifact written. It does not mean implementation deployed or VERIFIED_LIVE.',
    bindings,
  };

  const outputText = `${JSON.stringify(outputDoc, null, 2)}\n`;
  fs.writeFileSync(outputPath, outputText, 'utf8');
  manifestEntries.push({
    output: rel(outputPath),
    sourceClassification: rel(classificationPath),
    sourceCanonicalLedger: canonicalArtifact,
    sha256: sha256(outputText),
    recordCount: records.length,
    routedRecords,
    reviewRequired,
    graphEdgeCount,
    semanticMirrorsSuppressed,
    implementationCandidates,
  });
}

const manifestDoc = {
  schema: 'pantavion_thread5_routing_manifest_v1',
  protocol: 'PANTAVION_10_THREAD_PARALLEL_ABSORPTION_2026-09-15',
  thread: 5,
  contract: 'docs/recovery/live/routing/MODULE_GRAPH_ROUTING_CONTRACT_V1.json',
  entries: manifestEntries,
  totals: {
    classificationArtifacts: manifestEntries.length,
    sourceRecords: manifestEntries.reduce((sum, entry) => sum + entry.recordCount, 0),
    routedRecords: manifestEntries.reduce((sum, entry) => sum + entry.routedRecords, 0),
    reviewRequired: manifestEntries.reduce((sum, entry) => sum + entry.reviewRequired, 0),
    graphEdges: manifestEntries.reduce((sum, entry) => sum + entry.graphEdgeCount, 0),
    semanticMirrorsSuppressed: manifestEntries.reduce((sum, entry) => sum + entry.semanticMirrorsSuppressed, 0),
    implementationCandidates: manifestEntries.reduce((sum, entry) => sum + entry.implementationCandidates, 0),
  },
  rules: {
    noSourceMutation: true,
    noCanonicalMutation: true,
    noPhysicalRecordDuplication: true,
    reviewRequiredNeverGuessed: true,
    idempotentRouteIds: true,
  },
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifestDoc));
