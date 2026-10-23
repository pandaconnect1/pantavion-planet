"""Inspect the licensed Cyprus Post workbook; preserve source rows before mapping."""
import hashlib
import io
import json
import pathlib
import urllib.request
import zipfile
import xml.etree.ElementTree as ET

URL = "https://www.data.gov.cy/sites/default/files/postal_codes%20%2870%29.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
request = urllib.request.Request(URL, headers={"User-Agent": "Pantavion-Water-Source-Import/1.0"})
with urllib.request.urlopen(request, timeout=60) as response:
    raw = response.read(12000000)
if not raw.startswith(b"PK"):
    raise RuntimeError("postal_source_is_not_xlsx")
archive = zipfile.ZipFile(io.BytesIO(raw))
strings = []
if "xl/sharedStrings.xml" in archive.namelist():
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = ["".join(node.itertext()) for node in root.findall("m:si", NS)]
sheets = []
for name in archive.namelist():
    if not name.startswith("xl/worksheets/sheet") or not name.endswith(".xml"):
        continue
    rows = []
    for row in ET.fromstring(archive.read(name)).findall(".//m:sheetData/m:row", NS):
        cells = {}
        for cell in row.findall("m:c", NS):
            node = cell.find("m:v", NS)
            value = node.text if node is not None and node.text else ""
            if cell.attrib.get("t") == "s":
                value = strings[int(value)] if value else ""
            if cell.attrib.get("t") == "inlineStr":
                value = "".join(cell.find("m:is", NS).itertext())
            if value.strip():
                cells[cell.attrib["r"].rstrip("0123456789")] = value.strip()
        if cells:
            rows.append({"row": int(row.attrib["r"]), "cells": cells})
    candidates = [r for r in rows if any(str(v).upper() in ("ΛΕΜΕΣΟΣ", "LEMESOS", "LIMASSOL") for v in r["cells"].values())]
    print(json.dumps({"sheet": name, "rowCount": len(rows), "firstRows": rows[:5], "candidateCount": len(candidates), "samples": candidates[:3]}, ensure_ascii=False))
    if candidates:
        sheets.append({"sheet": name, "headers": rows[:8], "rows": candidates})
if not sheets:
    raise RuntimeError("limassol_rows_not_found")
data = {"sourceUrl": URL, "datasetUrl": "https://www.data.gov.cy/en/dataset/385", "publisher": "Cyprus Post / Department of Postal Services", "license": "CC BY 4.0", "publishedAt": "2024-09-18", "sha256": hashlib.sha256(raw).hexdigest(), "sheets": sheets}
pathlib.Path("data/water").mkdir(parents=True, exist_ok=True)
pathlib.Path("data/water/limassol-postal-source-2024.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
