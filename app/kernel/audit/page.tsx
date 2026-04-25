import Link from "next/link";
import type { CSSProperties } from "react";
import { kernelGapRegistry } from "@/core/pantavion/kernel-gap-index";

export const metadata = {
  title: "Kernel Audit | Pantavion One",
  description: "Pantavion Kernel Audit: governed registry of foundation, safety, policy, readiness and execution gaps.",
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
};

const wrap: CSSProperties = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0",
};

const card: CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)",
};

const badge: CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: ".1em",
};

const gold: CSSProperties = {
  color: "#f3c454",
  fontWeight: 900,
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function summarizeRecord(record: UnknownRecord): string {
  const ignored = new Set(["id", "title", "priority", "status", "summary"]);
  const parts = Object.entries(record)
    .filter(([key, value]) => !ignored.has(key) && typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`);

  return parts.length > 0 ? parts.join(" • ") : "Registered kernel control item requiring review.";
}

function normalizeGap(item: unknown, index: number) {
  const record = isRecord(item) ? item : {};

  const id =
    readString(record, "id") ||
    readString(record, "key") ||
    readString(record, "region") ||
    `kernel-gap-${index + 1}`;

  const title =
    readString(record, "title") ||
    readString(record, "region") ||
    readString(record, "name") ||
    id.replace(/[-_]/g, " ");

  const priority =
    readString(record, "priority") ||
    readString(record, "severity") ||
    "review";

  const status =
    readString(record, "status") ||
    readString(record, "state") ||
    "foundation";

  const summary =
    readString(record, "summary") ||
    readString(record, "description") ||
    summarizeRecord(record);

  return {
    id,
    title,
    priority,
    status,
    summary,
  };
}

export default function KernelAuditPage() {
  const gaps = Array.isArray(kernelGapRegistry)
    ? kernelGapRegistry.map((gap, index) => normalizeGap(gap, index))
    : [];

  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>
          Kernel Audit
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          No invisible gaps. No fake-live claims.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          Pantavion Kernel Audit tracks foundation, readiness, legal, safety, security, AI and execution controls before public launch, payments, marketplace activity or institutional integrations.
        </p>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>Registry Status</span>
          <h2 style={{ fontSize: 38, marginBottom: 8 }}>Kernel Gap Registry</h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.7 }}>
            Total registered controls: <strong style={gold}>{gaps.length}</strong>
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 38 }}>
          {gaps.map((gap, index) => (
            <article key={`${gap.id}-${index}`} style={card}>
              <span style={badge}>{gap.priority}</span>
              <h2 style={{ margin: "18px 0 10px", fontSize: 25 }}>{gap.title}</h2>
              <p style={{ color: "#f3c454", fontWeight: 900 }}>{gap.status}</p>
              <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{gap.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
