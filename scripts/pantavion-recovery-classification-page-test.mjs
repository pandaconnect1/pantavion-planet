import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/kernel/recovery-classification/page.tsx"), "utf8");
const reader = fs.readFileSync(path.join(root, "core/recovery/pantavion-recovery-classification-reader.ts"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/recovery/imported-pr248/canonical-ledger/corpus/manifest.json"), "utf8"));

if (manifest.totalRecords !== 82_413) throw new Error("classification_page_corpus_count_mismatch");
if (manifest.totalBatches !== 55) throw new Error("classification_page_batch_count_mismatch");
if (!page.includes("isPantavionKernelFounderIdentityAllowed")) throw new Error("classification_page_founder_guard_missing");
if (!page.includes("Live επαληθευμένα")) throw new Error("classification_page_live_truth_missing");
if (!reader.includes("recovery_classification_page_gap")) throw new Error("classification_page_gap_gate_missing");
if (!reader.includes("PAGE_SIZE = 50")) throw new Error("classification_page_bounded_pagination_missing");
if (!page.includes("data.moduleCounts")) throw new Error("classification_page_module_counts_missing");
if (!page.includes('params.set("module", module)')) throw new Error("classification_page_module_filter_link_missing");
if (!reader.includes("selectedModule")) throw new Error("classification_page_module_filter_missing");
if (!reader.includes("filteredRecords")) throw new Error("classification_page_filtered_count_missing");
if (!page.includes('name="q"')) throw new Error("classification_page_search_input_missing");
if (!page.includes('name="status"')) throw new Error("classification_page_status_filter_missing");
if (!reader.includes("normalizedQuery")) throw new Error("classification_page_search_runtime_missing");
if (!reader.includes("selectedStatus")) throw new Error("classification_page_status_runtime_missing");
if (!page.includes("row.sourceLocation")) throw new Error("classification_page_provenance_missing");

const moduleTotal = Object.values(manifest.moduleCounts).reduce((sum, value) => sum + value, 0);
if (moduleTotal !== 82_413) throw new Error(`classification_page_module_total_mismatch:${moduleTotal}`);

console.log("Pantavion recovery classification page: PASS");
console.log(`Records: ${manifest.totalRecords}`);
console.log(`Batches: ${manifest.totalBatches}`);
console.log(`Modules: ${Object.keys(manifest.moduleCounts).length}`);
