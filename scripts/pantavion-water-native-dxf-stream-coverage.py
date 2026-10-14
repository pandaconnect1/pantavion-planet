#!/usr/bin/env python3
"""Read-only bounded-memory DXF geometry coverage audit. Never emit private coordinates.

This is an extraction-readiness gate, NOT a georeferencing or tile-publication step.
Only LINE and LWPOLYLINE segments are considered directly stream-extractable.
All block inserts, arcs, circles, polylines, splines, etc. remain unconverted and
must be resolved before any claim of complete engineering geometry coverage.
"""
import io
import json
import math
import sys
from collections import Counter

GEOMETRY = {b"LINE", b"LWPOLYLINE", b"POLYLINE", b"ARC", b"CIRCLE",
            b"ELLIPSE", b"SPLINE", b"INSERT", b"POINT", b"3DFACE"}
MAX_TAG_BYTES = 2_000_000


def scan(stream):
    section = None
    pending_section = False
    current_type = None
    tags = {}
    vertices = []
    pending_x = None
    entity_counts = Counter()
    extracted = Counter()
    bad_coordinates = 0
    bounds = [float("inf"), float("inf"), float("-inf"), float("-inf")]
    eof = False

    def coordinate(x, y):
        nonlocal bad_coordinates
        if not (math.isfinite(x) and math.isfinite(y)):
            bad_coordinates += 1
            return False
        bounds[0] = min(bounds[0], x)
        bounds[1] = min(bounds[1], y)
        bounds[2] = max(bounds[2], x)
        bounds[3] = max(bounds[3], y)
        return True

    def finish():
        nonlocal current_type, pending_x
        if current_type is None:
            return
        entity_counts[current_type.decode("ascii", "replace")] += 1
        if current_type == b"LINE":
            if all(k in tags for k in (b"10", b"20", b"11", b"21")):
                a = coordinate(tags[b"10"], tags[b"20"])
                b = coordinate(tags[b"11"], tags[b"21"])
                if a and b:
                    extracted["lineSegments"] += 1
        elif current_type == b"LWPOLYLINE":
            good = [p for p in vertices if coordinate(*p)]
            if len(good) > 1:
                extracted["lwPolylineSegments"] += len(good) - 1
                if int(tags.get(b"70", 0)) & 1:
                    extracted["lwPolylineSegments"] += 1
        elif current_type in (b"POINT", b"INSERT", b"CIRCLE", b"ARC"):
            if b"10" in tags and b"20" in tags:
                if coordinate(tags[b"10"], tags[b"20"]):
                    extracted["located" + current_type.decode("ascii")] += 1
        current_type = None
        tags.clear()
        vertices.clear()
        pending_x = None

    while True:
        code = stream.readline()
        if not code:
            break
        value = stream.readline()
        if not value:
            break
        if len(code) > MAX_TAG_BYTES or len(value) > MAX_TAG_BYTES:
            raise RuntimeError("DXF_TAG_EXCEEDS_LIMIT")
        code = code.strip()
        value = value.strip()
        if pending_section and code == b"2":
            section = value
            pending_section = False
            continue
        if code == b"0":
            finish()
            if value == b"SECTION":
                pending_section = True
            elif value == b"ENDSEC":
                section = None
            elif value == b"EOF":
                eof = True
                break
            elif section == b"ENTITIES":
                current_type = value
            continue
        if section != b"ENTITIES" or current_type not in GEOMETRY:
            continue
        if code not in (b"10", b"20", b"11", b"21", b"40", b"70"):
            continue
        try:
            number = float(value)
        except (ValueError, OverflowError):
            bad_coordinates += 1
            continue
        if not math.isfinite(number):
            bad_coordinates += 1
            continue
        if current_type == b"LWPOLYLINE":
            if code == b"10":
                pending_x = number
            elif code == b"20" and pending_x is not None:
                vertices.append((pending_x, number))
                pending_x = None
            elif code == b"70":
                tags[code] = number
        else:
            tags[code] = number
    finish()
    segment_count = extracted["lineSegments"] + extracted["lwPolylineSegments"]
    unconverted = {k: v for k, v in entity_counts.items()
                   if k not in ("LINE", "LWPOLYLINE") and v > 0}
    valid_bounds = all(math.isfinite(n) for n in bounds)
    result = {
        "stage": "native_dxf_stream_geometry_coverage",
        "ok": eof and segment_count > 0 and valid_bounds,
        "sourceCoordinateSpace": "source_cad",
        "geographicAlignmentVerified": False,
        "published": False,
        "streamExtractableSegments": segment_count,
        "lineSegments": extracted["lineSegments"],
        "lwPolylineSegments": extracted["lwPolylineSegments"],
        "locatedInsertsNotExpanded": extracted["locatedINSERT"],
        "locatedArcsNotSampled": extracted["locatedARC"],
        "locatedCirclesNotSampled": extracted["locatedCIRCLE"],
        "unconvertedEntityCounts": unconverted,
        "badNumericTags": bad_coordinates,
        "boundsPresent": valid_bounds,
        "endOfFile": eof,
        "completeEngineeringCoverageClaimed": False,
    }
    return result


def self_test():
    pairs = [
        ("0", "SECTION"), ("2", "ENTITIES"),
        ("0", "LINE"), ("8", "network"), ("10", "1"), ("20", "2"),
        ("11", "3"), ("21", "4"),
        ("0", "LWPOLYLINE"), ("90", "3"), ("70", "1"),
        ("10", "0"), ("20", "0"), ("10", "1"), ("20", "0"),
        ("10", "1"), ("20", "1"),
        ("0", "INSERT"), ("10", "2"), ("20", "3"),
        ("0", "ENDSEC"), ("0", "EOF"),
    ]
    fixture = "".join(f"{k}\n{v}\n" for k, v in pairs).encode("ascii")
    result = scan(io.BytesIO(fixture))
    assert result["ok"] and result["streamExtractableSegments"] == 4, result
    assert result["locatedInsertsNotExpanded"] == 1, result
    assert result["unconvertedEntityCounts"]["INSERT"] == 1, result
    assert not result["geographicAlignmentVerified"] and not result["published"], result
    print("native_dxf_stream_coverage_self_test_PASS")


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
    elif len(sys.argv) == 2:
        with open(sys.argv[1], "rb", buffering=1024 * 1024) as stream:
            outcome = scan(stream)
        print(json.dumps(outcome, separators=(",", ":"), ensure_ascii=True))
        if not outcome["ok"]:
            raise SystemExit("NATIVE_DXF_STREAM_GEOMETRY_COVERAGE_FAILED")
    else:
        raise SystemExit("usage: native-dxf-stream-coverage.py <path>|--self-test")
