import { NextRequest, NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Street names in the drawings are mostly Latin transliterations ("Leoforos
// Amathountos", "LIMNWN", "AGNOOUMENWN"), some Greek. A search is tried as typed
// and in the spellings the drawings use, both ways, accents ignored.
const GREEK_DIGRAPHS: Array<[string, string[]]> = [
  ["ΟΥ", ["OU"]], ["ΑΙ", ["AI", "E"]], ["ΕΙ", ["EI", "I"]], ["ΟΙ", ["OI", "I"]],
  ["ΑΥ", ["AV", "AF"]], ["ΕΥ", ["EV", "EF"]], ["ΜΠ", ["MP", "B"]], ["ΝΤ", ["NT", "D"]],
  ["ΓΚ", ["GK", "G"]], ["ΓΓ", ["NG", "GG"]], ["ΤΣ", ["TS"]], ["ΤΖ", ["TZ"]],
];
const GREEK_LETTERS: Record<string, string[]> = {
  Α: ["A"], Β: ["V"], Γ: ["G", "Y"], Δ: ["D"], Ε: ["E"], Ζ: ["Z"], Η: ["I", "H"], Θ: ["TH"],
  Ι: ["I"], Κ: ["K"], Λ: ["L"], Μ: ["M"], Ν: ["N"], Ξ: ["X", "KS"], Ο: ["O"], Π: ["P"],
  Ρ: ["R"], Σ: ["S"], Τ: ["T"], Υ: ["Y", "I"], Φ: ["F", "PH"], Χ: ["CH", "X", "H"], Ψ: ["PS"], Ω: ["O", "W"],
};

function plainUpper(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/Σ|ς/g, "Σ");
}

// A few Latin spellings of a Greek search: the first choice for every letter,
// then the drawings' common alternatives (Ω→W, Η→H, Υ→I…), one at a time.
function latinSpellings(greek: string): string[] {
  const parts: string[][] = [];
  const g = plainUpper(greek);
  for (let i = 0; i < g.length; ) {
    const pair = GREEK_DIGRAPHS.find(([k]) => g.startsWith(k, i));
    if (pair) { parts.push(pair[1]); i += 2; continue; }
    parts.push(GREEK_LETTERS[g[i]] ?? [g[i]]);
    i += 1;
  }
  const base = parts.map((p) => p[0]);
  const out = new Set([base.join("")]);
  parts.forEach((p, i) => p.slice(1).forEach((alt) => {
    if (out.size < 8) { const v = [...base]; v[i] = alt; out.add(v.join("")); }
  }));
  // All-alternative variant for words like ΑΓΝΟΟΥΜΕΝΩΝ → AGNOOUMENWN.
  out.add(parts.map((p) => (p.includes("W") ? "W" : p[0])).join(""));
  return [...out];
}

function searchTerms(q: string): string[] {
  // As typed, and without accents ("Σουλίου" → "ΣΟΥΛΙΟΥ" as the drawings write it).
  const terms = new Set([q, plainUpper(q)]);
  if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(q)) for (const t of latinSpellings(q)) terms.add(t);
  return [...terms].slice(0, 10);
}

const KINDS = new Set(["valve", "air_valve", "hydrant", "pressure_reducing_valve", "tank"]);
const PAGE = 500;

// Network register (areas and numbered assets from the authentic Map B DWG).
// Same device/role gate as the water maps; rows are read with the service
// role and never exposed without that gate.
export async function GET(request: NextRequest) {
  const access = await authorizeWaterMapRequest(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error, dataReturned: false },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const params = request.nextUrl.searchParams;
  const view = params.get("view") || "assets";
  const admin = createAdminClient();

  try {
    if (view === "areas") {
      const withRing = params.get("ring") === "1";
      const { data, error } = await admin
        .from("water_network_areas")
        .select(withRing
          ? "code, layer, outline, area_m2, centroid_x, centroid_y, bounds, ring, group_name"
          : "code, layer, outline, area_m2, centroid_x, centroid_y, bounds, group_name")
        .order("code");
      if (error) throw error;
      const counts = await admin.rpc("pantavion_water_register_counts");
      return NextResponse.json(
        { ok: true, areas: data ?? [], counts: counts.error ? null : counts.data },
        { headers: { "Cache-Control": "private, max-age=60" } },
      );
    }

    let query = admin
      .from("water_network_assets")
      .select("number, kind, dn, x, y, layer, area_code, street, street_distance, tag, name, capacity_m3, proposed, origin", { count: "exact" });

    const area = params.get("area");
    if (area) query = area === "none" ? query.is("area_code", null) : query.eq("area_code", area);
    const kind = params.get("kind");
    if (kind && KINDS.has(kind)) query = query.eq("kind", kind);
    const street = params.get("street");
    if (street) query = query.eq("street", street);
    const q = (params.get("q") || "").trim().replace(/[%,()]/g, " ").slice(0, 60);
    if (q) {
      const clauses = searchTerms(q).flatMap((t) => [
        `street.ilike.%${t}%`, `name.ilike.%${t}%`,
      ]);
      clauses.push(`number.ilike.%${q}%`, `tag.ilike.%${q}%`);
      query = query.or(clauses.join(","));
    }

    // Only when all four bounds are sent: Number(null) is 0, and a missing
    // bound must not turn into a box at the origin that matches nothing.
    const bboxKeys = ["minX", "minY", "maxX", "maxY"];
    const bbox = bboxKeys.map((k) => Number(params.get(k)));
    if (bboxKeys.every((k) => (params.get(k) ?? "").trim() !== "") && bbox.every(Number.isFinite)) {
      query = query.gte("x", bbox[0]).lte("x", bbox[2]).gte("y", bbox[1]).lte("y", bbox[3]);
    }

    const offset = Math.max(0, Math.min(1_000_000, Number(params.get("offset")) || 0));
    const limit = Math.max(1, Math.min(PAGE * 4, Number(params.get("limit")) || PAGE));
    const { data, error, count } = await query
      .order("area_code", { ascending: true, nullsFirst: false })
      .order("street", { ascending: true, nullsFirst: false })
      .order("number", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return NextResponse.json(
      { ok: true, total: count ?? 0, offset, limit, assets: data ?? [] },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "REGISTER_READ_FAILED", message: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error) },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
