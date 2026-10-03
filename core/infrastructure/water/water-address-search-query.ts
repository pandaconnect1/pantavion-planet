type WaterAddressFields = {
  street: string;
  houseNumber: string;
  area: string;
  postalCode: string;
};

const PLACE_ALIASES: Record<string, string> = {
  limassol: "Λεμεσός",
  lemesos: "Λεμεσός",
  agios: "Άγιος",
  ayios: "Άγιος",
  tychonas: "Τύχωνας",
  tychon: "Τύχων",
  tichonas: "Τύχωνας",
  griva: "Γρίβα",
  digeni: "Διγενή",
};

function greeklishAlternative(value: string) {
  return value.normalize("NFC").replace(/[a-z]+/gi, (word) => {
    const lower = word.toLowerCase();
    if (PLACE_ALIASES[lower]) return PLACE_ALIASES[lower];
    const pairs: Record<string, string> = {
      th: "θ", ch: "χ", ps: "ψ", ou: "ου", ai: "αι",
      ei: "ει", oi: "οι", mp: "μπ", nt: "ντ", gk: "γκ",
    };
    const letters: Record<string, string> = {
      a: "α", b: "β", c: "κ", d: "δ", e: "ε", f: "φ",
      g: "γ", h: "η", i: "ι", j: "τζ", k: "κ", l: "λ",
      m: "μ", n: "ν", o: "ο", p: "π", q: "κ", r: "ρ",
      s: "σ", t: "τ", u: "υ", v: "β", w: "ω", x: "ξ", y: "υ", z: "ζ",
    };
    return lower.replace(/th|ch|ps|ou|ai|ei|oi|mp|nt|gk|[a-z]/g,
      (part) => pairs[part] ?? letters[part] ?? part).replace(/σ$/, "ς");
  });
}

export function waterAddressSearchQueries(fields: WaterAddressFields): string[] {
  const join = (street: string, area: string) =>
    [fields.houseNumber.trim(), street.trim(), area.trim(), fields.postalCode.trim(), "Cyprus"]
      .filter(Boolean).join(", ");
  // Preserve the original Greek/English spelling; try the Greeklish
  // interpretation only when the provider returns no original candidates.
  return Array.from(new Set([
    join(fields.street.normalize("NFC"), fields.area.normalize("NFC")),
    join(greeklishAlternative(fields.street), greeklishAlternative(fields.area)),
  ]));
}
