// Source evidence, including previously excluded regions; never hydraulic truth.
const key = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
function category(text, layer, block = false) {
  const s = key(`${text} ${layer}`);
  if (/FLOW|ARROW|DIRECTION|ΡΟΗ|ΒΕΛΟΣ|ΕΙΣΑΓΩΓ|ΕΞΑΓΩΓ|ΤΡΟΦΟΔ|ΥΔΡΟΔΟΤ/.test(key(text))) return "flow";
  if (/DEXAMEN|ΔΕΞΑΜΕΝ|ΥΔΑΤΟΠΥΡΓ|ΝΤΕΠΟΖ|RESERVOIR|WATER.?TANK/.test(s)) return "tank";
  if (/W-DV|VALVE|ΒΑΝ[ΑΕΙ]|ΒΑΛΒ|ΔΙΚΛΙΔ|DIAKOPTH|\bS\.?V\b|\bPRV\b|\bA\.V\b/.test(s)) return "valve";
  if (/STREET|ROAD.?NAME|ΟΔΟ[ΣΥ]|ΟΔΩΝ|ΟΝΟΜ.*ΟΔ/.test(s)) return "street";
  if (/PUMP|ΑΝΤΛΙ|POMP/.test(s)) return "pump";
  if (/BORE.?HOLE|BORHOLE|ΓΕΩΤΡΗΣ|ΠΗΓΗ/.test(s)) return "borehole";
  if (/HYDRANT|ΥΔΡΟΣΤΟΜ|ΠΥΡΟΣΒ|\bF\.?H\b/.test(s)) return "hydrant";
  if (/METER|ΜΕΤΡΗΤ/.test(s)) return "meter";
  if (/FLOW|ARROW|DIRECTION|ΡΟΗ|ΒΕΛΟΣ|ΕΙΣΑΓΩΓ|ΕΞΑΓΩΓ|ΤΡΟΦΟΔ|ΥΔΡΟΔΟΤ/.test(s)) return "flow";
  if (/ZONE|AREA|ΠΕΡΙΟΧ|ΖΩΝΗ|ΣΥΚΑΜ|SYKAM|SIKAM|ΑΘΑΝΑΣ|ATHANAS/.test(s)) return "area";
  return block ? "unclassified_block" : null;
}
export function buildWaterNetworkDiscovery({ texts = [], blockRefs = [], segments = [], leaders = [], layers = [], register = {}, stats = {}, duplicateCutoff = Infinity }) {
  const registered = new Map();
  const position = (x,y,layer) => `${Number(x).toFixed(2)}|${Number(y).toFixed(2)}|${layer}`;
  for (const a of register.assets ?? []) {
    const k = position(a.x,a.y,a.layer);
    registered.set(k,[...(registered.get(k) ?? []),a.number]);
  }
  const items = [];
  const add = (kind, ref, x,y,layerId,label, extra = {}) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const l = layers[layerId] ?? {};
    items.push({ ref, category:kind, label:String(label ?? ""), x,y, layer:l.name ?? `layer-${layerId}`,
      off:Boolean(l.off), frozen:Boolean(l.frozen), beyondPriorCutoff:x>duplicateCutoff,
      registerNumbers:registered.get(position(x,y,l.name)) ?? [], verifiedAsset:false, ...extra });
  };
  texts.forEach((t,i) => { const c=category(t[4],layers[t[2]]?.name); add(c ?? "unclassified_text",`text:${i}`,t[0],t[1],t[2],t[4]); });
  blockRefs.forEach((b,i) => add(category(b[3],layers[b[2]]?.name,true),`block:${i}`,b[0],b[1],b[2],b[3],{drawingOrientation:b[4] ?? null}));
  leaders.forEach((leader,i) => {
    const p=leader.vertices?.[0];
    if(p) add("leader",`leader:${i}`,p[0],p[1],leader.layerId,"LEADER",{
      sourceHandle:leader.sourceHandle,vertices:leader.vertices,arrowheadEnabled:leader.arrowheadEnabled,
      hydraulicDirectionVerified:false,
    });
  });
  const layerCounts = layers.map((l,id) => ({ id, name:l.name,off:Boolean(l.off),frozen:Boolean(l.frozen),segments:0,texts:0,blocks:0 }));
  for (const s of segments) if(layerCounts[s[4]]) layerCounts[s[4]].segments++;
  for (const t of texts) if(layerCounts[t[2]]) layerCounts[t[2]].texts++;
  for (const b of blockRefs) if(layerCounts[b[2]]) layerCounts[b[2]].blocks++;
  const counts = {};
  for(const r of items) counts[r.category]=(counts[r.category]??0)+1;
  const sykam = items.filter(r=>/ΣΥΚΑΜ|ΣΗΚΑΜ|SYKAM|SIKAM|ΑΝΔΡΕΑ.*ΠΑΠΑΔΟΠΟΥΛ|ANDREA.*PAPADOPOUL/.test(key(`${r.label} ${r.layer}`))).map(r=>r.ref);
  return {schemaVersion:"water-network-discovery-v1",createdAt:new Date().toISOString(),
    truth:{sourceEvidenceOnly:true,geographicAlignmentVerified:false,hydraulicConnectivityVerified:false,canonicalMutation:false,physicalAssetCountsVerified:false},
    summary:{sourceTexts:texts.length,sourceBlocks:blockRefs.length,sourceLeaders:leaders.length,layers:layers.length,evidence:items.length,categories:counts,
      hiddenEvidence:items.filter(r=>r.off||r.frozen).length,beyondPriorCutoff:items.filter(r=>r.beyondPriorCutoff).length,
      unmatchedEvidence:items.filter(r=>!r.registerNumbers.length).length},
    extractorStats:stats, layers:layerCounts, sykamCandidateRefs:sykam,items};
}
