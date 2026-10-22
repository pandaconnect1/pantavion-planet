import { NextRequest, NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { waterRegisterNumberCandidates, waterRegisterAlternateStreetOrder } from "@/core/infrastructure/water/water-register-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Street names in the drawings come in Greek capitals or lower case, Latin
// transliterations ("LIMNWN", "Leoforos Amathountos") and some English
// ("104th Street Parodos"). Searches meet them on street_key (capitals, no
// Greek accents), as typed and in the other alphabet's usual spellings.
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
const LATIN_DIGRAPHS: Array<[string, string[]]> = [
  ["OU", ["ΟΥ"]], ["TH", ["Θ"]], ["CH", ["Χ"]], ["PS", ["Ψ"]], ["KS", ["Ξ"]], ["PH", ["Φ"]],
  ["MP", ["ΜΠ"]], ["NT", ["ΝΤ"]], ["TS", ["ΤΣ"]], ["TZ", ["ΤΖ"]], ["AI", ["ΑΙ"]], ["EI", ["ΕΙ"]], ["OI", ["ΟΙ"]],
];
const LATIN_LETTERS: Record<string, string[]> = {
  A: ["Α"], B: ["Β", "ΜΠ"], C: ["Κ"], D: ["Δ", "ΝΤ"], E: ["Ε"], F: ["Φ"], G: ["Γ"], H: ["Η", "Χ"],
  I: ["Ι", "Η", "Υ"], J: ["ΤΖ"], K: ["Κ"], L: ["Λ"], M: ["Μ"], N: ["Ν"], O: ["Ο", "Ω"], P: ["Π"],
  Q: ["Κ"], R: ["Ρ"], S: ["Σ"], T: ["Τ"], U: ["ΟΥ"], V: ["Β"], W: ["Ω"], X: ["Ξ", "Χ"], Y: ["Υ", "Γ"], Z: ["Ζ"],
};
// Words that only say "street" or "avenue" are left out of the match.
// (\b is ASCII-only in JavaScript, so word edges are spaces or the ends.)
const GENERIC_WORDS = /(^|\s)(ΟΔΟΣ|ΟΔ|ΛΕΩΦΟΡΟΣ|ΛΕΩΦ|ODOS|OD|STREET|STR|ST|AVENUE|AVE|LEOFOROS|LEOF|ROAD|RD)\.?(?=\s|$)/g;

function streetKey(text: string) {
  return text
    .replace(/[άέήίόύώϊϋΐΰΆΈΉΊΌΎΏς]/g, (c) => "αεηιουωιυιυΑΕΗΙΟΥΩσ"["άέήίόύώϊϋΐΰΆΈΉΊΌΎΏς".indexOf(c)])
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// The first spelling of every letter, then each common alternative one at a time.
function spellings(key: string, digraphs: Array<[string, string[]]>, letters: Record<string, string[]>): string[] {
  const parts: string[][] = [];
  for (let i = 0; i < key.length; ) {
    const pair = digraphs.find(([k]) => key.startsWith(k, i));
    if (pair) { parts.push(pair[1]); i += 2; continue; }
    parts.push(letters[key[i]] ?? [key[i]]);
    i += 1;
  }
  const base = parts.map((p) => p[0]);
  const out = new Set([base.join("")]);
  parts.forEach((p, i) => p.slice(1).forEach((alt) => {
    if (out.size < 8) { const v = [...base]; v[i] = alt; out.add(v.join("")); }
  }));
  if (parts.some((p) => p.includes("W"))) out.add(parts.map((p) => (p.includes("W") ? "W" : p[0])).join(""));
  return [...out];
}

function searchTerms(q: string): string[] {
  const full = streetKey(q).replace(/\s+/g, " ").trim();
  const core = full.replace(GENERIC_WORDS, " ").replace(/\s+/g, " ").trim() || full;
  const terms = new Set([core]);
  if (/[\u0370-\u03ff]/.test(core)) for (const t of spellings(core, GREEK_DIGRAPHS, GREEK_LETTERS)) terms.add(t);
  else if (/[A-Z]/.test(core)) for (const t of spellings(core, LATIN_DIGRAPHS, LATIN_LETTERS)) terms.add(t);
  // Users often enter the street's family name first instead of the original
  // DWG order (e.g. "Κυπριανού Σπύρου" vs "Spyrou Kyprianou").
  const withAlternateOrder = new Set(terms);
  for (const spelling of terms) {
    const reversed = waterRegisterAlternateStreetOrder(spelling);
    if (reversed) withAlternateOrder.add(reversed);
  }
  return [...withAlternateOrder].filter(Boolean).slice(0, 28);
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
    if (view === "discovery") {
      const sourceSha256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";
      const file = await admin.storage.from("personal-media").download(`water-network-private/derived/map-b/${sourceSha256}/discovery.json`);
      if (file.error || !file.data) throw new Error("discovery_unavailable");
      const report = JSON.parse(await file.data.text());
      if (report.sourceSha256 !== sourceSha256) throw new Error("discovery_source_mismatch");
      const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("el-GR");
      const tokens = normalize((params.get("q") || "").slice(0, 120)).split(/\s+/).filter(Boolean);
      const category = (params.get("category") || "").slice(0, 50);
      type EvidenceRow = { category: string; label: string; layer: string; ref: string; off: boolean; frozen: boolean; registerNumbers: string[] };
      const rows = (report.items ?? []).filter((row: EvidenceRow) =>
        (!category || row.category === category) &&
        (params.get("hidden") !== "1" || row.off || row.frozen) &&
        (params.get("unmatched") !== "1" || !row.registerNumbers.length) &&
        tokens.every((token) => normalize([row.label,row.layer,row.ref,...row.registerNumbers].join(" ")).includes(token)),
      );
      const offset = Math.max(0, Math.floor(Number(params.get("offset")) || 0));
      const limit = Math.max(1, Math.min(200, Math.floor(Number(params.get("limit")) || 100)));
      return NextResponse.json({ ok:true, sourceSha256, createdAt:report.createdAt, truth:report.truth,
        summary:report.summary, extractorStats:report.extractorStats, layers:report.layers,
        sykamCandidateRefs:report.sykamCandidateRefs, total:rows.length,offset,items:rows.slice(offset,offset+limit),
      }, { headers:{"Cache-Control":"private, no-store"} });
    }

    if (view === "supply-evidence") {
      const sourceSha256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";
      const file = await admin.storage.from("personal-media").download(
        `water-network-private/derived/map-b/${sourceSha256}/inventory.json`,
      );
      if (file.error || !file.data) throw new Error("supply_inventory_unavailable");
      const inventory = JSON.parse(await file.data.text());
      if (inventory.sourceSha256 !== sourceSha256) throw new Error("supply_inventory_source_mismatch");
      return NextResponse.json({
        ok: true, sourceSha256,
        totals: inventory.totals,
        coverage: inventory.coverage ?? { directionOfWaterFlowVerified: false, supplyAreasVerified: false },
        hiddenLayers: (inventory.layers ?? []).filter((l: { sourceOff?: boolean; sourceFrozen?: boolean }) => l.sourceOff || l.sourceFrozen),
        tanks: (inventory.register?.assets ?? []).filter((a: { kind: string }) => a.kind === "tank"),
        flowEvidence: inventory.flowEvidence ?? { labelCandidates: [], symbolCandidates: [], verifiedConnections: [] },
        fullCoverageVerified: false,
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (view === "streets") {
      const offset = Math.max(0, Math.floor(Number(params.get("offset")) || 0));
      const limit = Math.max(1, Math.min(500, Math.floor(Number(params.get("limit")) || 200)));
      let streets = admin.from("pantavion_cyprus_streets")
        .select("id, name_el, name_lat, district_name, municipality_or_community, area_or_parish, zone_or_section, source, status", { count: "exact" })
        .in("district_name", ["Lemesos", "Limassol", "Λεμεσός", "ΛΕΜΕΣΟΣ"]);
      const q = (params.get("q") || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
      const locality = (params.get("locality") || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 100);
      // Each word may occur in a different address field: street + village works.
      for (const token of q.split(/\s+/).filter(Boolean)) {
        const variants = searchTerms(token);
        streets = streets.or(["name_el", "name_lat", "municipality_or_community", "area_or_parish", "zone_or_section"]
          .flatMap((column) => variants.map((term) => `${column}.ilike.%${term}%`)).join(","));
      }
      for (const token of locality.split(/\s+/).filter(Boolean)) {
        streets = streets.or(["municipality_or_community", "area_or_parish"]
          .flatMap((column) => searchTerms(token).map((term) => `${column}.ilike.%${term}%`)).join(","));
      }
      const result = await streets.order("municipality_or_community", { nullsFirst: false })
        .order("area_or_parish", { nullsFirst: false }).order("zone_or_section", { nullsFirst: false })
        .order("name_el", { nullsFirst: false }).order("name_lat", { nullsFirst: false }).order("id")
        .range(offset, offset + limit - 1);
      if (result.error) throw result.error;
      return NextResponse.json({ ok: true, streets: result.data ?? [], total: result.count ?? 0, offset,
        coverage: "recorded_only", fullCoverageVerified: false }, { headers: { "Cache-Control": "private, no-store" } });
    }

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
    const zone = (params.get("zone") || "").trim().slice(0, 100);
    if (zone) {
      const zoneAreas = await admin.from("water_network_areas").select("code").eq("group_name", zone).limit(1000);
      if (zoneAreas.error) throw zoneAreas.error;
      const codes = (zoneAreas.data ?? []).map((row: { code: string }) => row.code);
      if (!codes.length) return NextResponse.json({ ok: true, total: 0, offset: 0, limit: PAGE, assets: [] }, { headers: { "Cache-Control": "no-store" } });
      query = query.in("area_code", codes);
    }
    const kind = params.get("kind");
    if (kind && KINDS.has(kind)) query = query.eq("kind", kind);
    const street = params.get("street");
    if (street) {
      const cleanedStreet = street.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
      if (cleanedStreet) query = query.or(searchTerms(cleanedStreet).map((t) => `street_key.ilike.%${t}%`).join(","));
    }
    const sv = (params.get("sv") || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
    if (sv) {
      const rawNumber = sv.replace(/^SV[\s-]*/i, "");
      const tags = [...new Set([sv, rawNumber, `SV${rawNumber}`, `SV ${rawNumber}`, `SV-${rawNumber}`])];
      const clauses = tags.map((tag) => `tag.ilike.${tag}`);
      clauses.push(`number.ilike.${sv}`);
      for (const candidate of waterRegisterNumberCandidates(sv)) clauses.push(`number.eq.${candidate}`);
      query = query.or(clauses.join(","));
    }
    const q = (params.get("q") || "")
      .trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
      .slice(0, 60);
    if (q) {
      const clauses = searchTerms(q).flatMap((t) => [
        `street_key.ilike.%${t}%`, `name.ilike.%${t}%`,
      ]);
      clauses.push(`number.ilike.%${q}%`, `tag.ilike.%${q}%`, `area_code.ilike.%${q}%`);
      const matchingAreas = await admin.from("water_network_areas").select("code")
        .ilike("group_name", `%${q}%`).limit(1000);
      if (matchingAreas.error) throw matchingAreas.error;
      for (const row of matchingAreas.data ?? []) {
        // Only safe codes may enter the raw PostgREST OR expression.
        if (/^[\p{L}\p{N}-]+$/u.test(row.code)) clauses.push(`area_code.eq.${row.code}`);
      }
      for (const canonicalNumber of waterRegisterNumberCandidates(q)) {
        clauses.push(`number.eq.${canonicalNumber}`);
      }
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
    // Order before pagination; number is the unique, stable tie breaker.
    const sort = params.get("sort");
    const columns = sort === "number" ? ["number"]
      : sort === "street" ? ["street", "area_code", "number"]
      : ["area_code", "street", "number"];
    for (const column of columns) query = query.order(column, { ascending: true, nullsFirst: false });
    const { data, error, count } = await query.range(offset, offset + limit - 1);
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

