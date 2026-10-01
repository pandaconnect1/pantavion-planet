from __future__ import annotations

import hmac
import json
import os
import sys
import tempfile
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import wntr

SERVICE = "pantavion-water-engineering-worker"
MAX_BODY_BYTES = int(os.environ.get("PANTAVION_WATER_WORKER_MAX_BODY_BYTES", str(16 * 1024 * 1024)))
TOKEN = os.environ.get("PANTAVION_WATER_ENGINEERING_WORKER_TOKEN", "").strip()
ALLOW_LOCAL = os.environ.get("PANTAVION_ALLOW_LOCAL_WATER_WORKER", "").lower() == "true"

if not TOKEN and not ALLOW_LOCAL:
    raise RuntimeError("PANTAVION_WATER_ENGINEERING_WORKER_TOKEN is required")
if TOKEN and len(TOKEN) < 32:
    raise RuntimeError("PANTAVION_WATER_ENGINEERING_WORKER_TOKEN must be at least 32 characters")

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def finite_float(value: Any) -> float | None:
    if value is None:
        return None
    result = float(value)
    if result != result or result in (float("inf"), float("-inf")):
        return None
    return result

def require_string(payload: dict[str, Any], key: str, max_len: int = 256) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value or len(value) > max_len:
        raise ValueError(f"{key}_invalid")
    return value

def authorize(header: str | None) -> bool:
    if ALLOW_LOCAL and not TOKEN:
        return True
    expected = f"Bearer {TOKEN}"
    return bool(header) and hmac.compare_digest(header, expected)

def final_frame(table: Any, key: str):
    frame = table.get(key)
    if frame is None or len(frame.index) == 0:
        return None, None
    t = frame.index[-1]
    return t, frame.loc[t]

def run_model(payload: dict[str, Any]) -> dict[str, Any]:
    job_id = require_string(payload, "jobId")
    network_revision_id = require_string(payload, "networkRevisionId")
    engine = require_string(payload, "engine", 32)
    inp = payload.get("inp")
    if not isinstance(inp, str) or not inp.strip():
        raise ValueError("inp_required")
    if len(inp.encode("utf-8")) > MAX_BODY_BYTES:
        raise ValueError("inp_too_large")

    if engine not in {"EPANET_2_2", "WNTR"}:
        raise ValueError("engine_unsupported")

    demand_model = payload.get("demandModel", "DD")
    if demand_model not in {"DD", "DDA", "PDD", "PDA"}:
        raise ValueError("demand_model_invalid")

    duration_seconds = payload.get("durationSeconds")
    if duration_seconds is not None:
        if not isinstance(duration_seconds, int) or duration_seconds < 0 or duration_seconds > 31 * 24 * 3600:
            raise ValueError("duration_seconds_invalid")

    hydraulic_timestep = payload.get("hydraulicTimestepSeconds")
    if hydraulic_timestep is not None:
        if not isinstance(hydraulic_timestep, int) or hydraulic_timestep <= 0 or hydraulic_timestep > 24 * 3600:
            raise ValueError("hydraulic_timestep_invalid")

    started_at = utc_now()
    started_monotonic = time.monotonic()

    with tempfile.TemporaryDirectory(prefix="pantavion-water-") as tmp:
        tmp_path = Path(tmp)
        inp_path = tmp_path / "model.inp"
        inp_path.write_text(inp, encoding="utf-8")

        network = wntr.network.WaterNetworkModel(str(inp_path))
        network.options.hydraulic.demand_model = demand_model
        if duration_seconds is not None:
            network.options.time.duration = duration_seconds
        if hydraulic_timestep is not None:
            network.options.time.hydraulic_timestep = hydraulic_timestep
            network.options.time.report_timestep = hydraulic_timestep

        if engine == "EPANET_2_2":
            simulator = wntr.sim.EpanetSimulator(network)
            results = simulator.run_sim(
                file_prefix=str(tmp_path / "epanet"),
                version=2.2,
                convergence_error=True,
            )
            engine_version = "2.2"
        else:
            simulator = wntr.sim.WNTRSimulator(network)
            results = simulator.run_sim(convergence_error=True)
            engine_version = str(wntr.__version__)

        pressure_t, pressure = final_frame(results.node, "pressure")
        head_t, head = final_frame(results.node, "head")
        demand_t, demand = final_frame(results.node, "demand")
        flow_t, flow = final_frame(results.link, "flowrate")
        velocity_t, velocity = final_frame(results.link, "velocity")
        headloss_t, headloss = final_frame(results.link, "headloss")
        status_t, status = final_frame(results.link, "status")

        candidate_times = [
            t for t in [pressure_t, head_t, demand_t, flow_t, velocity_t, headloss_t, status_t]
            if t is not None
        ]
        final_time_seconds = int(max(candidate_times)) if candidate_times else 0

        node_ids = list(network.node_name_list)
        link_ids = list(network.link_name_list)

        nodes = []
        for node_id in node_ids:
            nodes.append({
                "nodeId": node_id,
                "pressureHeadM": finite_float(pressure.get(node_id)) if pressure is not None and node_id in pressure else None,
                "hydraulicHeadM": finite_float(head.get(node_id)) if head is not None and node_id in head else None,
                "demandLps": (
                    finite_float(demand.get(node_id) * 1000.0)
                    if demand is not None and node_id in demand
                    else None
                ),
            })

        links = []
        for link_id in link_ids:
            raw_status = status.get(link_id) if status is not None and link_id in status else None
            links.append({
                "featureId": link_id,
                "flowLps": (
                    finite_float(flow.get(link_id) * 1000.0)
                    if flow is not None and link_id in flow
                    else None
                ),
                "velocityMps": finite_float(velocity.get(link_id)) if velocity is not None and link_id in velocity else None,
                "headlossM": finite_float(headloss.get(link_id)) if headloss is not None and link_id in headloss else None,
                "status": str(raw_status) if raw_status is not None else None,
            })

    return {
        "ok": True,
        "jobId": job_id,
        "networkRevisionId": network_revision_id,
        "engine": engine,
        "engineVersion": engine_version,
        "wntrVersion": str(wntr.__version__),
        "simulationStartedAt": started_at,
        "simulationFinishedAt": utc_now(),
        "elapsedMs": int((time.monotonic() - started_monotonic) * 1000),
        "finalTimeSeconds": final_time_seconds,
        "nodes": nodes,
        "links": links,
        "warnings": [],
        "governance": {
            "authenticNetworkModified": False,
            "sourceNetworkWriteAllowed": False,
            "resultIsAnalysisArtifact": True,
        },
        "units": {
            "pressureHead": "m",
            "hydraulicHead": "m",
            "demand": "L/s",
            "flow": "L/s",
            "velocity": "m/s",
            "headloss": "m",
        },
    }

class Handler(BaseHTTPRequestHandler):
    server_version = "PantavionWaterEngineering/1"

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write(json.dumps({
            "service": SERVICE,
            "message": fmt % args,
        }) + "\n")

    def send_json(self, status: int, body: dict[str, Any]) -> None:
        raw = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Pantavion-Water-Worker", "v1")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_json(404, {"ok": False, "error": "not_found"})
            return
        self.send_json(200, {
            "ok": True,
            "service": SERVICE,
            "wntrVersion": str(wntr.__version__),
            "engines": ["EPANET_2_2", "WNTR"],
            "sourceNetworkWriteAllowed": False,
        })

    def do_POST(self) -> None:
        if self.path != "/run":
            self.send_json(404, {"ok": False, "error": "not_found"})
            return
        if not authorize(self.headers.get("Authorization")):
            self.send_json(401, {"ok": False, "error": "unauthorized"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"ok": False, "error": "content_length_invalid"})
            return
        if length <= 0 or length > MAX_BODY_BYTES:
            self.send_json(413, {"ok": False, "error": "request_too_large_or_empty"})
            return

        try:
            raw = self.rfile.read(length)
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError("json_object_required")
            result = run_model(payload)
            self.send_json(200, result)
        except ValueError as exc:
            self.send_json(400, {"ok": False, "error": str(exc)})
        except Exception as exc:
            self.log_message("simulation_failed:%s", type(exc).__name__)
            self.send_json(422, {
                "ok": False,
                "error": "hydraulic_simulation_failed",
                "errorType": type(exc).__name__,
            })

def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(json.dumps({
        "ok": True,
        "service": SERVICE,
        "port": port,
        "wntrVersion": str(wntr.__version__),
        "sourceNetworkWriteAllowed": False,
    }), flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
