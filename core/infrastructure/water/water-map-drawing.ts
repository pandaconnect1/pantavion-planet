export type DrawingPoint = [number, number];
export type DrawingTool = "navigate" | "line" | "polygon" | "arrow" | "text" | "symbol";
export type DrawingStyle = { color: string; width: number; dashed: boolean; text: string; symbol: string };
export type DrawingShape = { id: string; tool: Exclude<DrawingTool, "navigate">; points: DrawingPoint[]; style: DrawingStyle; status: string };
export const WATER_DRAWING_SYMBOLS: Record<string, string> = { valve: "⊗", hydrant: "H", meter: "M", tank: "▣", fault: "⚠", repair: "◆" };

export function drawingGeometry(tool: DrawingTool, points: DrawingPoint[], sourceKey: string | null) {
  if (points.some((p) => p.length !== 2 || !p.every(Number.isFinite))) throw new Error("Μη έγκυρη θέση.");
  if (points.length > 500) throw new Error("Επιτρέπονται έως 500 σημεία ανά σχέδιο.");
  if (!sourceKey && points.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90)) throw new Error("Μη έγκυρη γεωγραφική θέση.");
  const crs = sourceKey ? { authority: "LOCAL" as const, code: sourceKey } : { authority: "EPSG" as const, code: "4326" };
  if (tool === "text" || tool === "symbol") {
    if (points.length !== 1) throw new Error("Επίλεξε ένα σημείο στον χάρτη.");
    return { type: "Point" as const, coordinates: points[0], crs };
  }
  const unique = new Set(points.map((p) => p.join(","))).size;
  if (tool === "polygon") {
    if (unique < 3) throw new Error("Το περίγραμμα χρειάζεται τουλάχιστον τρία διαφορετικά σημεία.");
    return { type: "Polygon" as const, coordinates: [[...points, points[0]]], crs };
  }
  if (tool === "navigate" || unique < 2) throw new Error("Η γραμμή χρειάζεται τουλάχιστον δύο διαφορετικά σημεία.");
  return { type: "LineString" as const, coordinates: points, crs };
}

export function patchDrawing(row: Record<string, unknown>, sourceKey: string | null): DrawingShape | null {
  const geometry = row.geometry as { type?: string; coordinates?: unknown; crs?: { authority?: string; code?: string } } | null;
  const attributes = row.attributes as Record<string, unknown> | null;
  const drawing = attributes?.drawing as Partial<DrawingShape> | undefined;
  if (!geometry || !drawing || !["line", "polygon", "arrow", "text", "symbol"].includes(drawing.tool || "")) return null;
  if (sourceKey ? geometry.crs?.authority !== "LOCAL" || geometry.crs.code !== sourceKey : geometry.crs?.authority !== "EPSG" || geometry.crs.code !== "4326") return null;
  const raw = geometry.type === "Point" ? [geometry.coordinates] : geometry.type === "Polygon" ? (geometry.coordinates as unknown[])?.[0] : geometry.coordinates;
  if (!Array.isArray(raw) || raw.length > 501 || !raw.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n)))) return null;
  const style = drawing.style;
  return { id: String(row.patch_id), tool: drawing.tool as DrawingShape["tool"], points: raw as DrawingPoint[], status: String(row.status), style: {
    color: /^#[0-9a-f]{6}$/i.test(style?.color || "") ? style!.color : "#fbbf24",
    width: Math.max(1, Math.min(10, Number(style?.width) || 3)), dashed: Boolean(style?.dashed),
    text: String(style?.text || "").slice(0, 300), symbol: style?.symbol && style.symbol in WATER_DRAWING_SYMBOLS ? style.symbol : "valve",
  } };
}

export function drawWaterAnnotation(ctx: CanvasRenderingContext2D, shape: DrawingShape, project: (point: DrawingPoint) => DrawingPoint) {
  if (!shape.points.length) return;
  const points = shape.points.map(project);
  ctx.save();
  ctx.strokeStyle = shape.style.color;
  ctx.fillStyle = shape.style.color;
  ctx.lineWidth = shape.style.width;
  ctx.setLineDash(shape.style.dashed || shape.status === "pending_review" ? [8, 5] : []);
  if (shape.tool === "symbol" || shape.tool === "text") {
    ctx.font = `bold ${shape.tool === "symbol" ? 24 : 16}px Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(shape.tool === "symbol" ? WATER_DRAWING_SYMBOLS[shape.style.symbol] || "⊗" : shape.style.text, points[0][0], points[0][1]);
  } else {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (shape.tool === "polygon") ctx.closePath();
    ctx.stroke();
    if (shape.tool === "arrow" && points.length > 1) {
      const [a, b] = points.slice(-2);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(b[0] - 14 * Math.cos(angle - 0.5), b[1] - 14 * Math.sin(angle - 0.5));
      ctx.lineTo(...b);
      ctx.lineTo(b[0] - 14 * Math.cos(angle + 0.5), b[1] - 14 * Math.sin(angle + 0.5));
      ctx.stroke();
    }
  }
  if (shape.status === "pending_review") {
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.fillText("Προς έγκριση", points[0][0] + 10, points[0][1] + 22);
  }
  ctx.restore();
}
