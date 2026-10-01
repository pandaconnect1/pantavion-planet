import assert from "node:assert/strict";
import { createWaterHydraulicHttpEngineAdapter } from "../core/infrastructure/water/water-hydraulic-http-engine-adapter.ts";

const token="x".repeat(40);

const adapter=createWaterHydraulicHttpEngineAdapter({
  endpoint:"https://worker.example.com",
  token,
  engine:"EPANET_2_2",
  fetchImpl:async (_input,init)=>{
    const body=JSON.parse(String(init?.body));
    assert.equal(body.engine,"EPANET_2_2");
    assert.equal(init?.headers && (init.headers as Record<string,string>).Authorization,"Bearer "+token);
    return new Response(JSON.stringify({
      ok:true,
      jobId:body.jobId,
      networkRevisionId:body.networkRevisionId,
      engine:"EPANET_2_2",
      engineVersion:"2.2",
      simulationStartedAt:"2026-10-01T10:00:00Z",
      simulationFinishedAt:"2026-10-01T10:00:01Z",
      nodes:[{nodeId:"J1",pressureHeadM:24.5,hydraulicHeadM:124.5,demandLps:2}],
      links:[{featureId:"P1",flowLps:2,velocityMps:0.1,headlossM:5,status:"OPEN"}],
      warnings:[],
    }),{status:200,headers:{"content-type":"application/json"}});
  },
});

const result=await adapter.runEpanetInp({
  jobId:"job-1",
  networkRevisionId:"rev-1",
  inp:"[TITLE]\n[END]\n",
});
assert.equal(result.engine,"EPANET_2_2");
assert.equal(result.nodes[0].pressureHeadM,24.5);
assert.equal(result.links[0].flowLps,2);

const mismatch=createWaterHydraulicHttpEngineAdapter({
  endpoint:"https://worker.example.com",
  token,
  engine:"EPANET_2_2",
  fetchImpl:async ()=>new Response(JSON.stringify({
    ok:true,
    jobId:"wrong-job",
    networkRevisionId:"rev-1",
    engine:"EPANET_2_2",
    nodes:[],
    links:[],
  }),{status:200,headers:{"content-type":"application/json"}}),
});

await assert.rejects(
  mismatch.runEpanetInp({jobId:"job-2",networkRevisionId:"rev-1",inp:"[END]\n"}),
  /job_identity_mismatch/
);

assert.throws(
  ()=>createWaterHydraulicHttpEngineAdapter({
    endpoint:"http://public.example.com",
    token,
    engine:"EPANET_2_2",
  }),
  /requires_https_or_private_network/
);

console.log(JSON.stringify({ok:true,authHeader:true,identityChecks:true,httpsGate:true}));
