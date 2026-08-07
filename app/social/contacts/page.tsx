"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CONTACT_SYNC_POLICY,
  normalizeEmail,
  normalizePhone,
  type NormalizedContact,
} from "@/lib/social-core/contact-sync";

type PickerContact = {
  name?: string[];
  email?: string[];
  tel?: string[];
};

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select?: (
      properties: Array<"name" | "email" | "tel">,
      options?: { multiple?: boolean },
    ) => Promise<PickerContact[]>;
  };
};

function normalizePicked(contact: PickerContact, index: number): NormalizedContact {
  return {
    localId: `device-${Date.now()}-${index}`,
    displayName: contact.name?.[0]?.trim() || undefined,
    phones: (contact.tel || []).map(normalizePhone).filter(Boolean),
    emails: (contact.email || []).map(normalizeEmail).filter(Boolean),
    source: "device",
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectContacts() {
    const picker = (navigator as ContactPickerNavigator).contacts?.select;
    if (!picker) {
      setStatus(
        "Η ασφαλής επιλογή επαφών δεν υποστηρίζεται από αυτόν τον browser. Δεν δόθηκε καμία πρόσβαση στο βιβλίο επαφών σου.",
      );
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      const picked = await picker(["name", "email", "tel"], { multiple: true });
      const normalized = picked.map(normalizePicked);
      setContacts(normalized);
      setStatus(
        normalized.length
          ? `Επέλεξες ${normalized.length} επαφές. Παραμένουν μόνο σε αυτή τη συνεδρία και δεν ανεβαίνουν αυτόματα στο Pantavion.`
          : "Δεν επιλέχθηκε καμία επαφή.",
      );
    } catch (error) {
      const name = error instanceof Error ? error.name : "unknown";
      setStatus(name === "AbortError" ? "Η επιλογή επαφών ακυρώθηκε." : "Δεν ήταν δυνατή η ανάγνωση επαφών.");
    } finally {
      setBusy(false);
    }
  }

  function clearContacts() {
    setContacts([]);
    setStatus("Οι επιλεγμένες επαφές αφαιρέθηκαν από αυτή τη συνεδρία.");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>
              PANTAVION CONTACTS
            </p>
            <h1 style={{ margin: "8px 0", fontSize: "clamp(34px,5vw,56px)" }}>Επαφές με δική σου άδεια</h1>
            <p style={{ maxWidth: 760, margin: 0, color: "#60758c", lineHeight: 1.6 }}>
              Επιλέγεις εσύ συγκεκριμένες επαφές από τη συσκευή σου. Το Pantavion δεν τραβά αυτόματα ολόκληρο το βιβλίο επαφών.
            </p>
          </div>
          <Link href="/social-core" style={{ textDecoration: "none", color: "#1769aa", fontWeight: 900 }}>
            ← Social World
          </Link>
        </header>

        <section style={{ background: "#10233f", color: "white", borderRadius: 22, padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Privacy lock</h2>
          <div style={{ display: "grid", gap: 7, lineHeight: 1.55, opacity: 0.95 }}>
            <div>• Ρητή άδεια πριν από πρόσβαση.</div>
            <div>• Καμία αυτόματη αποθήκευση raw επαφών.</div>
            <div>• Discovery και invites παραμένουν ξεχωριστές επιλογές.</div>
            <div>• Η άδεια ανακαλείται άμεσα.</div>
            <div>• Matching θα χρησιμοποιεί hashed identifiers πριν από server-side σύγκριση.</div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={selectContacts} disabled={busy} style={primaryButtonStyle}>
              {busy ? "Άνοιγμα επαφών…" : "Επίλεξε επαφές από τη συσκευή"}
            </button>
            {contacts.length ? (
              <button type="button" onClick={clearContacts} style={secondaryButtonStyle}>
                Καθαρισμός επιλογής
              </button>
            ) : null}
          </div>

          {status ? <p style={{ marginTop: 14, color: "#40566e", lineHeight: 1.55 }}>{status}</p> : null}

          {contacts.length ? (
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {contacts.map((contact) => (
                <article key={contact.localId} style={{ border: "1px solid #dde7f1", borderRadius: 14, padding: 14 }}>
                  <strong>{contact.displayName || "Χωρίς όνομα"}</strong>
                  {contact.phones.map((phone) => (
                    <div key={phone} style={{ color: "#60758c", marginTop: 4 }}>{phone}</div>
                  ))}
                  {contact.emails.map((email) => (
                    <div key={email} style={{ color: "#60758c", marginTop: 4 }}>{email}</div>
                  ))}
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <p style={{ marginTop: 16, color: "#73879b", fontSize: 13, lineHeight: 1.5 }}>
          Policy: uploadRawContacts={String(CONTACT_SYNC_POLICY.uploadRawContacts)} · persistRawContacts={String(CONTACT_SYNC_POLICY.persistRawContacts)} · explicitConsent={String(CONTACT_SYNC_POLICY.requireExplicitConsent)}
        </p>
      </div>
    </main>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #dde7f1",
  borderRadius: 20,
  padding: 20,
} as const;

const primaryButtonStyle = {
  border: 0,
  borderRadius: 12,
  background: "#1267d6",
  color: "white",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #cbd9e7",
  borderRadius: 12,
  background: "white",
  color: "#10233f",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
} as const;
