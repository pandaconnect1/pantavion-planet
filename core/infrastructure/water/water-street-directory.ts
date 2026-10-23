// Address records and CAD labels have different grains. Never join them by name alone.
export type PostalSource = { schemaVersion: string; sha256: string; publishedAt: string; datasetUrl: string; names: string[][]; places: string[][]; rows: Array<Array<string | number>>; localities: string[][] };
export type DirectoryStreet = {
  id: string; name_el: string | null; name_lat: string | null;
  municipality_or_community: string | null; locality_lat: string | null;
  area_or_parish: string | null; zone_or_section: string | null;
  source: string; source_ref: string | null; status: string;
  postal_codes: string[]; street_ranges: string[]; source_refs: string[];
  record_kind: "postal" | "drawing_label" | "field" | "legacy";
  layer?: string; hidden?: boolean; beyond_prior_cutoff?: boolean;
  zone_basis?: string; map_href: string | null; map_action: string;
};

export function streetNameKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

const letters: Record<string, string> = { Α:"A", Β:"V", Γ:"G", Δ:"D", Ε:"E", Ζ:"Z", Η:"I", Θ:"TH", Ι:"I", Κ:"K", Λ:"L", Μ:"M", Ν:"N", Ξ:"X", Ο:"O", Π:"P", Ρ:"R", Σ:"S", Τ:"T", Υ:"Y", Φ:"F", Χ:"CH", Ψ:"PS", Ω:"O" };
export function streetSearchKey(value: string) {
  let key = streetNameKey(value);
  for (const [from, to] of [["ΟΥ","OU"],["ΑΙ","AI"],["ΕΙ","EI"],["ΟΙ","OI"],["ΑΥ","AV"],["ΕΥ","EV"],["ΜΠ","MP"],["ΝΤ","NT"],["ΓΚ","GK"],["ΓΓ","NG"]]) key = key.replaceAll(from, to);
  const result = key.replace(/[Α-Ω]/g, (c) => letters[c] || c).replace(/(?<=[A-Z])8(?=[A-Z])/g,"TH")
    .replace(/PH/g,"F").replace(/CH|KH/g,"X").replace(/(?<!T)H/g,"I").replace(/OY/g,"OU").replace(/EY|EF/g,"EV").replace(/AY|AF/g,"AV")
    .replace(/MP/g,"B").replace(/NT/g,"D").replace(/GK/g,"G").replace(/AI/g,"E").replace(/EI|OI/g,"I")
    .replace(/Y/g,"I").replace(/W/g,"O").replace(/[^A-Z0-9]/g,"");
  return result === "LIMASSOL" ? "LEMESOS" : result;
}

function navigationSearch(name: string, locality: string) {
  return `/professional/infrastructure/water/location?q=${encodeURIComponent(`${name} ${locality} Λεμεσός`)}`;
}

export function postalDirectoryRows(source: PostalSource): DirectoryStreet[] {
  if (source.schemaVersion !== "cyprus-post-limassol-v1" || !/^[a-f0-9]{64}$/.test(source.sha256)) throw new Error("postal_source_invalid");
  const groups = new Map<string, DirectoryStreet>();
  for (const row of source.rows) {
    const [number, ni, pi, postcode, range] = row;
    const names = source.names[Number(ni)]; const place = source.places[Number(pi)];
    if (!names?.[0] || !names[1] || !place?.[0] || !place[1]) throw new Error("postal_source_reference_invalid");
    const id = `cyprus-post-2024:${ni}:${pi}`;
    let entry = groups.get(id);
    if (!entry) {
      entry = { id, name_el: names[0], name_lat: names[1], municipality_or_community: place[0], locality_lat: place[1],
        area_or_parish: place[0], zone_or_section: null, source: "CYPRUS_POST_2024", source_ref: source.datasetUrl, status: "source_record",
        postal_codes: [], street_ranges: [], source_refs: [], record_kind: "postal", map_href: navigationSearch(names[0], place[0]), map_action: "Αναζήτηση θέσης" };
      groups.set(id, entry);
    }
    if (postcode && !entry.postal_codes.includes(String(postcode))) entry.postal_codes.push(String(postcode));
    if (range && !entry.street_ranges.includes(String(range))) entry.street_ranges.push(String(range));
    entry.source_refs.push(String(number));
  }
  return [...groups.values()];
}

export function postalDatabaseRecords(source: PostalSource) {
  return postalDirectoryRows(source).map((r) => ({ name_el: r.name_el, name_lat: r.name_lat,
    normalized_name: streetNameKey(r.name_lat || r.name_el || "").toLowerCase(),
    alternate_names: [r.name_el!, r.name_lat!, r.locality_lat!], district_name: "Lemesos",
    municipality_or_community: r.municipality_or_community, area_or_parish: r.area_or_parish,
    zone_or_section: null, postal_codes: r.postal_codes, source: "CYPRUS_POST", source_ref: r.id, status: "VERIFIED",
  }));
}

type CadArea = { code: string; outline: string; ring: unknown; bounds?: unknown };
function inRing(x: number, y: number, value: unknown) {
  if (!Array.isArray(value) || value.length < 3) return false;
  let inside = false;
  for (let i = 0, j = value.length - 1; i < value.length; j = i++) {
    const a = value[i], b = value[j];
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function drawingStreetRows(items: Array<Record<string, unknown>>, areas: CadArea[]): DirectoryStreet[] {
  const positions = new Map<string, DirectoryStreet>();
  for (const item of items) {
    if (item.category !== "street" || typeof item.label !== "string" || !item.label.trim()) continue;
    if (typeof item.x !== "number" || typeof item.y !== "number" || !Number.isFinite(item.x) || !Number.isFinite(item.y)) continue;
    // Exact label + source layer + exact source coordinates only. No proximity/name-only deduplication.
    const key = JSON.stringify([streetNameKey(item.label), item.layer, item.x, item.y]);
    const existing = positions.get(key);
    if (existing) { existing.source_refs.push(String(item.ref)); continue; }
    const zones = areas.filter((a) => inRing(item.x as number, item.y as number, a.ring));
    const label = item.label.trim();
    positions.set(key, { id: `dwg:${item.ref}`, name_el: /[Α-Ωα-ω]/.test(label) ? label : null, name_lat: /[Α-Ωα-ω]/.test(label) ? null : label,
      municipality_or_community: null, locality_lat: null, area_or_parish: null,
      zone_or_section: zones.map((z) => z.code).sort().join(" / ") || null,
      zone_basis: zones.length ? zones.some((z) => z.outline !== "closed") ? "Περίγραμμα DWG κατά προσέγγιση" : "Περίγραμμα DWG — όχι επιβεβαιωμένη ζώνη υδροδότησης" : "",
      source: "DWG_B_D", source_ref: String(item.ref), status: "needs_identification", postal_codes: [], street_ranges: [], source_refs: [String(item.ref)], record_kind: "drawing_label",
      layer: String(item.layer || ""), hidden: Boolean(item.off || item.frozen), beyond_prior_cutoff: Boolean(item.beyondPriorCutoff),
      map_href: `/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap&viewId=D&x=${item.x}&y=${item.y}&asset=${encodeURIComponent(String(item.ref))}`, map_action: "Στο σημείο του DWG" });
  }
  return [...positions.values()];
}

export function fieldStreetRows(patches: Array<Record<string, unknown>>): DirectoryStreet[] {
  return patches.filter((p) => p.asset_type === "road_reference" && ["pending_review","approved_overlay","officialization_candidate","officialized"].includes(String(p.status))).map((p) => {
    const g = p.geometry as { type?: string; coordinates?: unknown; crs?: { authority?: string; code?: string } } | null;
    const a = p.attributes as Record<string, unknown> | null;
    const coordinates = g?.type === "Point" ? g.coordinates : g?.type === "LineString" ? (g.coordinates as unknown[])?.[0] : (g?.coordinates as unknown[][])?.[0]?.[0];
    let href: string | null = null;
    if (Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every((v) => typeof v === "number" && Number.isFinite(v))) {
      if (g?.crs?.authority === "EPSG" && g.crs.code === "4326" && Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90) href = `/professional/infrastructure/water/live?from=road-navigation&lng=${coordinates[0]}&lat=${coordinates[1]}`;
      if (g?.crs?.authority === "LOCAL" && ["canonical-2026-andreaspap","legacy-george-85m"].includes(String(p.source_key)) && g.crs.code === p.source_key) href = `/professional/infrastructure/water/master-b-mobile?sourceKey=${encodeURIComponent(String(p.source_key))}&viewId=${p.source_key === "canonical-2026-andreaspap" ? "D" : "E"}&x=${coordinates[0]}&y=${coordinates[1]}&asset=${encodeURIComponent(String(p.patch_id))}`;
    }
    return { id: `field:${p.patch_id}`, name_el: String(p.street_name || "Ανώνυμη οδός"), name_lat: null, municipality_or_community: String(p.area || "") || null, locality_lat: null, area_or_parish: String(p.area || "") || null,
      zone_or_section: String(a?.zone || "") || null, source: "FIELD", source_ref: String(p.patch_id), status: String(p.status), postal_codes: [], street_ranges: [], source_refs: [String(p.patch_id)], record_kind: "field" as const, map_href: href, map_action: "Στην καταγεγραμμένη θέση" };
  });
}

export function mergeStreetSources(official: DirectoryStreet[], legacy: Array<Record<string, unknown>>, drawing: DirectoryStreet[], field: DirectoryStreet[]) {
  const rows = official.map((r) => ({ ...r, postal_codes: [...r.postal_codes], source_refs: [...r.source_refs] }));
  const known = new Map<string, DirectoryStreet>();
  const officialIds = new Set(official.map((r) => r.id));
  for (const r of rows) for (const name of [r.name_el, r.name_lat]) for (const place of [r.municipality_or_community, r.locality_lat]) if (name && place) known.set(`${streetNameKey(name)}|${streetNameKey(place)}`, r);
  for (const r of legacy) {
    if (typeof r.source_ref === "string" && officialIds.has(r.source_ref)) continue;
    const postalCodes = Array.isArray(r.postal_codes) ? r.postal_codes.map(String) : [];
    const matching = [r.name_el, r.name_lat].flatMap((n) => [r.municipality_or_community, r.area_or_parish].map((p) => typeof n === "string" && typeof p === "string" ? known.get(`${streetNameKey(n)}|${streetNameKey(p)}`) : undefined)).find(Boolean);
    // Same publisher, exact source spelling AND exact bilingual locality; a known conflicting zone is preserved.
    if (matching && r.source === "CYPRUS_POST" && !r.zone_or_section) {
      matching.postal_codes = [...new Set([...matching.postal_codes, ...postalCodes])];
      matching.source_refs.push(String(r.source_ref || r.id)); continue;
    }
    const name = String(r.name_el || r.name_lat || ""); const place = String(r.municipality_or_community || r.area_or_parish || "");
    rows.push({ id: `legacy:${r.id}`, name_el: String(r.name_el || "") || null, name_lat: String(r.name_lat || "") || null,
      municipality_or_community: place || null, locality_lat: null, area_or_parish: String(r.area_or_parish || "") || null, zone_or_section: String(r.zone_or_section || "") || null,
      source: String(r.source || "REGISTER"), source_ref: String(r.source_ref || "") || null, status: String(r.status || "source_record"), postal_codes: postalCodes, street_ranges: [], source_refs: [String(r.id)], record_kind: "legacy", map_href: name && place ? navigationSearch(name, place) : null, map_action: "Αναζήτηση θέσης" });
  }
  return [...rows, ...drawing, ...field];
}

export function streetDirectoryPage(rows: DirectoryStreet[], options: { q: string; locality: string; source: string; offset: number; limit: number }) {
  const generic = new Set(["ODOS","OD","STREET","ST","ROAD","RD","AVENUE","AVE","LEOFOROS","LEOF"]);
  const tokens = (s: string) => s.split(/\s+/).map(streetSearchKey).filter((t) => t && !generic.has(t));
  const query = tokens(options.q); const locality = tokens(options.locality);
  const filtered = rows.filter((r) => {
    if (options.source && r.record_kind !== options.source) return false;
    const places = [r.municipality_or_community,r.locality_lat,r.area_or_parish,r.zone_or_section].filter(Boolean).map((v) => streetSearchKey(String(v)));
    const search = [...places, ...[r.name_el,r.name_lat,r.layer,r.id,...r.postal_codes].filter(Boolean).map((v) => streetSearchKey(String(v)))];
    return query.every((t) => search.some((v) => v.includes(t))) && locality.every((t) => places.some((v) => v.includes(t)));
  });
  const compare = (a: string | null, b: string | null) => a && b ? a.localeCompare(b,"el",{numeric:true}) : a ? -1 : b ? 1 : 0;
  filtered.sort((a,b) => compare(a.municipality_or_community,b.municipality_or_community) || compare(a.area_or_parish,b.area_or_parish) || compare(a.zone_or_section,b.zone_or_section) || compare(a.name_el || a.name_lat,b.name_el || b.name_lat) || a.id.localeCompare(b.id));
  const counts = { postal: 0, drawing_label: 0, field: 0, legacy: 0 };
  for (const r of filtered) counts[r.record_kind]++;
  return { streets: filtered.slice(options.offset,options.offset+options.limit), total: filtered.length, offset: options.offset, counts };
}
