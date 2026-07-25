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

export default function RegisterClient() {
  return (
    <form className="pv-form pv-panel" action={signUp}>
      <span className="pv-status">Secure Registration</span>
      <h1>Create Pantavion identity</h1>
      <p className="pv-muted">Your account is created securely in Supabase and requires email verification.</p>

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" name="displayName" autoComplete="name" required />
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
          <input id="country" name="country" autoComplete="country-name" required />
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
        <input name="ageConfirmed" type="checkbox" required />
        <span>Επιβεβαιώνω ότι πληρώ το απαιτούμενο ηλικιακό όριο.</span>
      </label>
      <label className="pv-checkbox">
        <input name="termsAccepted" type="checkbox" required />
        <span>Αποδέχομαι τους Όρους Χρήσης και την Πολιτική Απορρήτου.</span>
      </label>

      <SubmitButton />
      <p className="pv-muted">Already registered? <Link href="/auth/login">Login</Link></p>
    </form>
  );
}
