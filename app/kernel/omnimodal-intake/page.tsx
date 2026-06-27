import { revalidatePath } from "next/cache";
import {
  ingestOmnimodalBlob,
  listOmnimodalIntakeRecords,
  getOmnimodalFormatRegistry,
} from "../../../core/kernel/omnimodal-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function omnimodalPageEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.PANTAVION_OMNIMODAL_INTAKE_ENABLED === "YES";
}

async function submitOmnimodalFile(formData: FormData) {
  "use server";

  if (!omnimodalPageEnabled()) {
    return;
  }

  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return;
  }

  const named = file as Blob & { name?: string };
  const originalName =
    typeof named.name === "string" && named.name.trim()
      ? named.name
      : "upload.bin";

  const purpose = String(formData.get("purpose") ?? "").trim() || undefined;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await ingestOmnimodalBlob({
    actor: "local-omnimodal-page",
    source: "web",
    originalName,
    mimeType: file.type || "application/octet-stream",
    bytes,
    declaredPurpose: purpose,
  });

  revalidatePath("/kernel/omnimodal-intake");
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function OmnimodalIntakePage() {
  const enabled = omnimodalPageEnabled();
  const records = enabled ? await listOmnimodalIntakeRecords({ limit: 40 }) : [];
  const formats = getOmnimodalFormatRegistry();

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
          Pantavion Kernel
        </p>

        <h1 style={{ fontSize: "34px", lineHeight: 1.1, margin: "0 0 12px" }}>
          Universal Omnimodal Intake
        </h1>

        <p
          style={{
            maxWidth: "880px",
            color: "#cbd5e1",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          Το Pantavion δέχεται αρχεία ως original bytes, γράφει manifest,
          SHA256, safety zone και audit. Δεν κάνει fake parsing. DWG/DXF/CAD
          αποθηκεύονται αυτούσια και read-only μέχρι να συνδεθεί πραγματικός
          viewer adapter.
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
            Omnimodal intake is disabled in production until auth, storage and
            trust rules are connected.
          </div>
        ) : (
          <form
            action={submitOmnimodalFile}
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
              htmlFor="file"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              File
            </label>

            <input
              id="file"
              name="file"
              type="file"
              required
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
              htmlFor="purpose"
              style={{
                display: "block",
                fontWeight: 700,
                marginTop: "16px",
                marginBottom: "10px",
              }}
            >
              Purpose
            </label>

            <input
              id="purpose"
              name="purpose"
              placeholder="Π.χ. DWG master map read-only intake / PDF contract / audio note"
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
              Store Original File
            </button>
          </form>
        )}

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Format registry
          </h2>

          <div style={{ display: "grid", gap: "10px" }}>
            {formats.slice(0, 12).map((format) => (
              <article
                key={format.extension}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "rgba(2, 6, 23, 0.6)",
                }}
              >
                <strong style={{ color: "#f6d37a" }}>
                  {format.extension}
                </strong>{" "}
                <span style={{ color: "#cbd5e1" }}>
                  {format.label} · {format.category} · {format.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Latest intake records
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
              Δεν υπάρχει ακόμα omnimodal intake record.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {records.map((record) => (
                <article
                  key={record.id}
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "rgba(2, 6, 23, 0.72)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "5px 10px",
                        background: "rgba(246, 211, 122, 0.12)",
                        color: "#f6d37a",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {record.safetyZone}
                    </span>

                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "5px 10px",
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "#cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {record.category}
                    </span>

                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "5px 10px",
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "#cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {record.supportStatus}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 8px", color: "#f8fafc", lineHeight: 1.6 }}>
                    {record.originalName} · {formatBytes(record.byteSize)}
                  </p>

                  <p
                    style={{
                      margin: "0 0 10px",
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    <strong>Policy:</strong> {record.preservationPolicy}
                  </p>

                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                    {formatDate(record.createdAt)} · SHA256 {record.sha256.slice(0, 16)}...
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
