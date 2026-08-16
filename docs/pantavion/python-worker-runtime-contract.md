# Pantavion PATCH 8R - Python Worker Runtime Contract

Status: internal contract foundation

This patch defines the controlled Python worker runtime contract for Pantavion processing.

## Processing scope

- Excel / XLSX
- CSV
- PDF text extraction
- PDF OCR extraction
- Word / DOCX text extraction
- Image OCR extraction
- GIS spatial index
- CAD / DWG text index sidecars
- SHA256 verification
- Telemetry time-series profiling
- Hydraulic / EPANET preparation

## Locked rules

- Original DWG is never mutated.
- Original artifacts are never edited by Python workers.
- Python outputs must be sidecar files only.
- Sidecar outputs may include metadata JSON, text index JSONL, OCR index JSONL, table extraction JSON, spatial index JSON, SHA256 report JSON, telemetry profile JSON and hydraulic prepare JSON.
- This patch registers and assesses worker jobs only. It does not execute Python code yet.
- Real execution requires future sandbox, queue, timeout, retry, resource limits, audit and approval gates.
- Source-truth, sensitive, CAD/DWG, production and hydraulic jobs require founder approval.
- No SCADA write.
- No physical infrastructure control.

## Runtime surface

- GET /api/kernel/python-worker-runtime
- POST /api/kernel/python-worker-runtime

## POST assess example

{
  "mode": "assess",
  "jobKind": "cad_text_index",
  "artifactId": "water_master_b_c_original_dwg",
  "filename": "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "extension": "dwg",
  "sourceTruth": true,
  "privateStorageVerified": true,
  "founderApproved": false
}

## POST register example

{
  "mode": "register",
  "jobKind": "pdf_text_extract",
  "artifactId": "report-001",
  "filename": "inspection-report.pdf",
  "extension": "pdf",
  "privateStorageVerified": true,
  "founderApproved": false
}

## State file

data/kernel/python-worker-runtime-jobs.json

## Audit file

data/kernel/python-worker-runtime-audit.jsonl
