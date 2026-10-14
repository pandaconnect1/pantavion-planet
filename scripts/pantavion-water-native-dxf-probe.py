#!/usr/bin/env python3
"""Read-only streaming scan of native-converted DXF. Never print private geometry."""
import json
import os
import sys
from collections import Counter

PATH = sys.argv[1]
SIZE = os.path.getsize(PATH)
section = None
expect_section = False
counts = Counter()
records = 0
eof_seen = False
coordinate_pair_tags = 0
MAX_LINE = 2_000_000

with open(PATH, "rb", buffering=1024 * 1024) as file:
    while True:
        code = file.readline()
        if not code:
            break
        val = file.readline()
        if not val:
            break
        records += 1
        if len(code) > MAX_LINE or len(val) > MAX_LINE:
            raise RuntimeError("DXF_OVERLONG_TAG")
        group = code.strip()
        value = val.strip()
        if expect_section and group == b"2":
            section = value
            expect_section = False
            continue
        if group == b"0":
            if value == b"SECTION":
                expect_section = True
                continue
            if value == b"ENDSEC":
                section = None
                continue
            if value == b"EOF":
                eof_seen = True
                break
            if section == b"ENTITIES":
                counts[value.decode("ascii", "replace")] += 1
        elif section == b"ENTITIES" and group in {
            b"10", b"11", b"12", b"13", b"20", b"21", b"22", b"23"
        }:
            coordinate_pair_tags += 1

geometry_types = ("LINE", "LWPOLYLINE", "POLYLINE", "ARC", "CIRCLE",
                  "ELLIPSE", "SPLINE", "INSERT", "POINT", "3DFACE")
found = sum(counts[t] for t in geometry_types)
diagnostic = {
    "stage": "native_dxf_stream_validation",
    "fileSizeBytes": SIZE,
    "tagPairs": records,
    "entityCounts": {key: counts[key] for key in geometry_types if counts[key]},
    "otherEntities": sum(counts.values()) - found,
    "coordinateTags": coordinate_pair_tags,
    "endOfFile": eof_seen,
    "geometryFound": found > 0,
}
print(json.dumps(diagnostic, ensure_ascii=True))
if not eof_seen or found < 1 or coordinate_pair_tags < 2:
    raise SystemExit("NATIVE_DXF_EMPTY_OR_TRUNCATED")
