from __future__ import annotations

import os

os.environ.setdefault("PANTAVION_ALLOW_LOCAL_WATER_WORKER", "true")

from worker import run_model

INP = """[TITLE]
Pantavion Water Engineering Worker Smoke Test

[JUNCTIONS]
;ID  Elevation  Demand
J1   0          1

[RESERVOIRS]
;ID  Head
R1   30

[PIPES]
;ID  Node1  Node2  Length  Diameter  Roughness  MinorLoss  Status
P1   R1     J1     100     100       130        0          OPEN

[OPTIONS]
UNITS LPS
HEADLOSS H-W

[TIMES]
DURATION 0

[END]
"""

for engine in ("EPANET_2_2", "WNTR"):
    result = run_model({
        "jobId": f"smoke-{engine.lower()}",
        "networkRevisionId": "smoke-revision",
        "engine": engine,
        "inp": INP,
        "demandModel": "DD",
        "durationSeconds": 0,
    })

    assert result["ok"] is True
    assert result["engine"] == engine
    assert result["networkRevisionId"] == "smoke-revision"
    assert result["governance"]["authenticNetworkModified"] is False
    assert result["governance"]["sourceNetworkWriteAllowed"] is False

    j1 = next(node for node in result["nodes"] if node["nodeId"] == "J1")
    p1 = next(link for link in result["links"] if link["featureId"] == "P1")

    assert j1["pressureHeadM"] is not None
    assert j1["pressureHeadM"] > 0
    assert p1["flowLps"] is not None
    assert abs(p1["flowLps"]) > 0

    print({
        "ok": True,
        "engine": engine,
        "pressureHeadM": j1["pressureHeadM"],
        "flowLps": p1["flowLps"],
    })
