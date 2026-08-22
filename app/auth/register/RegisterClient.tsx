"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { pantavionLanguages } from "@/core/i18n/languages";
import { signUp } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="pv-button gold" type="submit" disabled={pending}>
      {pending ? "Checking launch gate..." : "Create Pantavion account"}
    </button>
  );
}

export default function RegisterClient() {
  return (
    <form className="pv-form pv-panel" action={signUp}>
      <span className="pv-status">Pantavion Secure Registration</span>
      <h1>Create your Pantavion identity</h1>
      <p className="pv-muted">
        Registration follows the live Pantavion launch gate. Private identity and security data remain separate from the public profile.
      </p>

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
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoCapitalize="none" pattern="[a-zA-Z0-9_]{3,30}" minLength={3} maxLength={30} required />
        </div>
        <div className="pv-field">
          <label htmlFor="email">Primary email</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={320} required />
        </div>
        <div className="pv-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
          <small className="pv-muted">Minimum 12 characters.</small>
        </div>
        <div className="pv-field">
          <label htmlFor="declaredAgeGroup">Age group</label>
          <select id="declaredAgeGroup" name="declaredAgeGroup" defaultValue="" required>
            <option value="" disabled>Select age group</option>
            <option value="minor">Under 18</option>
            <option value="adult">18 or older</option>
          </select>
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
        <span>I accept the Terms of Service.</span>
      </label>
      <label className="pv-checkbox">
        <input name="privacyAccepted" type="checkbox" required />
        <span>I acknowledge the Privacy Policy.</span>
      </label>

      <div className="pv-panel">
        <strong>Launch safety</strong>
        <p className="pv-muted">
          If public registration is not VERIFIED_LIVE, account creation stays closed instead of silently bypassing the production safety gate.
        </p>
      </div>

      <SubmitButton />
      <p className="pv-muted">Already registered? <Link href="/auth/login">Login</Link></p>
    </form>
  );
}
