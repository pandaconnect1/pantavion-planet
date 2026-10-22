import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

type DiscoveryRow = {ref:string;category:string;label:string;layer:string;off:boolean;frozen:boolean;registerNumbers:string[]} & Record<string,unknown>;
type Options = {sourceSha256:string;q:string;category:string;hidden:boolean;unmatched:boolean;offset:number;limit:number;signal?:AbortSignal};
const normalized=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("el-GR");
export async function readWaterDiscoveryPage(blob:Blob, options:Options) {
  const input=Readable.fromWeb(blob.stream() as Parameters<typeof Readable.fromWeb>[0]);
  const unzip=createGunzip();
  input.on("error",error=>unzip.destroy(error));
  const lines=createInterface({input:input.pipe(unzip),crlfDelay:Infinity});
  let metadata:Record<string,unknown>|null=null;
  const items:DiscoveryRow[]=[];
  let total=0, seen=0;
  const tokens=normalized(options.q).split(/\s+/).filter(Boolean);
  try {
    for await(const line of lines) {
      if(options.signal?.aborted) throw new Error("discovery_read_aborted");
      const row=JSON.parse(line);
      if(!metadata){
        if(row.recordType!=="metadata"||row.sourceSha256!==options.sourceSha256) throw new Error("discovery_source_mismatch");
        metadata=row; continue;
      }
      if(row.recordType!=="item"||!Array.isArray(row.registerNumbers))throw new Error("discovery_record_invalid");
      seen++;
      if(options.category&&row.category!==options.category)continue;
      if(options.hidden&&!row.off&&!row.frozen)continue;
      if(options.unmatched&&row.registerNumbers.length)continue;
      if(tokens.length&&!tokens.every(t=>normalized([row.label,row.layer,row.ref,...row.registerNumbers].join(" ")).includes(t)))continue;
      if(total>=options.offset&&items.length<options.limit)items.push(row);
      total++;
    }
    const summary=metadata?.summary as {evidence?:number}|undefined;
    if(!metadata||seen!==summary?.evidence)throw new Error("discovery_incomplete");
    return {ok:true,sourceSha256:metadata.sourceSha256,createdAt:metadata.createdAt,truth:metadata.truth,
      summary:metadata.summary,extractorStats:metadata.extractorStats,layers:metadata.layers,
      sykamCandidateRefs:metadata.sykamCandidateRefs,total,offset:options.offset,items};
  } finally {lines.close();unzip.destroy();input.destroy();}
}
