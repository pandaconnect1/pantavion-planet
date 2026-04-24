"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { pantavionLanguages } from "@/core/i18n/languages";

export default function RegisterClient() {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const identity = {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      country: String(data.get("country") ?? ""),
      language: String(data.get("language") ?? "el"),
      ageConfirmed: data.get("ageConfirmed") === "on",
      termsAccepted: data.get("termsAccepted") === "on",
      privacyAccepted: data.get("privacyAccepted") === "on",
      createdAt: new Date().toISOString(),
      mode: "local-foundation",
    };

    if (!identity.firstName || !identity.email || !identity.country) {
      setError("Συμπλήρωσε όνομα, email και χώρα.");
      return;
    }

    if (!identity.ageConfirmed || !identity.termsAccepted || !identity.privacyAccepted) {
      setError("Πρέπει να επιβεβαιώσεις age gate, Terms και Privacy πριν την είσοδο.");
      return;
    }

    localStorage.setItem("pantavion.identity", JSON.stringify(identity));
    localStorage.setItem("pantavion.session", "local-foundation");
    setSaved(true);
    setError("");
  }

  if (saved) {
    return (
      <div className="pv-panel">
        <span className="pv-status">Local identity saved</span>
        <h1>Η είσοδος βάσης ολοκληρώθηκε.</h1>
        <p className="pv-muted">
          Δημιουργήθηκε local foundation identity στο browser. Αυτό είναι πραγματική λειτουργία UI,
          αλλά όχι production authentication. Επόμενο βήμα: database, email verification, sessions.
        </p>
        <div className="pv-actions">
          <Link className="pv-button gold" href="/dashboard">Open Dashboard</Link>
          <Link className="pv-button" href="/onboarding/purpose">Continue Onboarding</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="pv-form pv-panel" onSubmit={submit}>
      <span className="pv-status">Register Foundation</span>
      <h1>Create Pantavion identity</h1>
      <p className="pv-muted">
        One account / one ecosystem. This route enforces age, terms and privacy gates before dashboard entry.
      </p>

      {error ? <div className="pv-result">{error}</div> : null}

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" autoComplete="given-name" />
        </div>
        <div className="pv-field">
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" autoComplete="family-name" />
        </div>
        <div className="pv-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" />
        </div>
      </div>

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" placeholder="Greece, Cyprus, United States..." />
        </div>
        <div className="pv-field">
          <label htmlFor="language">Primary language</label>
          <select id="language" name="language" defaultValue="el">
            {pantavionLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName} — {language.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="pv-checkbox">
        <input name="ageConfirmed" type="checkbox" />
        <span>Επιβεβαιώνω ότι πέρασα από age gate / χώρα / γλώσσα πριν την είσοδο.</span>
      </label>

      <label className="pv-checkbox">
        <input name="termsAccepted" type="checkbox" />
        <span>Αποδέχομαι τους Terms ως foundation route. Νομικό review απαιτείται πριν production.</span>
      </label>

      <label className="pv-checkbox">
        <input name="privacyAccepted" type="checkbox" />
        <span>Αποδέχομαι το Privacy foundation. Θα χρειαστεί versioned consent με backend.</span>
      </label>

      <button className="pv-button gold" type="submit">Create local foundation identity</button>

      <p className="pv-muted">
        Already entered? <Link href="/auth/login">Login</Link>
      </p>
    </form>
  );
}
