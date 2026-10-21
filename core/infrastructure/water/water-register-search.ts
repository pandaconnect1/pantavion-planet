/**
 * Canonical read-only Water register lookup.
 * Does not alter authentic DWG, GIS geometry, area assignments or asset IDs.
 */
export function waterRegisterNumberCandidates(input: string): string[] {
  const q = input.trim().toUpperCase();
  // A field worker can type "224 75", "224-V75", or "224 V0075"
  // for the canonical valve identifier "224-V0075".
  const match = /^(\d{1,3})[\s\-/]+(?:([A-Z]{1,3})[\s\-/]*)?(\d{1,4})$/.exec(q);
  if (!match) return [];
  const area = match[1].padStart(3, "0");
  const code = match[2] || "V";
  if (!["V", "H", "AV", "T"].includes(code)) return [];
  const ordinal = match[3].padStart(4, "0");
  return [`${area}-${code}${ordinal}`];
}

export function waterRegisterAlternateStreetOrder(value: string): string | null {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return null;
  return [...words].reverse().join(" ");
}
