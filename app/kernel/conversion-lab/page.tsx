import { revalidatePath } from "next/cache";
import {
  createConversionJob,
  getConversionOptions,
  listConversionJobs,
} from "../../../core/kernel/conversion-engine";
import { listOmnimodalIntakeRecords } from "../../../core/kernel/omnimodal-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function conversionPageEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.PANTAVION_CONVERSION_ENGINE_ENABLED === "YES";
}

async function submitConversionJob(formData: FormData) {
  "use server";

  if (!conversionPageEnabled()) {
    return;
  }

  const intakeRecordId = String(formData.get("intakeRecordId") ?? "").trim();
  const desiredOutputExtension = String(
    formData.get("desiredOutputExtension") ?? "",
  ).trim();
  const executeNow = String(formData.get("executeNow") ?? "") === "YES";

  if (!intakeRecordId || !desiredOutputExtension) {
    return;
  }

  await createConversionJob({
    intakeRecordId,
    desiredOutputExtension,
    actor: "local-conversion-page",
    executeNow,
  });

  revalidatePath("/kernel/conversion-lab");
}

function cents(value: number) {
  return `€${(value / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("el-CY", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Nicosia",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function ConversionLabPage() {
  const enabled = conversionPageEnabled();
  const records = enabled ? await listOmnimodalIntakeRecords({ limit: 40 }) : [];
  const jobs = enabled ? await listConversionJobs({ limit: 40 }) : [];
  const options = getConversionOptions();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050814",
        color: "#f8fafc",
        padding: "32px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <p
          style={{
            color: "#f6d37a",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          Pantavion Professional
        </p>

        <h1 style={{ fontSize: "34px", lineHeight: 1.1, margin: "0 0 12px" }}>
          Universal Conversion Engine
        </h1>

        <p
          style={{
            maxWidth: "900px",
            color: "#cbd5e1",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          Επαγγελματικό conversion foundation: original preserved, derivative
          outputs only, adapter registry, cost estimate, receipt and audit. Για
          DWG/CAD το original μένει πάντα source truth και κάθε output είναι
          derivative copy.
        </p>

        {!enabled ? (
          <div
            style={{
              border: "1px solid rgba(246, 211, 122, 0.35)",
              borderRadius: "22px",
              padding: "22px",
              background: "rgba(15, 23, 42, 0.78)",
              color: "#f6d37a",
              marginBottom: "30px",
            }}
          >
            Conversion Engine is disabled in production until billing, adapters
            and provider rules are connected.
          </div>
        ) : (
          <form
            action={submitConversionJob}
            style={{
              border: "1px solid rgba(246, 211, 122, 0.35)",
              borderRadius: "22px",
              padding: "22px",
              background: "rgba(15, 23, 42, 0.78)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              marginBottom: "30px",
            }}
          >
            <label
              htmlFor="intakeRecordId"
              style={{ display: "block", fontWeight: 700, marginBottom: "10px" }}
            >
              Source intake record id
            </label>

            <input
              id="intakeRecordId"
              name="intakeRecordId"
              required
              placeholder="Paste omnimodal intake record id"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "#020617",
                color: "#e5e7eb",
                padding: "14px",
                fontSize: "15px",
              }}
            />

            <label
              htmlFor="desiredOutputExtension"
              style={{
                display: "block",
                fontWeight: 700,
                marginTop: "16px",
                marginBottom: "10px",
              }}
            >
              Desired output extension
            </label>

            <input
              id="desiredOutputExtension"
              name="desiredOutputExtension"
              required
              placeholder=".pdf / .txt / .png / .dxf / .geojson"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "#020617",
                color: "#e5e7eb",
                padding: "14px",
                fontSize: "15px",
              }}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "16px",
                color: "#cbd5e1",
              }}
            >
              <input type="checkbox" name="executeNow" value="YES" />
              Execute now only when local adapter is available
            </label>

            <button
              type="submit"
              style={{
                marginTop: "18px",
                border: "0",
                borderRadius: "999px",
                background: "#f6d37a",
                color: "#111827",
                padding: "12px 22px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Create Conversion Job
            </button>
          </form>
        )}

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Available conversion options
          </h2>

          <div style={{ display: "grid", gap: "10px" }}>
            {options.map((option) => (
              <article
                key={option.id}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "rgba(2, 6, 23, 0.6)",
                }}
              >
                <strong style={{ color: "#f6d37a" }}>{option.label}</strong>
                <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>
                  {option.inputExtensions.join(", ")} →{" "}
                  {option.outputExtensions.join(", ")} · {option.adapterStatus} ·{" "}
                  starts {cents(option.estimatedBaseCostCents)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Recent intake records
          </h2>

          {records.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(148, 163, 184, 0.45)",
                borderRadius: "18px",
                padding: "22px",
                color: "#94a3b8",
              }}
            >
              No omnimodal intake records yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {records.slice(0, 10).map((record) => (
                <article
                  key={record.id}
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "14px",
                    padding: "14px",
                    background: "rgba(2, 6, 23, 0.6)",
                  }}
                >
                  <strong>{record.originalName}</strong>
                  <p style={{ margin: "6px 0 0", color: "#94a3b8" }}>
                    {record.category} · {record.extension} · {record.id}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Latest conversion jobs
          </h2>

          {jobs.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(148, 163, 184, 0.45)",
                borderRadius: "18px",
                padding: "22px",
                color: "#94a3b8",
              }}
            >
              No conversion jobs yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {jobs.map((job) => (
                <article
                  key={job.id}
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "rgba(2, 6, 23, 0.72)",
                  }}
                >
                  <p style={{ margin: "0 0 8px", color: "#f8fafc" }}>
                    {job.sourceOriginalName} → {job.desiredOutputExtension}
                  </p>

                  <p style={{ margin: "0 0 8px", color: "#cbd5e1" }}>
                    {job.status} · {job.adapterStatus} · {job.safetyZone} ·{" "}
                    {cents(job.estimatedCostCents)}
                  </p>

                  <p style={{ margin: "0 0 8px", color: "#94a3b8" }}>
                    {job.recommendation}
                  </p>

                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                    {formatDate(job.createdAt)} · {job.id}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
