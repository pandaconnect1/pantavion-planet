const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const generatedInputPath = path.join(root, 'data/recovery/canonical-knowledge-v2/full-corpus.json');
const committedCorpusRoot = path.join(root, 'data/recovery/imported-pr248/canonical-ledger/corpus');
const outRoot = path.join(root, 'data/recovery/canonical-semantic-v3');
const productionTruthPath = path.join(root, 'data/recovery/production-truth/supabase-repository-evidence-20260826.json');

const ontology = {
  'Personal AI / PantaAI': { memory: ['memory','remember','context','personal context','preference','goal'], orchestration: ['agent','router','tool call','workflow','planner','assistant'], personalization: ['personalized','adaptive','communication style','accessibility'] },
  People: { profile: ['profile','bio','avatar','identity'], discovery: ['discover','nearby','search people','contact match'], relationships: ['relationship','friend','follow','connection','block'] },
  Chat: { messaging: ['message','send','inbox','delivery','read receipt'], conversations: ['conversation','thread','participant'], realtime: ['realtime','presence','typing','subscription'], privacy: ['secret chat','encryption','recipient privacy'] },
  'Interpreter / Translation': { translation: ['translate','translation','translator','language pair'], speech: ['stt','tts','speech-to-text','text-to-speech'], interpretation: ['interpreter','two-device','subtitle','dialect'] },
  'Voice / Video': { calling: ['call','webrtc','voice call','video call'], media: ['microphone','camera','audio stream','video stream'] },
  'Social / Pulse / Communities': { publishing: ['post','publish','feed','timeline'], engagement: ['comment','reaction','like','share'], communities: ['community','group','membership'], pulse: ['pulse','news','trend'] },
  'Safety / Trust / Minors': { policy: ['policy','gate','access control','route guard','deployment readiness'], moderation: ['moderation','report','abuse','review queue'], minors: ['minor','child','teen','guardian','age band'], trust: ['trust','verification','risk','suspicious'], blocking: ['block','blocked','isolation'] },
  'SOS / Crisis': { emergency: ['sos','emergency','panic'], incident: ['incident','crisis','humanitarian'], response: ['responder','trusted contact','dispatch'] },
  'Maps / World / Water': { mapping: ['map','gis','geospatial','gps','location'], water: ['water','utility','pipe','network','dwg'], city: ['city intelligence','infrastructure'] },
  'Marketplace / Work / Business': { marketplace: ['marketplace','listing','seller','buyer'], work: ['job','work','career','employment'], business: ['business','commerce','income'], advertising: ['ads center','campaign','advertising'] },
  'Learning / Knowledge': { learning: ['learning','lesson','mastery','curriculum','pantalearn'], knowledge: ['knowledge','research','library'], assessment: ['quiz','assessment','scan-to-learn'] },
  'Music / Media / Creation': { music: ['music','song','lyrics'], creation: ['creator','generation','studio'], media: ['image','audio','video','media'] },
  'Kernel / Guardian / Runtime': { orchestration: ['kernel','orchestration','router','control plane'], guardian: ['guardian','supervisor','policy gate'], execution: ['durable execution','checkpoint','worker','runtime'], providers: ['provider routing','capability registry'] },
  'Identity / Auth / Consent': { authentication: ['auth','authentication','login','passkey','aal2','mfa'], authorization: ['permission','role','entitlement','access gate'], consent: ['consent','privacy choice'], identity: ['identity','registration','account'] },
  'Resilience / Offline / Infrastructure': { offline: ['offline','sms','mms','mesh'], continuity: ['failover','continuity','redundancy','resilience'], infrastructure: ['infrastructure','satellite','deployment'] },
  'Recovery / Provenance': { recovery: ['recovery','restore','excavation','donor','triage','canonicalization'], evidence: ['evidence','audit','receipt','fingerprint','lineage'], 'cross-module': ['cross-module','human communication core','social people chat'] },
  'Experience / Navigation': { shell: ['application shell','homepage','navigation','entry page'] }
};

const capabilities = {
  create: ['create','insert','register','publish','send','enqueue','start'], read: ['read','list','fetch','search','discover','view','select'], update: ['update','edit','change','accept','approve','reject','decide'], delete: ['delete','remove','revoke','leave'], synchronize: ['sync','import','export','hydrate'], protect: ['secure','privacy','rls','policy','guard','block','moderation'], translate: ['translate','translation','interpreter'], execute: ['execute','worker','runtime','job','workflow','agent'], observe: ['audit','monitor','report','metrics','log','evidence'], recover: ['recovery','recover','restore','excavation','donor','triage','canonicalization','handoff','consolidation','lineage','snapshot'], configure: ['configure','configuration','registry','provider'], adapt: ['personalized','adaptive','adaptation'], operate: ['operate','operation','infrastructure'], present: ['homepage','application shell','navigation','entry page']
};

const sourcePathAnchors = [
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', patterns:[/^data\/runtime-reports\//] },
  { module:'Maps / World / Water', subsystem:'water', capability:'operate', patterns:[/(^|\/)app\/(api\/)?professional\/infrastructure\/water(\/|$)/,/(^|\/)core\/(infrastructure\/)?water(\/|$)/,/(^|\/)docs\/requirements\/pantavion-(professional-infrastructure-)?water[^/]*\.md$/,/(^|\/)scripts\/[^/]*water[^/]*\.(cjs|mjs|ts|js)$/,/^scripts\/upload-final-master-dwg-to-blob\.cjs$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'translate', patterns:[/(^|\/)app\/translate(\/|$)/,/(^|\/)app\/api\/pantavion\/(translate|speech-normalize)(\/|$)/,/(^|\/)core\/translation(\/|$)/,/(^|\/)services\/translation(\/|[-.])/,/(^|\/)scripts\/[^/]*translation[^/]*\.(cjs|mjs|ts|js)$/] },
  { module:'SOS / Crisis', subsystem:'emergency', capability:'execute', patterns:[/(^|\/)app\/(pantavion\/)?(sos|emergency|crisis)(\/|$)/,/(^|\/)core\/(sos|emergency|crisis)(\/|$)/] },
  { module:'Safety / Trust / Minors', subsystem:'moderation', patterns:[/(^|\/)app\/admin\/moderation(\/|$)/,/(^|\/)core\/(safety|moderation|trust|minors)(\/|$)/,/(^|\/)scripts\/[^/]*(safety|moderation)[^/]*$/] },
  { module:'Identity / Auth / Consent', subsystem:'authentication', patterns:[/(^|\/)app\/(auth|login|register)(\/|$)/,/(^|\/)core\/(auth|identity|consent)(\/|$)/,/(^|\/)lib\/[^/]*(auth|identity)[^/]*$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', patterns:[/(^|\/)app\/kernel(\/|$)/,/(^|\/)core\/(kernel|runtime|guardian)(\/|$)/,/(^|\/)core\/[^/]*kernel[^/]*$/,/(^|\/)scripts\/(?![^/]*(?:water|translation))[^/]*(kernel|guardian|runtime)[^/]*$/] },
  { module:'Personal AI / PantaAI', subsystem:'memory', patterns:[/(^|\/)core\/memory(\/|$)/,/(^|\/)app\/(panta-ai|personal-ai)(\/|$)/,/(^|\/)core\/(panta-ai|personal-ai)(\/|$)/] },
  { module:'People', subsystem:'profile', patterns:[/(^|\/)app\/(people|profile|contacts)(\/|$)/,/(^|\/)core\/(people|profile|contacts)(\/|$)/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', patterns:[/(^|\/)app\/(social|pulse|communities)(\/|$)/,/(^|\/)core\/(social|pulse|communities)(\/|$)/] },
  { module:'Chat', subsystem:'messaging', patterns:[/(^|\/)app\/(chat|messages|messaging)(\/|$)/,/(^|\/)core\/(chat|messages|messaging)(\/|$)/] },
  { module:'Learning / Knowledge', subsystem:'learning', patterns:[/(^|\/)app\/(learning|pantalearn)(\/|$)/,/(^|\/)core\/(learning|knowledge)(\/|$)/] },
  { module:'Marketplace / Work / Business', subsystem:'marketplace', patterns:[/(^|\/)app\/(marketplace|business|work)(\/|$)/,/(^|\/)core\/(marketplace|business|work)(\/|$)/] },
  { module:'Music / Media / Creation', subsystem:'media', patterns:[/(^|\/)app\/(music|media|creation)(\/|$)/,/(^|\/)core\/(music|media|creation)(\/|$)/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'continuity', patterns:[/(^|\/)app\/(offline|resilience)(\/|$)/,/(^|\/)core\/(offline|resilience)(\/|$)/] },
  { module:'Voice / Video', subsystem:'calling', patterns:[/(^|\/)app\/(voice|video|calls)(\/|$)/,/(^|\/)core\/(voice|video|calls)(\/|$)/] },
  { module:'Recovery / Provenance', subsystem:'recovery', capability:'recover', patterns:[/^(core|data)\/recovery\//,/^docs\/recovery\/(live_completion_map|pantavion_master_recovery_continuation_brief|donor_|ai_screenshot_inflow)[^/]*\.md$/,/^pantavion[^/]*recovery[^/]*\.(md|json)$/,/^pantavion_live_completion_map[^/]*\.md$/,/^scripts\/[^/]*(recovery|excavat|corpus|snapshot|donor|triage|canonical-routing)[^/]*\.(cjs|mjs|ts|js)$/,/^\.github\/workflows\/[^/]*(recovery|excavat|corpus|snapshot)[^/]*\.ya?ml$/,/^docs\/funding\/pantavion_innovation_evidence_pack[^/]*\.md$/] },
  { module:'Recovery / Provenance', subsystem:'cross-module', capability:'recover', patterns:[/^docs\/recovery\/(human_communication_core_(migration_notes|schema)|social-people-chat-full-excavation-\d+)\.md$/] },
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', patterns:[/^docs\/implementation\/full_ecosystem_live_wave_1\.md$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'execute', patterns:[/^core\/(protocol|intake)\//,/^docs\/kernel-canonicalization\//,/^app\/product-status\//] },
  { module:'Kernel / Guardian / Runtime', subsystem:'providers', capability:'configure', patterns:[/^core\/registry\//,/^core\/intelligence\/(ai-provider-registry|prime-ai-orchestrator)\.ts$/,/^app\/pantavion\/intelligence\/cloud\/page\.tsx$/,/^scripts\/install-pantavion-intelligence-fabric\.cjs$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'execute', patterns:[/^docs\/production\//,/^\.github\/workflows\/pantavion-deploy\.ya?ml$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'guardian', capability:'protect', patterns:[/^scripts\/pantavion-(ai-integrity-check|deep-branch-analysis|foundation-audit|vscode-real-implementation-gate|implementation-gate|intelligence-fabric-gate|master-audit|multimodal-language-audit|product-truth-audit|project-intake-(work-orders|inventory|safe-summary)|public-growth-audit|unfinished-plan-ingestion-gate|vision-registry-gate|autonomous-builder-gate)\.cjs$/,/^core\/inspector\/kernel-visibility-inspector\.ts$/] },
  { module:'Safety / Trust / Minors', subsystem:'trust', capability:'protect', patterns:[/^core\/(governance|security)\//,/^core\/pantavion-constitution\.ts$/] },
  { module:'Marketplace / Work / Business', subsystem:'business', capability:'configure', patterns:[/^core\/commercial\//,/^app\/api\/billing\//] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'continuity', capability:'protect', patterns:[/^core\/continuity\//,/^docs\/(continuity\/|pantavion_live_continuity_foundation\.md$)/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'execute', strict:true, patterns:[/^core\/intelligence\/(panta-ai|pantavion-intelligence)[^/]*\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'personalization', capability:'adapt', patterns:[/^core\/personalization\//,/^(app\/universal-life\/page\.tsx|core\/product\/pantavion-universal-life-capabilities\.ts)$/,/^docs\/recovery\/personalized_section_allocation_\d+\.md$/] },
  { module:'Chat', subsystem:'messaging', capability:'synchronize', patterns:[/^docs\/architecture\/pantavion_unified_messaging_interop\.md$/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', capability:'create', patterns:[/^docs\/recovery\/social_global_\d+_\d+\.md$/] },
  { module:'Music / Media / Creation', subsystem:'creation', capability:'create', patterns:[/^docs\/requirements\/pantavion_music_voice_studio\.md$/] },
  { module:'Experience / Navigation', subsystem:'shell', capability:'present', patterns:[/^app\/page\.tsx$/] },
  { module:'Interpreter / Translation', subsystem:'speech', capability:'translate', strict:true, patterns:[/^app\/api\/pantavion\/speech-to-text\/route\.ts$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'configure', strict:true, patterns:[/^core\/(i18n\/pantavion-global-language|language\/pantavion-language-(atlas|catalog)|i18n\/languages)\.ts$/,/^app\/pantavion-global-language-selector\.tsx$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'execute', patterns:[/^app\/api\/intelligence\/actions\/route\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'personalization', capability:'present', strict:true, patterns:[/^core\/public-surface\/panta-ai-(public-surface-spec|visible-surface)\.ts$/] },
  { module:'Safety / Trust / Minors', subsystem:'policy', capability:'protect', strict:true, patterns:[/^core\/app\/(deploy-readiness-gate|vercel-public-deploy-gate|app-route-guard)\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'synchronize', strict:true, patterns:[/^core\/storage\/kernel-(report|admission|artifact|state)-store\.ts$/,/^core\/storage\/kernel-persistence-orchestrator\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^app\/api\/kernel\/(audit-memory|heartbeat|state)(\/route)?\.ts$/,/^app\/api\/kernel\/(founder-session|route)\.ts$/] },
  { module:'Identity / Auth / Consent', subsystem:'authentication', capability:'protect', strict:true, patterns:[/^(core\/app\/app-auth-role-session-integration-wave|scripts\/(export|run)-app-auth-role-session-integration-wave)\.ts$/] },
  { module:'People', subsystem:'profile', capability:'read', strict:true, patterns:[/^app\/(profile\/page|contacts\/contacts-client)\.tsx$/] },
  { module:'Interpreter / Translation', subsystem:'interpretation', capability:'observe', strict:true, patterns:[/^app\/api\/pantavion\/interpreter\/health\/route\.ts$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'translate', strict:true, patterns:[/^app\/api\/pantavion\/detect-language\/route\.ts$/,/^app\/api\/translate\/universal\/route\.ts$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'configure', strict:true, patterns:[/^app\/api\/pantavion\/language\/route\.ts$/,/^app\/language\/(languageclient|page)\.tsx$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'read', strict:true, patterns:[/^app\/intelligence\/(page|routing\/page|capabilities\/page)\.tsx$/,/^app\/pantavion\/intelligence\/page\.tsx$/] },
  { module:'Identity / Auth / Consent', subsystem:'authorization', capability:'protect', strict:true, patterns:[/^core\/app\/public-surface-access-gate\.ts$/,/^scripts\/(export|run)-founder-human-final-authority-wave\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/intelligence\/(ai-capability-authority|global-capability-intake-registry)\.ts$/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', capability:'observe', strict:true, patterns:[/^app\/api\/social\/health\/route\.ts$/] },
  { module:'SOS / Crisis', subsystem:'response', capability:'execute', strict:true, patterns:[/^app\/api\/(sos\/dispatch|emergency\/partner-interest)\/route\.ts$/] },
  { module:'Safety / Trust / Minors', subsystem:'moderation', capability:'protect', strict:true, patterns:[/^app\/api\/admin\/moderation\/listings\/route\.ts$/] },
  { module:'Music / Media / Creation', subsystem:'media', capability:'read', strict:true, patterns:[/^app\/my-media\/my-media-client\.tsx$/,/^app\/api\/media\/feed\/route\.ts$/] },
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', strict:true, patterns:[/^scripts\/pantavion-source-inventory\.cjs$/,/^app\/api\/pantavion\/source-inventory\/route\.ts$/] },
  { module:'Chat', subsystem:'conversations', capability:'synchronize', strict:true, patterns:[/^app\/api\/messages\/conversations(?:\/\[conversationid\])?\/route\.ts$/] },
  { module:'Chat', subsystem:'messaging', capability:'create', strict:true, patterns:[/^app\/api\/messages\/send\/route\.ts$/] },
  { module:'People', subsystem:'relationships', capability:'protect', strict:true, patterns:[/^app\/api\/people\/blocks\/route\.ts$/] },
  { module:'People', subsystem:'relationships', capability:'read', strict:true, patterns:[/^app\/api\/people\/(relationships|find-from-contacts)\/route\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/kernel\/(kernel-printable-foundation-pack|kernel-product-dna)\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'execute', strict:true, patterns:[/^core\/kernel\/(kernel-terminal-runner|kernel-research-assimilation)\.ts$/,/^core\/pantavion-kernel-executor\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'memory', capability:'synchronize', strict:true, patterns:[/^core\/memory\/(reminder-scheduler|semantic-memory-store)\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'execute', strict:true, patterns:[/^scripts\/pantavion-project-intake-autonomous-dispatch\.cjs$/] },
  { module:'Personal AI / PantaAI', subsystem:'memory', capability:'synchronize', strict:true, patterns:[/^scripts\/export-cognitive-memory-stratification-wave\.ts$/,/^core\/pantavion-memory\.ts$/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'continuity', capability:'synchronize', strict:true, patterns:[/^scripts\/export-cross-device-continuity-wave\.ts$/] },
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', strict:true, patterns:[/^scripts\/export-project-recovery-audit-wave\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'guardian', capability:'protect', strict:true, patterns:[/^core\/protocol\/direct-dispatch-promotion-policy\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/kernel-types\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'present', strict:true, patterns:[/^app\/(evolution|sovereignty)\/page\.tsx$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'present', strict:true, patterns:[/^app\/panta-ai\/page\.tsx$/] },
  { module:'Maps / World / Water', subsystem:'mapping', capability:'read', strict:true, patterns:[/^app\/shared\/location\/uselocationengine\.ts$/] },
  { module:'Social / Pulse / Communities', subsystem:'communities', capability:'read', strict:true, patterns:[/^app\/social\/communities\/page\.tsx$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^(scripts\/export-ai-authority-registry-wave|core\/intelligence\/ai-authority-registry-wave)\.ts$/,/^core\/intelligence\/ai-governance-profile\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'providers', capability:'configure', strict:true, patterns:[/^core\/app\/product-surface-registry\.ts$/] },
  { module:'Identity / Auth / Consent', subsystem:'authentication', capability:'configure', strict:true, patterns:[/^core\/app\/app-session-registry\.ts$/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'infrastructure', capability:'configure', strict:true, patterns:[/^core\/app\/deployment-environment-registry\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'providers', capability:'protect', strict:true, patterns:[/^core\/pantavion\/provider-sovereignty-ledger\.ts$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'configure', strict:true, patterns:[/^core\/intelligence\/ai-locale-authority\.ts$/,/^core\/i18n\/pantavion-multimodal-language-contract\.ts$/,/^scripts\/fix-global-language-pr\.cjs$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'translate', strict:true, patterns:[/^core\/language\/pantavion-global-language-runtime\.ts$/] },
  { module:'Maps / World / Water', subsystem:'water', capability:'protect', strict:true, patterns:[/^docs\/requirements\/pantavion-water-network-kernel-lock-v1\.md$/] },
  { module:'Maps / World / Water', subsystem:'water', capability:'synchronize', strict:true, patterns:[/^docs\/requirements\/pantavion-water-production-cloud-bridge\.md$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'synchronize', strict:true, patterns:[/^app\/api\/kernel\/continuity-memory\/route\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^app\/api\/kernel\/founder-session\/route\.ts$/,/^core\/kernel\/kernel-artifact-summary\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'observe', strict:true, patterns:[/^app\/api\/pantavion\/(intelligence\/ecosystem-radar|runtime\/heartbeat)\/route\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'configure', strict:true, patterns:[/^core\/app\/secret-runtime-binding-registry\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'observe', strict:true, patterns:[/^core\/app\/secrets-deploy-observability-integration-wave\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'create', strict:true, patterns:[/^scripts\/pantavion-project-intake-autonomous-draft-workspace\.cjs$/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', capability:'read', strict:true, patterns:[/^app\/social\/(global|notifications)\/page\.tsx$/] },
  { module:'Music / Media / Creation', subsystem:'media', capability:'present', strict:true, patterns:[/^app\/twitter-image\.tsx$/] },
  { module:'Experience / Navigation', subsystem:'shell', capability:'present', strict:true, patterns:[/^app\/layout\.tsx$/,/^core\/public-surface\/human-first-homepage-(spec|wave)\.ts$/] },
  { module:'Learning / Knowledge', subsystem:'knowledge', capability:'configure', strict:true, patterns:[/^docs\/architecture\/pantavion_academic_evidence_standard\.md$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^core\/kernel\/kernel-usage-harness\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/kernel\/autonomous-build\/autonomous-kernel-types\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'synchronize', strict:true, patterns:[/^core\/kernel\/kernel-continuity-memory\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'memory', capability:'synchronize', strict:true, patterns:[/^core\/memory\/pantavion-founder-vision-memory\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'execute', strict:true, patterns:[/^app\/api\/pantavion\/intelligence\/cron\/route\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^app\/api\/pantavion\/intelligence\/ledger\/route\.ts$/] },
  { module:'Interpreter / Translation', subsystem:'translation', capability:'observe', strict:true, patterns:[/^scripts\/pantavion-translation-runtime-gate\.cjs$/,/^\.github\/workflows\/pantavion-production-sync-verify\.ya?ml$/] },
  { module:'Safety / Trust / Minors', subsystem:'moderation', capability:'observe', strict:true, patterns:[/^core\/admin\/admin-alerts\.ts$/] },
  { module:'Identity / Auth / Consent', subsystem:'authentication', capability:'protect', strict:true, patterns:[/^app\/owner\/safety\/verify\/verify-client\.tsx$/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'continuity', capability:'observe', strict:true, patterns:[/^core\/connectivity\/connectivity-state-contract\.ts$/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', capability:'update', strict:true, patterns:[/^app\/api\/social\/media-url\/route\.ts$/] },
  { module:'Safety / Trust / Minors', subsystem:'policy', capability:'present', strict:true, patterns:[/^app\/safety\/page\.tsx$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'present', strict:true, patterns:[/^app\/pantaai\/page\.tsx$/] },
  { module:'Experience / Navigation', subsystem:'shell', capability:'present', strict:true, patterns:[/^app\/planet\/page\.tsx$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^core\/kernel\/kernel-gap-intelligence\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'execute', strict:true, patterns:[/^scripts\/pantavion-kernel-compat-repair\.cjs$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'guardian', capability:'observe', strict:true, patterns:[/^(core\/inspector\/visibility-inspector-surface|scripts\/export-visibility-inspector-surface)\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'observe', strict:true, patterns:[/^core\/intelligence\/pantavion-ecosystem-radar-runtime\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/pantavion-intelligence-registry\.ts$/] },
  { module:'Personal AI / PantaAI', subsystem:'orchestration', capability:'configure', strict:true, patterns:[/^core\/intelligence\/pantavion-sovereign-intelligence-fabric\.ts$/,/^core\/ai\/pantavion-ai-command-center\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'execute', strict:true, patterns:[/^scripts\/pantavion-project-intake-prioritize-work-orders\.cjs$/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'infrastructure', capability:'configure', strict:true, patterns:[/^core\/pantavion\/internal-infrastructure-registry\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'observe', strict:true, patterns:[/^core\/pantavion\/kernel-completion-spine\.ts$/] },
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', strict:true, patterns:[/^scripts\/pantavion-unfinished-plan-ingestion\.cjs$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', capability:'create', strict:true, patterns:[/^app\/api\/pantavion\/implementation-plan\/route\.ts$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'execution', capability:'execute', strict:true, patterns:[/^scripts\/pantavion-safe-git-autopilot\.cjs$/] },
  { module:'Identity / Auth / Consent', subsystem:'authorization', capability:'protect', strict:true, patterns:[/^core\/app\/(tenant-data-access-storage-isolation-wave|tenant-export-access-guard)\.ts$/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'infrastructure', capability:'present', strict:true, patterns:[/^app\/infrastructure\/page\.tsx$/] },
  { module:'Safety / Trust / Minors', subsystem:'moderation', capability:'protect', strict:true, patterns:[/^app\/owner\/safety\/(page|safety-control-client|verify\/page)\.tsx$/] },
  { module:'SOS / Crisis', subsystem:'emergency', capability:'observe', strict:true, patterns:[/^core\/admin\/sos-admin-(operations|readiness-queue)\.ts$/] },
  { module:'Chat', subsystem:'messaging', capability:'present', strict:true, patterns:[/^app\/unified-inbox\/page\.tsx$/] },
  { module:'Interpreter / Translation', subsystem:'speech', capability:'translate', strict:true, patterns:[/^app\/api\/pantavion\/transcribe\/route\.ts$/] },
  { module:'Recovery / Provenance', subsystem:'evidence', capability:'observe', strict:true, patterns:[/^app\/deep-audit\/page\.tsx$/] }
];

function sourcePathAnchor(file) {
  const sourcePath = String(file || '').toLowerCase().replace(/\\/g,'/');
  if (!sourcePath) return null;
  const matches = sourcePathAnchors.filter(anchor => anchor.patterns.some(pattern => pattern.test(sourcePath)));
  const strictMatches = matches.filter(anchor => anchor.strict);
  if (strictMatches.length === 1) return { ...strictMatches[0], sourcePath };
  return matches.length === 1 ? { ...matches[0], sourcePath } : null;
}

function anchoredRank(groups, text, anchor) {
  const ranked = rank(groups, text);
  if (!anchor || !groups[anchor.subsystem]) return ranked;
  const existing = ranked.find(item => item.name === anchor.subsystem);
  if (existing) {
    existing.score += anchor.strict ? 100 : 8;
    existing.evidence = [...new Set([...existing.evidence,'source-path:'+anchor.sourcePath])];
  } else {
    ranked.push({ name:anchor.subsystem, score:anchor.strict ? 100 : 8, evidence:['source-path:'+anchor.sourcePath] });
  }
  return ranked.sort((a,b) => b.score-a.score || a.name.localeCompare(b.name));
}

function capabilityFromPath(file, anchor) {
  const source = String(file || '').toLowerCase().replace(/\\/g,'/');
  if (source.startsWith('data/runtime-reports/')) return 'observe';
  if (!anchor) return null;
  const exactLanes = [
    { capability:'protect', pattern:/^scripts\/apply-pantavion-global-safety-patch\.cjs$/ },
    { capability:'observe', pattern:/^app\/kernel\/kernel-live-panel-client\.tsx$/ },
    { capability:'execute', pattern:/^core\/kernel\/kernel-control-plane\.ts$/ },
    { capability:'protect', pattern:/^core\/kernel\/kernel-admission\.ts$/ },
    { capability:'configure', pattern:/^core\/pantavion-kernel-foundation\.ts$/ },
    { capability:'observe', pattern:/^core\/memory\/memory-event-log\.ts$/ },
    { capability:'synchronize', pattern:/^core\/memory\/continuity-graph\.ts$/ },
    { capability:'update', pattern:/^app\/(api\/)?professional\/infrastructure\/water\/(admin\/approvals|access\/admin\/(approve|decision))(\/|$)/ },
    { capability:'observe', pattern:/^scripts\/(pantavion-water-kernel-gate|water-guardian-production-smoke|pantavion-water-map-b-dwg-inventory)\.(cjs|mjs)$/ },
    { capability:'execute', pattern:/^core\/water\/water-ai-operations-kernel\.ts$/ },
    { capability:'read', pattern:/^core\/water\/water-ai-map-intelligence-kernel\.ts$/ },
    { capability:'read', pattern:/^core\/infrastructure\/water\/(water-address-candidate-disambiguation|controlled-water-segment-provider|water-target-viewport)\.ts$/ },
    { capability:'read', pattern:/^core\/water\/water-map-view-mode-model\.ts$/ },
    { capability:'configure', pattern:/^core\/infrastructure\/water\/(water-abc-tile-foundation|water-serving-contract)\.ts$/ },
    { capability:'execute', pattern:/^core\/infrastructure\/water\/water-dxf-private-source-processing-plan\.ts$/ },
    { capability:'configure', pattern:/^core\/runtime\/(voice-geo-locale-registry|runtime-scenario-registry)\.ts$/ },
    { capability:'protect', pattern:/^core\/runtime\/(voice-hardening-policy|runtime-hardening-policy)\.ts$/ },
    { capability:'observe', pattern:/^app\/api\/professional\/infrastructure\/water\/serving\/readiness\/route\.ts$/ },
    { capability:'execute', pattern:/^core\/memory\/background-preparation-queue\.ts$/ },
    { capability:'synchronize', pattern:/^scripts\/(water-convert-kml-to-authentic-geojson|pantavion-water-kml-to-geojson)\.cjs$/ },
    { capability:'translate', pattern:/^core\/translation\/pantavion-language-provider-runtime\.ts$/ },
    { capability:'observe', pattern:/^core\/infrastructure\/water\/water-spatial-serving-readiness\.ts$/ },
    { capability:'update', pattern:/^core\/water\/water-fault-lifecycle-model\.ts$/ },
    { capability:'protect', pattern:/^core\/security\/(authorization-policy-registry|auth-identity-security-registry|runtime-abuse-protection-policy|audit-integrity-policy)\.ts$/ },
    { capability:'observe', pattern:/^core\/kernel\/final-closure-audit-policy\.ts$/ },
    { capability:'protect', pattern:/^core\/infrastructure\/water\/water-access-control-readiness\.ts$/ },
    { capability:'execute', pattern:/^core\/kernel\/kernel-(exported|one-shot|real|integration)-runner\.ts$/ },
    { capability:'observe', pattern:/^scripts\/(pantavion-translation-worker-gate|pantavion-real-translation-smoke)\.cjs$/ },
    { capability:'protect', pattern:/^app\/auth\/actions\.ts$/ },
    { capability:'translate', pattern:/^app\/api\/pantavion\/speech-to-text\/route\.ts$/ },
    { capability:'read', pattern:/^app\/people\/page\.tsx$/ },
    { capability:'read', pattern:/^app\/social\/(page|social-home-client)\.tsx$/ },
    { capability:'read', pattern:/^app\/messages\/page\.tsx$/ },
    { capability:'synchronize', pattern:/^app\/messages\/\[conversationid\]\/conversation-client\.tsx$/ },
    { capability:'execute', pattern:/^core\/(kernel\/kernel|kernel-planner|pantavion-kernel-intake|kernel\/kernel-command-surface|kernel\/pantavion-autonomous-builder-kernel|kernel\/pantavion-implementation-engine|kernel\/kernel-priority-queue|pantavion-kernel-intelligence|kernel\/kernel-entrypoint)\.ts$/ },
    { capability:'synchronize', pattern:/^core\/memory\/memory-thread-kernel\.ts$/ },
    { capability:'execute', pattern:/^core\/emergency\/sos-provider-dispatch-contract\.ts$/ },
    { capability:'read', pattern:/^app\/professional\/infrastructure\/water\/live\/controlled-water-segment-client\.tsx$/ },
    { capability:'update', pattern:/^app\/api\/professional\/infrastructure\/water\/(admin\/faults(\/\[recordnumber\])?|field\/fault)\/route\.ts$/ },
    { capability:'read', pattern:/^core\/infrastructure\/water\/water-intelligence-sidebar\.ts$/ },
    { capability:'synchronize', pattern:/^app\/professional\/infrastructure\/water\/final-master-dwg\/final-master-dwg-uploader\.tsx$/ },
    { capability:'execute', pattern:/^core\/infrastructure\/water\/water-network-kernel\.ts$/ },
    { capability:'update', pattern:/^core\/infrastructure\/water\/water-approval-inbox\.ts$/ },
    { capability:'configure', pattern:/^core\/infrastructure\/water\/water-kernel-constitution\.ts$/ },
    { capability:'synchronize', pattern:/^app\/api\/professional\/infrastructure\/water\/(final-master-dwg|master-dwg)\/route\.ts$/ },
    { capability:'read', pattern:/^app\/professional\/infrastructure\/water\/(water-map-navigation|components\/water-derived-map-client|components\/water-map-b-authentic-client)\.tsx$/ },
    { capability:'read', pattern:/^core\/infrastructure\/water\/(water-map-kernel|water-street-history-ledger)\.ts$/ },
    { capability:'read', pattern:/^app\/api\/professional\/infrastructure\/water\/tiles\/viewport\/route\.ts$/ },
    { capability:'update', pattern:/^app\/professional\/infrastructure\/water\/(admin\/faults\/\[recordnumber\]|field\/fault)\/page\.tsx$/ },
    { capability:'read', pattern:/^app\/professional\/infrastructure\/water\/(b-map|maps|help)\/page\.tsx$/ },
    { capability:'observe', pattern:/^core\/(pantavion-kernel-completion|kernel\/kernel-evolution-proposal-log|runtime\/runtime-health-matrix|kernel\/kernel-gap-matrix|kernel\/kernel-run-artifact|kernel\/kernel-heartbeat)\.ts$/ },
    { capability:'read', pattern:/^app\/kernel\/(intake|completion|hardening|prime-law)\/page\.tsx$/ },
    { capability:'read', pattern:/^app\/kernel\/page\.tsx$/ },
    { capability:'protect', pattern:/^core\/(identity\/age-role-engine|app\/public-surface-access-gate)\.ts$/ },
    { capability:'read', pattern:/^app\/social\/map\/(page|social-map-client)\.tsx$/ },
    { capability:'read', pattern:/^core\/memory\/(working-memory-store|cognitive-memory-stratification-wave|predictive-planning-memory-store|episodic-memory-store|long-horizon-memory-store)\.ts$/ },
    { capability:'synchronize', pattern:/^core\/memory\/(supabase-continuity-store|pantavion-continuity-thread-memory)\.ts$/ },
    { capability:'configure', pattern:/^core\/(kernel\/kernel-script-surface|kernel-store|kernel\/kernel-constitution-regeneration-wave)\.ts$/ },
    { capability:'execute', pattern:/^app\/kernel\/run\/page\.tsx$/ },
    { capability:'protect', pattern:/^app\/auth\/(callback\/route|register\/registerclient)\.tsx?$/ },
    { capability:'translate', pattern:/^core\/translation\/pantavion-universal-translation-runtime\.ts$/ },
    { capability:'synchronize', pattern:/^core\/continuity\/sync-state-registry\.ts$/ },
    { capability:'observe', pattern:/^scripts\/(pantavion-water-abc-map-system-gate|water-private-index-runtime-smoke)\.cjs$/ },
    { capability:'synchronize', pattern:/^scripts\/upload-final-master-dwg-to-blob\.cjs$/ },
    { capability:'read', pattern:/^app\/api\/professional\/infrastructure\/water\/master\/b\/route\.ts$/ },
    { capability:'protect', pattern:/^app\/professional\/infrastructure\/water\/admin\/login\/page\.tsx$/ },
    { capability:'update', pattern:/^app\/professional\/infrastructure\/water\/admin\/faults\/page\.tsx$/ },
    { capability:'execute', pattern:/^app\/professional\/infrastructure\/water\/intelligence\/water-intelligence-command-client\.tsx$/ },
    { capability:'observe', pattern:/^app\/api\/professional\/infrastructure\/water\/sentinel\/route\.ts$/ },
    { capability:'create', pattern:/^app\/api\/professional\/infrastructure\/water\/field\/(submission|admin\/submissions)\/route\.ts$/ },
    { capability:'synchronize', pattern:/^app\/api\/professional\/infrastructure\/water\/final-master-dwg\/upload-url\/route\.ts$/ },
    { capability:'protect', pattern:/^core\/water\/water-user-device-access-model\.ts$/ },
    { capability:'read', pattern:/^app\/professional\/infrastructure\/water\/(master-b-mobile|b|c|final-master-dwg|live|master-dwg|master|workspaces)\/page\.tsx$/ },
    { capability:'read', pattern:/^app\/professional\/infrastructure\/water\/page\.tsx$/ },
    { capability:'observe', pattern:/^core\/storage\/kernel-report-store\.ts$/ },
    { capability:'protect', pattern:/^core\/storage\/kernel-admission-store\.ts$/ },
    { capability:'synchronize', pattern:/^core\/storage\/(kernel-artifact-store|kernel-state-store|kernel-persistence-orchestrator)\.ts$/ },
    { capability:'update', pattern:/^app\/profile\/profileclient\.tsx$/ },
    { capability:'synchronize', pattern:/^app\/people\/people-client\.tsx$/ },
    { capability:'execute', pattern:/^scripts\/pantavion-project-intake-autonomous-dispatch\.cjs$/ },
    { capability:'observe', pattern:/^scripts\/pantavion-autonomous-guardian-audit\.cjs$/ },
    { capability:'observe', pattern:/^app\/api\/pantavion\/interpreter\/health\/route\.ts$/ },
    { capability:'read', pattern:/^app\/messages\/\[conversationid\]\/page\.tsx$/ },
    { capability:'protect', pattern:/^core\/kernel\/agent-authorization-contract\.ts$/ },
    { capability:'configure', pattern:/^core\/kernel\/(kernel-bootstrap-manifest|kernel-foundation-lock|kernel-types)\.ts$/ },
    { capability:'read', pattern:/^core\/kernel\/common\/pantavion-common-services\.ts$/ },
    { capability:'configure', pattern:/^core\/kernel\/language\/pantavion-language-kernel\.ts$/ },
    { capability:'read', pattern:/^app\/media\/page\.tsx$/ },
    { capability:'update', pattern:/^app\/auth\/complete-profile\/page\.tsx$/ }
  ];
  const exactMatches = [...new Set(exactLanes.filter(lane => lane.pattern.test(source)).map(lane => lane.capability))];
  if (exactMatches.length === 1) return exactMatches[0];
  const lanes = [
    { capability:'observe', pattern:/(^|[-/])(audit|logging|readiness|health|report|evidence|status|monitor|smoke)([-/.]|$)/ },
    { capability:'protect', pattern:/(^|[-/])(access|authorized|authorization|privacy|security|policy|filtering|session|guard|guardian|moderation|block)([-/.]|$)/ },
    { capability:'update', pattern:/(^|[-/])(approve|decision|update|edit|lifecycle|transition)([-/.]|$)/ },
    { capability:'read', pattern:/(^|[-/])(search|reader|query|bbox|lookup|view|index|serving|sources?|fetch|list|discover)([-/.]|$)/ },
    { capability:'configure', pattern:/(^|[-/])(registry|config|manifest|technology|contract|model|taxonomy|settings)([-/.]|$)/ },
    { capability:'execute', pattern:/(^|[-/])(runtime|worker|execute|assistant|processing|dispatch|orchestrator|bootstrap)([-/.]|$)/ },
    { capability:'create', pattern:/(^|[-/])(create|publish|post|new)([-/.]|$)/ },
    { capability:'synchronize', pattern:/(^|[-/])(sync|import|export|hydrate)([-/.]|$)/ },
    { capability:'translate', pattern:/(^|[-/])(translate|translation|interpreter)([-/.]|$)/ },
    { capability:'adapt', pattern:/(^|[-/])(personalization|adaptive)([-/.]|$)/ }
  ];
  const matches = [...new Set(lanes.filter(lane => lane.pattern.test(source)).map(lane => lane.capability))];
  if (matches.length === 1) return matches[0];
  if (matches.length === 0 && anchor.module !== 'Maps / World / Water') return anchor.capability || null;
  return null;
}

function anchoredCapabilityRank(text, anchor, sourceFile) {
  const ranked = rank(capabilities, text);
  const pathCapability = capabilityFromPath(sourceFile, anchor);
  if (!pathCapability || !capabilities[pathCapability]) return ranked;
  const existing = ranked.find(item => item.name === pathCapability);
  if (existing) {
    existing.score += 8;
    existing.evidence = [...new Set([...existing.evidence,'source-path-capability:'+String(sourceFile || '')])];
  } else {
    ranked.push({ name:pathCapability, score:8, evidence:['source-path-capability:'+String(sourceFile || '')] });
  }
  return ranked.sort((a,b) => b.score-a.score || a.name.localeCompare(b.name));
}

function evidenceModules(value) {
  const text = normalize(value);
  const modules = [];
  const add = name => { if (!modules.includes(name)) modules.push(name); };
  if (/identity|auth|registration|profile|consent|aal2|account/.test(text)) add('Identity / Auth / Consent');
  if (/trust|safety|minor|privacy|protected|moderation|block|guardian/.test(text)) add('Safety / Trust / Minors');
  if (/durable execution|scheduled worker|owner decision|kernel|runtime/.test(text)) add('Kernel / Guardian / Runtime');
  if (/people|contact|nearby|relationship/.test(text)) add('People');
  if (/social|communit|post|reaction|notification|personal media|media item|media source/.test(text)) add('Social / Pulse / Communities');
  if (/chat|messag|conversation|receipt/.test(text)) add('Chat');
  if (/interpreter|translat|speech|language/.test(text)) add('Interpreter / Translation');
  if (/personal ai|memory|panta ai/.test(text)) add('Personal AI / PantaAI');
  if (/emergency|sos|crisis/.test(text)) add('SOS / Crisis');
  if (/listing|billing|entitlement|revenue|promotion|marketplace/.test(text)) add('Marketplace / Work / Business');
  if (/voice|video|call/.test(text)) add('Voice / Video');
  if (/water|dwg|geospatial|map system/.test(text)) add('Maps / World / Water');
  if (/continuity|offline|resilience/.test(text)) add('Resilience / Offline / Infrastructure');
  if (/learning|curriculum|mastery/.test(text)) add('Learning / Knowledge');
  return modules;
}

function loadProductionTruthEvidence() {
  if (!fs.existsSync(productionTruthPath)) return null;
  const evidence = JSON.parse(fs.readFileSync(productionTruthPath,'utf8'));
  const repoMigrations = evidence.repository && evidence.repository.migrationFiles;
  const appliedMigrations = evidence.supabase && evidence.supabase.appliedMigrations;
  if (!repoMigrations || repoMigrations.count !== repoMigrations.items.length) throw new Error('Repository migration evidence count mismatch');
  if (!appliedMigrations || appliedMigrations.count !== appliedMigrations.items.length) throw new Error('Applied migration evidence count mismatch');
  const objectEvidence = evidence.reconciliation && evidence.reconciliation.objectLevelProductionEvidence;
  if (!objectEvidence || objectEvidence.examinedRepositoryMigrations !== objectEvidence.items.length) throw new Error('Object-level migration evidence count mismatch');
  if (objectEvidence.examinedRepositoryMigrations !== evidence.reconciliation.repositoryMigrationsWithoutExactAppliedName.count) throw new Error('Object-level migration evidence does not cover every non-exact repository migration');
  if (objectEvidence.equivalenceDecision !== 'HOLD_NON_EXACT' || objectEvidence.items.some(item => item.equivalenceDecision !== 'HOLD_NON_EXACT')) throw new Error('Object-level evidence must not assert migration equivalence');
  const definitionLineage = objectEvidence.definitionLineage;
  if (!definitionLineage || definitionLineage.repositoryMigrationsExamined !== definitionLineage.items.length || definitionLineage.repositoryMigrationsExamined !== 8) throw new Error('Definition lineage evidence count mismatch');
  if (definitionLineage.appliedMigrationHistoryRows !== appliedMigrations.count) throw new Error('Definition lineage does not cover complete applied migration history');
  if (definitionLineage.currentLiveFunctions !== definitionLineage.currentLiveFunctionsMatchingLatestAppliedDefinition) throw new Error('A live target function lacks exact latest-applied definition lineage');
  if (definitionLineage.currentLiveRelations !== definitionLineage.currentLiveRelationsWithAppliedCreateLineage) throw new Error('A live target relation lacks applied create lineage');
  if (definitionLineage.equivalenceDecision !== 'HOLD_NON_EXACT') throw new Error('Definition lineage must not assert replay equivalence');
  return evidence;
}

function normalize(value) { return String(value || '').toLowerCase().replace(/[_/.-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function hasTerm(text, term) { const t = normalize(term); return t.includes(' ') ? text.includes(t) : text.split(/\W+/).includes(t); }
function rank(groups, text) { return Object.entries(groups).map(([name,terms]) => ({ name, score: terms.reduce((n,t) => n + (hasTerm(text,t) ? (normalize(t).includes(' ') ? 3 : 1) : 0), 0), evidence: terms.filter(t => hasTerm(text,t)) })).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.name.localeCompare(b.name)); }
function artifactType(file, text) {
  const f = normalize(file);
  if (/(__tests__|\.test\.|\.spec\.)/.test(file)) return 'test';
  if (f.includes('migration') || /create table|alter table|create policy/.test(text)) return 'database-migration';
  if (f.startsWith('app api ') || f.includes(' route ts')) return 'api';
  if (f.startsWith('app ') && /component|page|screen|button/.test(text)) return 'user-interface';
  if (f.startsWith('services ')) return 'service';
  if (f.startsWith('scripts ') || f.startsWith('github ')) return 'automation';
  if (f.startsWith('docs ') || file.endsWith('.md')) return 'requirement-document';
  if (f.startsWith('data runtime reports ')) return 'runtime-evidence';
  if (f.startsWith('data ')) return 'data-artifact';
  return 'implementation';
}
function isRecursiveLedgerArtifact(record) {
  const sourceFile = normalize(record.provenance && record.provenance.sourceFile);
  return sourceFile.startsWith('data recovery canonical ledger corpus batches ');
}
function classify(record) {
  const seedModule = record.classification && record.classification.module;
  if (isRecursiveLedgerArtifact(record)) {
    const sourceFile = (record.provenance && record.provenance.sourceFile) || 'unknown';
    return {
      ...record,
      classification: {
        ...record.classification,
        semanticDomain: 'Recovery / Provenance',
        subsystem: 'recursive-ledger',
        capability: 'preserve',
        feature: 'recursive-ledger.preserve.recovery-wrapper',
        artifactType: 'recovery-ledger-wrapper',
        canonicalTarget: 'canonical/recovery/quarantine/' + path.basename(sourceFile,'.json'),
        classificationMethod: 'semantic-v3-recursive-ledger-quarantine',
        classificationEvidence: { sourcePath: sourceFile, rule: 'source-is-canonical-ledger-batch' }
      },
      reviewStatus: 'PRESERVED_RECURSIVE_ARTIFACT',
      semanticDecision: 'PRESERVE_QUARANTINE',
      semanticReviewReasons: ['recursive_ledger_artifact']
    };
  }
  const sourceFile = (record.provenance && record.provenance.sourceFile) || '';
  const pathAnchor = sourcePathAnchor(sourceFile);
  const module = pathAnchor ? pathAnchor.module : seedModule;
  const text = normalize([sourceFile, record.text, record.context].join('\n'));
  const artifact = artifactType(sourceFile, text);
  const subsystems = ontology[module] ? anchoredRank(ontology[module], text, pathAnchor) : [];
  const capabilityPath = capabilityFromPath(sourceFile, pathAnchor);
  const capabilityRanks = anchoredCapabilityRank(text, pathAnchor, sourceFile);
  const subsystem = pathAnchor ? pathAnchor.subsystem : (subsystems[0] ? subsystems[0].name : null);
  const capability = capabilityRanks[0] ? capabilityRanks[0].name : null;
  const subsystemConflict = subsystems.length > 1 && subsystems[0].score === subsystems[1].score;
  const capabilityConflict = capabilityRanks.length > 1 && capabilityRanks[0].score === capabilityRanks[1].score;
  const competingModules = Object.entries(ontology).map(([name,groups]) => {
    const rankedSubsystems = name === module ? subsystems : rank(groups, text);
    const pathScore = pathAnchor && name === pathAnchor.module ? (pathAnchor.strict ? 100 : 12) : 0;
    return {
      name,
      score: rankedSubsystems.reduce((sum,item) => sum + item.score, 0) + pathScore,
      strongestSubsystemScore: rankedSubsystems[0] ? rankedSubsystems[0].score : 0,
      evidence: [...(pathAnchor && name === pathAnchor.module ? ['source-path:'+pathAnchor.sourcePath] : []),...rankedSubsystems.flatMap(item => item.evidence)].slice(0,12)
    };
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score || b.strongestSubsystemScore-a.strongestSubsystemScore || a.name.localeCompare(b.name));
  const topModule = competingModules[0] || null;
  const secondModule = competingModules[1] || null;
  const moduleMatches = Boolean(module && topModule && topModule.name === module);
  const moduleEvidenceStrong = Boolean(topModule && topModule.score >= 3 && topModule.strongestSubsystemScore >= 2);
  const moduleMarginStrong = Boolean(topModule && (!secondModule || topModule.score - secondModule.score >= 2));
  const subsystemEvidenceStrong = Boolean(subsystems[0] && subsystems[0].score >= 2);
  const moduleConflict = Boolean(module && topModule && topModule.name !== module);
  const deterministic = Boolean(module && subsystem && capability && moduleMatches && moduleEvidenceStrong && moduleMarginStrong && subsystemEvidenceStrong && !subsystemConflict && !capabilityConflict && !moduleConflict);
  const reasons = [];
  if (!module) reasons.push('module_missing');
  if (!subsystem) reasons.push('subsystem_missing');
  if (!capability) reasons.push('capability_missing');
  if (!moduleMatches) reasons.push('module_not_confirmed');
  if (!moduleEvidenceStrong) reasons.push('module_evidence_weak');
  if (!moduleMarginStrong) reasons.push('module_margin_ambiguous');
  if (!subsystemEvidenceStrong) reasons.push('subsystem_evidence_weak');
  if (subsystemConflict) reasons.push('subsystem_conflict');
  if (capabilityConflict) reasons.push('capability_conflict');
  if (moduleConflict) reasons.push('module_conflict:' + module + '->' + topModule.name);
  return { ...record, classification: { ...record.classification, module, subsystem, capability, feature: subsystem && capability ? subsystem + '.' + capability + '.' + artifact : null, artifactType: artifact, canonicalTarget: deterministic ? 'canonical/' + module + '/' + subsystem + '/' + capability : null, classificationMethod: pathAnchor ? 'semantic-v3-source-path-anchored-ontology' : 'semantic-v3-strict-evidence-ontology', classificationEvidence: { seedModule, pathAnchor:pathAnchor ? { module:pathAnchor.module, subsystem:pathAnchor.subsystem, capabilityFallback:pathAnchor.capability || null, sourcePath:pathAnchor.sourcePath } : null, capabilityPath:capabilityPath ? { capability:capabilityPath, sourcePath:sourceFile } : null, subsystem: subsystems.slice(0,3), capability: capabilityRanks.slice(0,3), competingModules: competingModules.slice(0,3) } }, reviewStatus: deterministic ? 'SEMANTICALLY_CLASSIFIED' : 'REVIEW_REQUIRED', semanticDecision: deterministic ? 'ROUTE_CANDIDATE' : 'HOLD', semanticReviewReasons: reasons };
}
function fingerprint(records) { return crypto.createHash('sha256').update(records.map(r => r.id).join('\n')).digest('hex'); }

function loadCanonicalInput() {
  const receiptPath = path.join(committedCorpusRoot, 'MATERIALIZATION_RECEIPT.json');
  const batchesRoot = path.join(committedCorpusRoot, 'batches');
  if (fs.existsSync(receiptPath) && fs.existsSync(batchesRoot)) {
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    const batchFiles = fs.readdirSync(batchesRoot).filter(name => name.endsWith('.json')).sort();
    const records = [];
    for (const name of batchFiles) {
      const batch = JSON.parse(fs.readFileSync(path.join(batchesRoot, name), 'utf8'));
      if (!Array.isArray(batch.records)) throw new Error('Committed batch has no records: ' + name);
      records.push(...batch.records);
    }
    if (records.length !== receipt.totalRecords || batchFiles.length !== receipt.totalBatches) {
      throw new Error('Committed corpus receipt mismatch: records=' + records.length + ', batches=' + batchFiles.length);
    }
    return { manifest: { id:receipt.id, corpusFingerprint:receipt.corpusFingerprint }, records, source:'committed-canonical-ledger' };
  }
  if (!fs.existsSync(generatedInputPath)) throw new Error('Missing canonical corpus ledger and generated fallback');
  return { ...JSON.parse(fs.readFileSync(generatedInputPath, 'utf8')), source:'generated-v2-fallback' };
}

const input = loadCanonicalInput();
if (!Array.isArray(input.records)) throw new Error('Canonical input records are missing');
const before = input.records.map(r => r.id);
if (new Set(before).size !== before.length) throw new Error('Input contains duplicate record IDs');
const records = input.records.map(classify);
const after = records.map(r => r.id);
if (before.length !== after.length || before.some((id,i) => id !== after[i])) throw new Error('Record preservation gate failed');

const counts = records.reduce((a,r) => { a[r.reviewStatus] = (a[r.reviewStatus] || 0) + 1; return a; }, {});
const moduleSummary = {};
const reviewReasonSummary = {};
for (const r of records) {
  const module = r.reviewStatus === 'PRESERVED_RECURSIVE_ARTIFACT' ? 'RECOVERY / PROVENANCE QUARANTINE' : (r.classification.module || 'UNCLASSIFIED');
  const target = moduleSummary[module] ||= { total:0, classified:0, reviewRequired:0, preservedRecursiveArtifacts:0, pathAnchored:0, pathReassigned:0, moduleMissingResolved:0, subsystems:{}, capabilities:{}, artifactTypes:{}, sourceFamilies:{}, evidenceInventory:{ specification:0, schemaOrMigration:0, backendOrService:0, userInterface:0, tests:0, automation:0, runtimeEvidence:0, other:0 }, reviewReasons:{} };
  target.total++;
  if (r.reviewStatus === 'SEMANTICALLY_CLASSIFIED') target.classified++;
  else if (r.reviewStatus === 'PRESERVED_RECURSIVE_ARTIFACT') target.preservedRecursiveArtifacts++;
  else target.reviewRequired++;
  if (r.classification.subsystem) target.subsystems[r.classification.subsystem] = (target.subsystems[r.classification.subsystem] || 0) + 1;
  if (r.classification.capability) target.capabilities[r.classification.capability] = (target.capabilities[r.classification.capability] || 0) + 1;
  const artifact = r.classification.artifactType || 'unknown';
  const sourceFamily = (r.provenance && r.provenance.sourceFamily) || 'unknown';
  target.artifactTypes[artifact] = (target.artifactTypes[artifact] || 0) + 1;
  target.sourceFamilies[sourceFamily] = (target.sourceFamilies[sourceFamily] || 0) + 1;
  const pathEvidence = r.classification.classificationEvidence && r.classification.classificationEvidence.pathAnchor;
  if (pathEvidence) {
    target.pathAnchored++;
    if (r.classification.classificationEvidence.seedModule !== r.classification.module) target.pathReassigned++;
    if (r.reviewStatus !== 'PRESERVED_RECURSIVE_ARTIFACT' && !r.classification.classificationEvidence.seedModule && r.classification.module) target.moduleMissingResolved++;
  }
  const evidenceLane = artifact === 'requirement-document' ? 'specification'
    : artifact === 'database-migration' ? 'schemaOrMigration'
    : ['api','service','implementation'].includes(artifact) ? 'backendOrService'
    : artifact === 'user-interface' ? 'userInterface'
    : artifact === 'test' ? 'tests'
    : artifact === 'automation' ? 'automation'
    : artifact === 'runtime-evidence' ? 'runtimeEvidence'
    : 'other';
  target.evidenceInventory[evidenceLane]++;
  for (const reason of r.semanticReviewReasons || []) {
    reviewReasonSummary[reason] = (reviewReasonSummary[reason] || 0) + 1;
    target.reviewReasons[reason] = (target.reviewReasons[reason] || 0) + 1;
  }
}
const productionTruth = loadProductionTruthEvidence();
const unassignedExternalEvidence = { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
function attachExternalEvidence(kind, item, value) {
  const modules = evidenceModules(value);
  if (!modules.length) {
    unassignedExternalEvidence[kind].push(item);
    return;
  }
  for (const module of modules) {
    const target = moduleSummary[module];
    if (!target) continue;
    target.externalEvidence ||= { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
    target.externalEvidence[kind].push(item);
  }
}
if (productionTruth) {
  for (const item of productionTruth.repository.migrationFiles.items) attachExternalEvidence('repositoryMigrationFiles',item,item.file);
  for (const item of productionTruth.supabase.appliedMigrations.items) attachExternalEvidence('appliedMigrations',item,item.name);
  for (const item of productionTruth.reconciliation.objectLevelProductionEvidence.items) attachExternalEvidence('migrationObjectReconciliation',item,item.repositoryMigration);
  for (const item of productionTruth.repository.verificationArtifacts.conventionalTests.items) attachExternalEvidence('conventionalTests',item,item.path);
  for (const item of productionTruth.repository.verificationArtifacts.gatesAuditsSmokes.items) attachExternalEvidence('gatesAuditsSmokes',item,item.path);
}
for (const [module,target] of Object.entries(moduleSummary)) {
  if (module === 'RECOVERY / PROVENANCE QUARANTINE') continue;
  target.externalEvidence ||= { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
  target.missingRecoveredEvidenceCategories = Object.entries(target.evidenceInventory).filter(([,count]) => count === 0).map(([name]) => name);
  target.missingCombinedEvidenceCategories = target.missingRecoveredEvidenceCategories.filter(name => {
    if (name === 'schemaOrMigration') return !target.externalEvidence.repositoryMigrationFiles.length && !target.externalEvidence.appliedMigrations.length;
    if (name === 'tests') return !target.externalEvidence.conventionalTests.length;
    return true;
  });
}
const externalProductionTruth = productionTruth ? {
  source:path.relative(root,productionTruthPath),
  capturedAt:productionTruth.capturedAt,
  repositoryRevision:productionTruth.repository.revision,
  repositoryMigrationFiles:productionTruth.repository.migrationFiles.count,
  appliedMigrations:productionTruth.supabase.appliedMigrations.count,
  exactMigrationNameMatches:productionTruth.reconciliation.exactMigrationNameMatches,
  repositoryMigrationsWithoutExactAppliedName:productionTruth.reconciliation.repositoryMigrationsWithoutExactAppliedName.count,
  appliedMigrationsWithoutExactRepositoryName:productionTruth.reconciliation.appliedMigrationsWithoutExactRepositoryName.count,
  migrationReconciliationDecision:productionTruth.reconciliation.decision,
  objectLevelMigrationEvidence:{ examinedRepositoryMigrations:productionTruth.reconciliation.objectLevelProductionEvidence.examinedRepositoryMigrations, statusCounts:productionTruth.reconciliation.objectLevelProductionEvidence.statusCounts, equivalenceDecision:productionTruth.reconciliation.objectLevelProductionEvidence.equivalenceDecision, definitionLineage:{ repositoryMigrationsExamined:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.repositoryMigrationsExamined, appliedMigrationHistoryRows:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.appliedMigrationHistoryRows, declaredFunctions:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.declaredFunctions, currentLiveFunctions:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.currentLiveFunctions, missingFunctions:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.missingFunctions, currentLiveFunctionsMatchingLatestAppliedDefinition:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.currentLiveFunctionsMatchingLatestAppliedDefinition, repositoryFunctionsMatchingCurrentLiveDefinition:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.repositoryFunctionsMatchingCurrentLiveDefinition, repositoryFunctionsDifferingFromCurrentLiveDefinition:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.repositoryFunctionsDifferingFromCurrentLiveDefinition, declaredRelations:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.declaredRelations, currentLiveRelations:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.currentLiveRelations, missingRelations:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.missingRelations, statusCounts:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.statusCounts, equivalenceDecision:productionTruth.reconciliation.objectLevelProductionEvidence.definitionLineage.equivalenceDecision } },
  conventionalTests:productionTruth.repository.verificationArtifacts.conventionalTests.count,
  gatesAuditsSmokes:productionTruth.repository.verificationArtifacts.gatesAuditsSmokes.count,
  publicTables:productionTruth.supabase.publicTables,
  registrationGate:productionTruth.supabase.registrationGate,
  securityAdvisors:productionTruth.supabase.securityAdvisors,
  unassignedExternalEvidence
} : null;
const moduleMissingResolved = Object.values(moduleSummary).reduce((sum,item) => sum + (item.moduleMissingResolved || 0),0);
const manifest = { id:'pantavion_canonical_semantic_v3', generatedAt:new Date().toISOString(), sourceManifest:input.manifest && input.manifest.id, sourceFingerprint:input.manifest && input.manifest.corpusFingerprint, recordCount:records.length, preservedRecordCount:before.length, idFingerprint:fingerprint(records), counts, reviewReasonSummary, moduleMissingResolved, moduleSummary, externalProductionTruth, completion:{ complete:!counts.REVIEW_REQUIRED, semanticallyClassified:counts.SEMANTICALLY_CLASSIFIED || 0, preservedRecursiveArtifacts:counts.PRESERVED_RECURSIVE_ARTIFACT || 0, reviewRequired:counts.REVIEW_REQUIRED || 0 }, truthRule:'No record is final, mergeable, deletable, implemented, deployed, or live merely because deterministic routing succeeded. Semantic review and implementation evidence remain mandatory.' };
fs.mkdirSync(outRoot,{recursive:true});
fs.writeFileSync(path.join(outRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const ledgerPath = path.join(outRoot,'semantic-ledger.ndjson');
const ledgerFd = fs.openSync(ledgerPath,'w');
try {
  for (const record of records) fs.writeSync(ledgerFd,JSON.stringify(record)+'\n');
} finally {
  fs.closeSync(ledgerFd);
}
fs.writeFileSync(path.join(outRoot,'module-gap-map.json'),JSON.stringify(moduleSummary,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
