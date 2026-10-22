import { extractAuthentic, aciColor, ocsTransform, apply } from "./water-cad-authentic-extract.mjs";
const assert = (c, m) => { if (!c) { console.error("FAIL", m); process.exitCode = 1; } else console.log("ok", m); };
assert(aciColor(1) === "#ff0000" && aciColor(11) === "#ff7f7f" && aciColor(12) === "#a50000" && aciColor(13) === "#a55252" && aciColor(20) === "#ff3f00" && aciColor(21) === "#ff9f7f" && aciColor(253) === "#adadad" && aciColor(7) === "aci7" && aciColor(140) === "#00bfff", "ACI table " + [11,12,13,20,21,140,253].map(aciColor).join(","));
const o = ocsTransform({ x: 0, y: 0, z: -1 });
const w = apply(o, { x: -204609, y: 342095 });
assert(Math.abs(w.x - 204609) < 1e-6 && Math.abs(w.y - 342095) < 1e-6, "OCS -Z mirrors X back to world " + JSON.stringify(w));
const db = {
  header: { LTSCALE: 2, LWDEFAULT: 25 },
  tables: {
    LAYER: { entries: [{ name: "0", colorIndex: 7, lineType: "Continuous", lineweight: 31 }, { name: "W-DP", colorIndex: 5, lineType: "DASHED", lineweight: 9 }, { name: "FROZ", colorIndex: 1, frozen: true, lineType: "Continuous", lineweight: 31 }] },
    LTYPE: { entries: [{ name: "DASHED", totalPatternLength: 0.75, pattern: [{ elementLength: 0.5 }, { elementLength: -0.25 }] }, { name: "UPVC", totalPatternLength: 26.5, pattern: [{ elementLength: 15 }, { elementLength: -0.8, text: "U", scale: 2.5, offsetY: -1.18 }, { elementLength: -10.7 }] }] },
    BLOCK_RECORD: { entries: [{ name: "SYM", basePoint: { x: 0, y: 0 }, entities: [{ type: "LINE", layer: "0", colorIndex: 0, lineType: "ByBlock", lineweight: 30, startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 0 } }, { type: "CIRCLE", layer: "0", colorIndex: 256, center: { x: 0, y: 0 }, radius: 1 }] }] },
  },
  entities: [
    { type: "LINE", layer: "W-DP", colorIndex: 256, lineType: "", lineweight: 29, lineTypeScale: 1, startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
    { type: "ARC", layer: "W-DP", colorIndex: 3, lineType: "UPVC", lineweight: 29, center: { x: -100, y: 50, z: 0 }, radius: 10, startAngle: 0, endAngle: Math.PI / 2, extrusionDirection: { x: 0, y: 0, z: -1 } },
    { type: "INSERT", layer: "W-DP", name: "SYM", colorIndex: 1, lineType: "ByLayer", lineweight: 10, insertionPoint: { x: 100, y: 100 }, xScale: 2, yScale: 2, rotation: Math.PI / 2 },
    { type: "LINE", layer: "FROZ", startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    { type: "HATCH", layer: "W-DP", solidFill: 1, boundaryPaths: [{ vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }] }] },
    { type: "HATCH", layer: "W-DP", solidFill: 0, patternName: "ANSI31", definitionLines: [{ angle: Math.PI / 4, base: { x: 0, y: 0 }, offset: { x: -0.5, y: 0.5 }, dashLengths: [] }], boundaryPaths: [{ vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }] }] },
    { type: "TEXT", layer: "W-DP", colorIndex: 2, text: "90 UPVC", startPoint: { x: 5, y: 5 }, textHeight: 1.5, rotation: 0.3, halign: 0, valign: 0, xScale: 1 },
    { type: "MTEXT", layer: "W-DP", text: "{\\fArial|b0;A}\\PB", insertionPoint: { x: 7, y: 7 }, textHeight: 2, attachmentPoint: 7, direction: { x: 1, y: 0 } },
    { type: "SOLID", layer: "W-DP", corner1: { x: 0, y: 0 }, corner2: { x: 1, y: 0 }, corner3: { x: 0, y: 1 }, corner4: { x: 1, y: 1 } },
  ],
};
const r = extractAuthentic(db);
const st = (i) => r.styles[i];
const line = r.segments[0];
assert(st(line[5]).c === "#0000ff" && st(line[5]).lt === "DASHED" && st(line[5]).lw === 35 && st(line[5]).lts === 2, "ByLayer colour/linetype/lineweight/LTSCALE " + JSON.stringify(st(line[5])));
const arc = r.segments.find((s) => st(s[5]).lt === "UPVC");
assert(arc && arc[0] >= 89.99 && arc[0] <= 100.01 && st(arc[5]).c === "#00ff00", "ARC with -Z extrusion lands at +X with own colour " + (arc && arc[0].toFixed(3)));
const arcSegs = r.segments.filter((s) => st(s[5]).lt === "UPVC");
assert(arcSegs[arcSegs.length - 1][6] > 15 && arcSegs[0][6] === 0, "linetype phase continues along the arc " + arcSegs[arcSegs.length - 1][6].toFixed(3));
const blockLine = r.segments.find((s) => Math.abs(s[0] - 100) < 1e-9 && Math.abs(s[1] - 100) < 1e-9 && Math.abs(s[3] - 102) < 1e-9);
assert(blockLine && st(blockLine[5]).c === "#ff0000" && st(blockLine[5]).lw === 40 && st(blockLine[5]).lts === 4, "ByBlock colour/lineweight from INSERT, rotated+scaled " + JSON.stringify(blockLine && st(blockLine[5])));
const circ = r.segments.filter((s) => s[4] === 1 && Math.hypot(s[0] - 100, s[1] - 100) > 1.99 && Math.hypot(s[0] - 100, s[1] - 100) < 2.01);
assert(circ.length > 10 && st(circ[0][5]).c === "#0000ff", "block child on layer 0 ByLayer takes INSERT's layer colour");
assert(r.layers[2].frozen === true, "frozen layer flagged (viewer hides it like AutoCAD)");
assert(r.fills.length === 2 && r.fills.some((f) => f[3][0].length === 8), "solid hatch + SOLID become fills");
const solid = r.fills.find((f) => f[3][0][2] === 1 && f[3][0][3] === 0);
assert(solid && solid[3][0][4] === 1 && solid[3][0][5] === 1, "SOLID corner order 1,2,4,3");
const hatchLines = r.segments.filter((s) => s[6] === -1 && Math.abs((s[3] - s[1]) / (s[2] - s[0]) - 1) < 1e-6);
assert(hatchLines.length >= 7 && hatchLines.every((s) => s[0] >= -1e-9 && s[2] <= 4 + 1e-9), "ANSI31 pattern lines clipped to boundary: " + hatchLines.length);
const tx = r.texts.find((t) => t[4] === "90 UPVC");
assert(tx && tx[5] === 1.5 && Math.abs(tx[6] - 0.3) < 1e-9 && r.styles[tx[3]].c === "#ffff00", "TEXT keeps height, rotation, colour");
const mt = r.texts.find((t) => t[4].includes("\n"));
assert(mt && mt[4] === "A\nB", "MTEXT keeps line break, strips font code: " + JSON.stringify(mt && mt[4]));
console.log(JSON.stringify(r.stats));


const orientation = r.blockRefs[0]?.[4];
assert(orientation && Math.abs(orientation.worldXAxis[0]) < 1e-9 && Math.abs(orientation.worldXAxis[1] - 2) < 1e-9 && orientation.waterFlowVerified === false, "block axis preserved as evidence without claiming hydraulic direction");
