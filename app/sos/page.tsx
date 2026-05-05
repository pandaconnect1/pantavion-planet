"use client";

import { useEffect, useMemo, useState } from "react";

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export default function PantavionSosPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [locationText, setLocationText] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("pantavion_emergency_contacts_v1");
    if (stored) {
      setContacts(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pantavion_emergency_contacts_v1", JSON.stringify(contacts));
  }, [contacts]);

  const message = useMemo(
    () =>
      [
        "PANTAVION SOS",
        "I need help.",
        locationText ? `Location: ${locationText}` : "Location: not shared yet.",
        contacts.length
          ? `Emergency contacts: ${contacts.map((contact) => `${contact.name} ${contact.phone}`).join(", ")}`
          : "No emergency contacts saved yet.",
        "This message is prepared locally by Pantavion. Call local emergency services if there is immediate danger.",
      ].join("\n"),
    [contacts, locationText],
  );

  function addContact() {
    if (!name.trim() || !phone.trim()) return;
    setContacts((current) => [...current, { name: name.trim(), phone: phone.trim(), relation: relation.trim() || "trusted contact" }]);
    setName("");
    setPhone("");
    setRelation("");
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setNotice("Geolocation is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationText(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setNotice("Location captured locally.");
      },
      () => setNotice("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function startSosCountdown() {
    setCountdown(10);
    setNotice("SOS countdown started. Cancel if this is a mistake.");

    let remaining = 10;
    const timer = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        setNotice("SOS message is ready. Copy it or call/send it to your trusted contacts and local emergency number.");
      }
    }, 1000);
  }

  function cancelSos() {
    setCountdown(null);
    setNotice("SOS cancelled.");
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setNotice("SOS message copied.");
  }

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <p style={styles.kicker}>PANTAVION_SOS_AI_CENTER_V1</p>
        <h1 style={styles.title}>Pantavion SOS Center</h1>
        <p style={styles.subtitle}>
          Trusted contacts first, local emergency identity, elder-simple flow, and Universal Interpreter connection. No automatic authority dispatch is claimed without certified agreements.
        </p>
      </section>

      <section style={styles.panel}>
        <div style={styles.actions}>
          <button type="button" onClick={startSosCountdown} style={styles.redButton}>
            RED SOS
          </button>
          <button type="button" onClick={cancelSos} style={styles.secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={getLocation} style={styles.secondaryButton}>
            Capture location
          </button>
          <button type="button" onClick={copyMessage} style={styles.secondaryButton}>
            Copy SOS message
          </button>
          <a href="/translate" style={styles.goldLink}>
            Open interpreter
          </a>
          <a href="/sos/elder" style={styles.goldLink}>
            Elder simple mode
          </a>
        </div>

        {countdown !== null ? <p style={styles.countdown}>Countdown: {countdown}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        <section style={styles.contactGrid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Emergency Circle</h2>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" style={styles.input} />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" style={styles.input} />
            <input value={relation} onChange={(event) => setRelation(event.target.value)} placeholder="Relation" style={styles.input} />
            <button type="button" onClick={addContact} style={styles.primaryButton}>
              Add trusted contact
            </button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Prepared SOS message</h2>
            <pre style={styles.pre}>{message}</pre>
          </div>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "42px",
    background: "radial-gradient(circle at top, #33121b 0, #071020 42%, #030712 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: { maxWidth: 1040, margin: "0 auto 28px" },
  kicker: { color: "#ffb35c", letterSpacing: 2, fontSize: 12, fontWeight: 800 },
  title: { fontSize: "clamp(38px, 7vw, 82px)", lineHeight: 0.95, margin: "10px 0" },
  subtitle: { color: "#f1d6d6", maxWidth: 820, fontSize: 18, lineHeight: 1.6 },
  panel: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 22,
    borderRadius: 26,
    background: "rgba(8,16,32,.86)",
    border: "1px solid rgba(246,200,95,.28)",
    boxShadow: "0 24px 90px rgba(0,0,0,.36)",
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 },
  redButton: { border: 0, borderRadius: 22, padding: "18px 28px", background: "#ff2f3f", color: "#fff", fontWeight: 1000, fontSize: 20 },
  secondaryButton: { border: "1px solid rgba(246,200,95,.42)", borderRadius: 999, padding: "14px 18px", background: "transparent", color: "#fff8e7", fontWeight: 800 },
  primaryButton: { border: 0, borderRadius: 999, padding: "14px 18px", background: "#f6c85f", color: "#081020", fontWeight: 900 },
  goldLink: { border: "1px solid rgba(246,200,95,.42)", borderRadius: 999, padding: "14px 18px", color: "#f6c85f", textDecoration: "none", fontWeight: 900 },
  countdown: { fontSize: 38, color: "#ff8f8f", fontWeight: 1000 },
  notice: { color: "#f6c85f", fontWeight: 800 },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { padding: 18, borderRadius: 20, background: "rgba(255,255,255,.045)", border: "1px solid rgba(246,200,95,.18)" },
  cardTitle: { color: "#f6c85f" },
  input: { width: "100%", boxSizing: "border-box", marginBottom: 10, padding: 13, borderRadius: 14, border: "1px solid rgba(246,200,95,.35)", background: "#050b18", color: "#fff" },
  pre: { whiteSpace: "pre-wrap", color: "#fff", lineHeight: 1.5 },
};
