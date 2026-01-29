export function normalizeJapaneseAnswer(input: string) {
  // Minimal normalization for the "perfect" fast-path:
  // - trim
  // - collapse whitespace
  // - normalize full-width/half-width forms
  return input.normalize("NFKC").trim().replace(/\s+/g, " ");
}
