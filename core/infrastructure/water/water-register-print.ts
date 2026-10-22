/** Collect every matching page before allowing a print; never print a partial page set. */
export async function collectWaterRegisterPrintRows<T extends { number: string }>(
  fetchPage: (offset: number) => Promise<{ assets: T[]; total: number }>,
): Promise<T[]> {
  const rows: T[] = [];
  const ids = new Set<string>();
  let expected: number | null = null;
  do {
    const page = await fetchPage(rows.length);
    if (!Number.isSafeInteger(page.total) || page.total < 0 || page.total > 100000 || !Array.isArray(page.assets)) throw new Error("invalid_print_response");
    if (expected !== null && expected !== page.total) throw new Error("register_changed_during_print");
    expected = page.total;
    if (!page.assets.length && rows.length < expected) throw new Error("incomplete_print_results");
    for (const row of page.assets) {
      if (!row.number || ids.has(row.number)) throw new Error("duplicate_print_record");
      ids.add(row.number); rows.push(row);
    }
    if (rows.length > expected) throw new Error("invalid_print_count");
  } while (rows.length < expected);
  return rows;
}
