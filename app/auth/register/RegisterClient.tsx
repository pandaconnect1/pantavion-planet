"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { pantavionLanguages } from "@/core/i18n/languages";
import { signUp } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="pv-button gold" type="submit" disabled={pending}>
      {pending ? "Creating account..." : "Create Pantavion account"}
    </button>
  );
}

const errorLabel: Record<string, string> = {
  invalid_input: "Έλεγξε τα στοιχεία και τις δύο υποχρεωτικές συναινέσεις.",
  registration_closed: "Οι δημόσιες εγγραφές παραμένουν κλειστές από το production launch gate.",
};

export default function RegisterClient({
  registrationEnabled,
  requiredLaunchState,
  gateReason,
  errorCode,
}: {
  registrationEnabled: boolean;
  requiredLaunchState: string;
  gateReason: string;
  errorCode: string;
}) {
  if (!registrationEnabled) {
    return (
      <section className="pv-panel pv-form">
        <span className="pv-status">Production Registration Gate</span>
        <h1>Οι δημόσιες εγγραφές δεν έχουν ανοίξει ακόμη</h1>
        <p className="pv-muted">
          Το Pantavion δεν δημιουργεί δημόσιους λογαριασμούς μέχρι τα κρίσιμα launch components να περάσουν το απαιτούμενο production state.
        </p>
        <div className="pv-result">
          <strong>Απαιτούμενη κατάσταση:</strong> {requiredLaunchState}
          <br />
          <strong>Τρέχων λόγος:</strong> {gateReason}
        </div>
        {errorCode ? <div className="pv-result">{errorLabel[errorCode] ?? errorCode}</div> : null}
        <div className="pv-actions">
          <Link className="pv-button" href="/auth/login">Σύνδεση υπάρχοντος λογαριασμού</Link>
          <Link className="pv-button" href="/">Αρχική</Link>
        </div>
      </section>
    );
  }

  return (
    <form className="pv-form pv-panel" action={signUp}>
      <span className="pv-status">Secure Registration</span>
      <h1>Create Pantavion identity</h1>
      <p className="pv-muted">
        Ο λογαριασμός δημιουργείται στο Supabase, απαιτεί επιβεβαίωση email και μετά ολοκλήρωση του ιδιωτικού age-safety profile.
      </p>
      {errorCode ? <div className="pv-result">{errorLabel[errorCode] ?? errorCode}</div> : null}

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" autoComplete="given-name" maxLength={80} required />
        </div>
        <div className="pv-field">
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" autoComplete="family-name" maxLength={80} required />
        </div>
        <div className="pv-field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" name="displayName" autoComplete="nickname" maxLength={120} required />
        </div>
        <div className="pv-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" pattern="[a-zA-Z0-9_]{3,30}" minLength={3} maxLength={30} required />
        </div>
        <div className="pv-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="pv-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
      </div>

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" autoComplete="country-name" maxLength={120} required />
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
        <input name="termsAccepted" type="checkbox" required />
        <span>Αποδέχομαι τους Όρους Χρήσης.</span>
      </label>
      <label className="pv-checkbox">
        <input name="privacyAccepted" type="checkbox" required />
        <span>Αποδέχομαι την Πολιτική Απορρήτου.</span>
      </label>

      <SubmitButton />
      <p className="pv-muted">Already registered? <Link href="/auth/login">Login</Link></p>
    </form>
  );
}
