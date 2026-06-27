import { revalidatePath } from "next/cache";
import {
  createFounderCommand,
  listFounderCommands,
} from "../../../core/kernel/founder-command";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function founderInboxEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.PANTAVION_FOUNDER_COMMAND_INBOX_ENABLED === "YES";
}

async function submitFounderCommand(formData: FormData) {
  "use server";

  if (!founderInboxEnabled()) {
    return;
  }

  const commandText = String(formData.get("commandText") ?? "").trim();
  const useAI = String(formData.get("useAI") ?? "") === "yes";

  if (!commandText) {
    return;
  }

  await createFounderCommand({
    commandText,
    actor: "founder-web",
    source: "web",
    useAI,
  });

  revalidatePath("/kernel/founder-command");
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

export default async function FounderCommandPage() {
  const enabled = founderInboxEnabled();
  const commands = enabled ? await listFounderCommands({ limit: 30 }) : [];

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
          Founder Command Inbox
        </h1>

        <p
          style={{
            maxWidth: "780px",
            color: "#cbd5e1",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          Γράφεις εδώ τι θέλεις να περάσει στο Pantavion. Η οδηγία γράφεται σε
          πραγματικό kernel state, παίρνει safety zone, audit record και
          execution/evolution plan. Δεν εκτελεί παραγωγικές ή επικίνδυνες
          αλλαγές χωρίς checks και founder approval.
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
            Founder Command Inbox is disabled in production until real auth is
            connected. For local development it works through npm run dev.
          </div>
        ) : (
          <form
            action={submitFounderCommand}
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
              htmlFor="commandText"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Founder instruction
            </label>

            <textarea
              id="commandText"
              name="commandText"
              required
              rows={6}
              placeholder="Π.χ. Θέλω πραγματικό startup builder agent με files, memory, repo PR writer και approval gates."
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

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginTop: "14px",
                color: "#cbd5e1",
                fontSize: "14px",
              }}
            >
              <input type="checkbox" name="useAI" value="yes" />
              Χρήση πραγματικού AI provider αν είναι ήδη ρυθμισμένος
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
              Send to Kernel
            </button>
          </form>
        )}

        <section>
          <h2 style={{ fontSize: "22px", marginBottom: "14px" }}>
            Latest commands
          </h2>

          {commands.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(148, 163, 184, 0.45)",
                borderRadius: "18px",
                padding: "22px",
                color: "#94a3b8",
              }}
            >
              Δεν υπάρχει ακόμα founder command.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {commands.map((command) => (
                <article
                  key={command.id}
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
                      {command.safetyVerdict.zone}
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
                      {command.status}
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
                      {command.intent}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 12px", color: "#f8fafc", lineHeight: 1.6 }}>
                    {command.commandText}
                  </p>

                  <p
                    style={{
                      margin: "0 0 10px",
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    <strong>Next:</strong> {command.plan.nextAction}
                  </p>

                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                    {formatDate(command.createdAt)} · {command.id}
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
