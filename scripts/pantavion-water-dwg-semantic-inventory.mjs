import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";

const sourcePath=process.env.PANTAVION_WATER_DWG_PATH;
const expectedSha=(process.env.PANTAVION_WATER_DWG_SHA256||"").toLowerCase();
const mapId=process.env.PANTAVION_WATER_MAP_ID||"UNKNOWN";
const outputPath=process.env.PANTAVION_WATER_DWG_SEMANTIC_OUT||".pantavion/water/dwg-semantic-inventory.json";

function fail(reason,details={}){console.error(JSON.stringify({ok:false,reason,...details},null,2));process.exit(1)}
function arr(v){return Array.isArray(v)?v:[]}
function sha256(b){return crypto.createHash("sha256").update(b).digest("hex")}
function s(v){return v===undefined||v===null?null:String(v)}

if(!sourcePath) fail("water_dwg_path_required");
if(!/^[a-f0-9]{64}$/.test(expectedSha)) fail("water_dwg_expected_sha256_required");
if(!fs.existsSync(sourcePath)) fail("water_dwg_not_found",{sourcePath});

const buffer=fs.readFileSync(sourcePath);
const actualSha=sha256(buffer);
if(actualSha!==expectedSha) fail("water_dwg_sha256_mismatch",{expected:expectedSha,actual:actualSha});

const wasmDir=path.join(process.cwd(),"node_modules","@mlightcad","libredwg-web","wasm")+path.sep;
const libredwg=await LibreDwg.create(wasmDir);
let dwg;
try{
  const arrayBuffer=buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  dwg=libredwg.dwg_read_data(arrayBuffer,Dwg_File_Type.DWG);
  if(!dwg) fail("water_dwg_parse_empty");

  const result=libredwg.convertEx(dwg);
  const db=result?.database;
  if(!db) fail("water_dwg_database_empty");

  const layers=arr(db?.tables?.layers);
  const layerByIndex=new Map(layers.map((l,i)=>[i,s(l?.name)]));
  const blocks=arr(db?.tables?.blockRecords);

  const readEntity=(e,blockName,index)=>{
    const layerIndex=e?.layerId ?? e?.layerIndex ?? e?.layer ?? null;
    const layerName=
      s(e?.layerName) ??
      (typeof layerIndex==="number" ? layerByIndex.get(layerIndex) ?? null : null);

    const rawText=
      s(e?.text) ?? s(e?.plainText) ?? s(e?.value) ?? s(e?.contents) ?? null;

    const attrs=e?.attributes && typeof e.attributes==="object" ? e.attributes : null;

    return {
      entityRef:`${blockName}:${index}`,
      entityType:s(e?.type ?? e?.entityType ?? e?.className),
      layerName,
      aciColor:e?.colorIndex ?? e?.aciColor ?? (typeof e?.color==="number"?e.color:null),
      trueColor:e?.trueColor ?? e?.rgb ?? (typeof e?.color==="object"?e.color:null),
      lineType:s(e?.lineTypeName ?? e?.linetypeName ?? e?.lineType),
      lineWeight:e?.lineWeight ?? e?.lineweight ?? null,
      text:rawText,
      blockName:s(e?.blockName ?? e?.name),
      attributes:attrs,
    };
  };

  const entities=[];
  for(const block of blocks){
    const name=s(block?.name)||"UNNAMED_BLOCK";
    arr(block?.entities).forEach((e,i)=>entities.push(readEntity(e,name,i)));
  }

  const keyed=new Map();
  for(const e of entities){
    const key=JSON.stringify([e.layerName,e.aciColor,e.trueColor,e.lineType,e.lineWeight,e.entityType]);
    const row=keyed.get(key)||{
      layerName:e.layerName,
      aciColor:e.aciColor,
      trueColor:e.trueColor,
      lineType:e.lineType,
      lineWeight:e.lineWeight,
      entityType:e.entityType,
      count:0,
      sampleEntityRefs:[],
    };
    row.count++;
    if(row.sampleEntityRefs.length<10) row.sampleEntityRefs.push(e.entityRef);
    keyed.set(key,row);
  }

  const labels=entities
    .filter(e=>e.text||e.attributes)
    .map(e=>({entityRef:e.entityRef,layerName:e.layerName,text:e.text,attributes:e.attributes}));

  const out={
    schemaVersion:"pantavion-water-dwg-semantic-inventory.v1",
    generatedAt:new Date().toISOString(),
    mapId,
    source:{path:path.basename(sourcePath),sha256:actualSha,bytes:buffer.length},
    truth:{
      geometryModified:false,
      sourceModified:false,
      semanticsInferred:false,
      verifiedLegendApplied:false,
    },
    counts:{
      layers:layers.length,
      entities:entities.length,
      styleGroups:keyed.size,
      textOrAttributeEntities:labels.length,
    },
    styleGroups:[...keyed.values()].sort((a,b)=>b.count-a.count),
    labels,
  };

  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  fs.writeFileSync(outputPath,JSON.stringify(out,null,2)+"\n");
  console.log(JSON.stringify({ok:true,outputPath,counts:out.counts},null,2));
}finally{
  if(dwg) libredwg.dwg_free(dwg);
}
