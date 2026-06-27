import { revalidatePath } from "next/cache";
import {
  createUserSignal,
  listUserSignals,
} from "../../../core/kernel/user-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userSignalPageEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.PANTAVION_USER_SIGNAL_INTAKE_ENABLED === "YES";
}

async function submitUserSignal(formData: FormData) {
  "use server";

  if (!userSignalPageEnabled()) {
    return;
  }

  const text = String(formData.get("signalText") ?? "").trim();

  if (!text) {
    return;
  }

  await createUserSignal({
    text,
    actor: "local-user-signal-page",
    source: "user",
  });

  revalidatePath("/kernel/user-signal");
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

export default async function UserSignalPage() {
  const enabled = userSignalPageEnabled();
  const signals = enabled ? await listUserSignals({ limit: 40 }) : [];

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
      <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
          User Signal Intake
        </h1>

        <p
          style={{
            maxWidth: "820px",
            color: "#cbd5e1",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          Εδώ μπαίνουν προβλήματα, bugs, ιδέες και ανάγκες. Τα signals
          αποθηκεύονται σε πραγματικό kernel state, παίρνουν category,
          severity και safety zone, αλλά δεν εκτελούν κώδικα. Η υλοποίηση
          περνά μόνο μέσω Founder review, PR, build, typecheck και kernel tick.
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
            User Signal Intake is disabled in production until auth/trust rules
            are connected.
          </div>
        ) : (
          <form
            action={submitUserSignal}
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
              htmlFor="signalText"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Signal / problem / idea
            </label>

            <textarea
              id="signalText"
              name="signalText"
              required
              rows={5}
              placeholder="Π.χ. Λείπει πραγματικό voice command runtime ή υπάρχει bug στο Founder Inbox."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "#020617",
                color: "#e5e7eb",
                padding: "16px",
                fontSize: "15px",
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
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
              Send Signal to Kernel
            </button>
          </form>
        )}

        <section>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Latest signals
          </h2>

          {signals.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(148, 163, 184, 0.45)",
                borderRadius: "18px",
                padding: "22px",
                color: "#94a3b8",
              }}
            >
              Δεν υπάρχει ακόμα user signal.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {signals.map((signal) => (
                <article
                  key={signal.id}
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
                      {signal.safetyZone}
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
                      {signal.category}
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
                      {signal.severity}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 12px", color: "#f8fafc", lineHeight: 1.6 }}>
                    {signal.commandOrSignalText}
                  </p>

                  <p
                    style={{
                      margin: "0 0 10px",
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    <strong>Next:</strong> {signal.recommendation}
                  </p>

                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                    {formatDate(signal.createdAt)} · {signal.id}
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
