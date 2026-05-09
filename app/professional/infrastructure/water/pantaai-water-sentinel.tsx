"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type FindingLevel = "critical" | "warning" | "info" | "ok";

type Finding = {
  level: FindingLevel;
  title: string;
  detail: string;
  action: string;
};

type SentinelResponse = {
  ok: boolean;
  sentinel: string;
  phase: string;
  authorityOwner: string;
  sourceMode: string;
  featureCount: number;
  geometrySummary: Record<string, number>;
  criticalCount: number;
  warningCount: number;
  recommendation: string;
  findings: Finding[];
  productionRules?: string[];
};

function levelLabel(level: FindingLevel) {
  if (level === "critical") return "Κρίσιμο";
  if (level === "warning") return "Προσοχή";
  if (level === "ok") return "ΟΚ";
  return "Πληροφορία";
}

function levelStyle(level: FindingLevel): CSSProperties {
  if (level === "critical") return styles.critical;
  if (level === "warning") return styles.warning;
  if (level === "ok") return styles.ok;
  return styles.info;
}

export default function PantaAIWaterSentinel() {
  const [data, setData] = useState<SentinelResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/professional/infrastructure/water/sentinel", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json: SentinelResponse) => {
        if (!active) return;
        setData(json);
      })
      .catch(() => {
        if (!active) return;
        setError("Το PantaAI δεν μπόρεσε να διαβάσει την κατάσταση του δικτύου.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>PANTAAI ΥΠΟΔΟΜΩΝ</p>
          <h3 style={styles.title}>AI επιτηρητής δικτύου ύδρευσης</h3>
        </div>
        <span style={styles.badge}>Phase 1I</span>
      </div>

      {!data && !error ? (
        <div style={styles.loading}>Το PantaAI ελέγχει το layer...</div>
      ) : null}

      {error ? <div style={styles.error}>{error}</div> : null}

      {data ? (
        <>
          <div style={styles.recommendation}>
            <strong>Εισήγηση PantaAI</strong>
            <span>{data.recommendation}</span>
          </div>

          <div style={styles.metrics}>
            <span>
              Source: <strong>{data.sourceMode}</strong>
            </span>
            <span>
              Στοιχεία: <strong>{data.featureCount}</strong>
            </span>
            <span>
              Κρίσιμα: <strong>{data.criticalCount}</strong>
            </span>
            <span>
              Προειδοποιήσεις: <strong>{data.warningCount}</strong>
            </span>
          </div>

          <div style={styles.findings}>
            {data.findings.map((finding, index) => (
              <article key={`${finding.title}-${index}`} style={styles.findingCard}>
                <div style={styles.findingTop}>
                  <strong>{finding.title}</strong>
                  <span style={{ ...styles.level, ...levelStyle(finding.level) }}>
                    {levelLabel(finding.level)}
                  </span>
                </div>

                <p style={styles.detail}>{finding.detail}</p>

                <div style={styles.action}>
                  <strong>Ενέργεια:</strong> {finding.action}
                </div>
              </article>
            ))}
          </div>

          <div style={styles.rules}>
            <strong>Κανόνες παραγωγής</strong>
            {(data.productionRules || []).map((rule) => (
              <span key={rule}>• {rule}</span>
            ))}
          </div>

          <p style={styles.note}>
            Το PantaAI εδώ είναι τεχνικός επιτηρητής και βοηθός απόφασης. Δεν εγκρίνει
            μόνο του πρόσβαση σε ευαίσθητο δίκτυο. Η τελική εξουσιοδότηση μένει στην Αρχή.
          </p>
        </>
      ) : null}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background:
      "linear-gradient(135deg, rgba(5,12,24,.92), rgba(13,30,58,.88))",
    border: "1px solid rgba(156,255,210,.24)",
    color: "#fff8e7",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  label: {
    margin: "0 0 7px",
    color: "#9cffd2",
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 1.4,
  },
  title: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.15,
  },
  badge: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "rgba(69,255,172,.1)",
    border: "1px solid rgba(69,255,172,.35)",
    color: "#9cffd2",
    fontSize: 12,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  loading: {
    color: "#d8e0f4",
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,.045)",
  },
  error: {
    color: "#ffb4bd",
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,73,91,.1)",
    border: "1px solid rgba(255,73,91,.26)",
  },
  recommendation: {
    display: "grid",
    gap: 7,
    padding: 13,
    borderRadius: 16,
    background: "rgba(246,200,95,.09)",
    border: "1px solid rgba(246,200,95,.26)",
    marginBottom: 12,
    color: "#fff8e7",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,.045)",
    color: "#d8e0f4",
    fontSize: 13,
    marginBottom: 12,
  },
  findings: {
    display: "grid",
    gap: 10,
  },
  findingCard: {
    display: "grid",
    gap: 8,
    padding: 13,
    borderRadius: 16,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(216,224,244,.13)",
  },
  findingTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  level: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  critical: {
    background: "rgba(255,73,91,.12)",
    color: "#ffb4bd",
    border: "1px solid rgba(255,73,91,.34)",
  },
  warning: {
    background: "rgba(255,180,72,.12)",
    color: "#ffd89a",
    border: "1px solid rgba(255,180,72,.34)",
  },
  ok: {
    background: "rgba(69,255,172,.12)",
    color: "#9cffd2",
    border: "1px solid rgba(69,255,172,.34)",
  },
  info: {
    background: "rgba(120,170,255,.12)",
    color: "#c7dcff",
    border: "1px solid rgba(120,170,255,.3)",
  },
  detail: {
    margin: 0,
    color: "#d8e0f4",
    fontSize: 13,
    lineHeight: 1.45,
  },
  action: {
    color: "#fff8e7",
    fontSize: 13,
    lineHeight: 1.45,
  },
  rules: {
    display: "grid",
    gap: 6,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background: "rgba(2,4,11,.38)",
    color: "#d8e0f4",
    fontSize: 13,
    lineHeight: 1.45,
  },
  note: {
    margin: "12px 0 0",
    color: "#d8e0f4",
    fontSize: 12,
    lineHeight: 1.45,
  },
};