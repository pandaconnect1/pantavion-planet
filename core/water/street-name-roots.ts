// Declension-tolerant road-name roots shared by the Cyprus DLS road search and the
// street registry matcher. Input must be upper-case and accent-free.

const GENERIC_ROAD_WORDS = new Set([
  "ΟΔΟΣ", "ΟΔΟΥ", "ΟΔΟΝ", "ΛΕΩΦΟΡΟΣ", "ΛΕΩΦ",
  "ODOS", "ODOU", "LEOFOROS", "LEOF", "STREET", "ROAD", "AVENUE",
]);

// Greek and romanized declensions share a root: ΑΓΙΟΣ / ΑΓΙΟΥ -> ΑΓΙΟ, ΤΥΧΩΝΑΣ -> ΤΥΧΩΝ.
function roadNameRoot(token: string) {
  if (token.length >= 6) return token.slice(0, -2);
  if (token.length === 5) return token.slice(0, -1);
  return token;
}

// Generic road words, house numbers and one-letter tokens never become roots.
export function roadNameRoots(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 2 && !/^\d+$/.test(token) && !GENERIC_ROAD_WORDS.has(token))
        .map(roadNameRoot),
    ),
  ).slice(0, 4);
}
