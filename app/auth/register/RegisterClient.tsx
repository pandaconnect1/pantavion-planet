"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { pantavionLanguages } from "@/core/i18n/languages";
import { signUp } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="pv-button gold" type="submit" disabled={pending}>
      {pending ? "Creating secure identity..." : "Create Pantavion account"}
    </button>
  );
}

export default function RegisterClient() {
  return (
    <form className="pv-form pv-panel" action={signUp}>
      <span className="pv-status">Pantavion Secure Registration</span>
      <h1>Create your Pantavion identity</h1>
      <p className="pv-muted">
        One account for Pantavion. Your password stays inside the authentication system; private identity data is separated from your public profile.
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
          <label htmlFor="birthDate">Date of birth</label>
          <input id="birthDate" name="birthDate" type="date" autoComplete="bday" required />
        </div>
        <div className="pv-field">
          <label htmlFor="email">Primary email</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={320} required />
        </div>
        <div className="pv-field">
          <label htmlFor="phone">Primary phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+35799123456" pattern="\+[1-9][0-9]{7,14}" required />
          <small className="pv-muted">International format, for example +357…</small>
        </div>
        <div className="pv-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
          <small className="pv-muted">Use 12+ characters. Passkeys/security keys are added after verification where supported.</small>
        </div>
      </div>

      <h2>Location</h2>
      <p className="pv-muted">Used for safe regional organization and discovery. Your exact home address is not public.</p>
      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="continentCode">Continent</label>
          <select id="continentCode" name="continentCode" required defaultValue="EU">
            <option value="AF">Africa</option>
            <option value="AN">Antarctica</option>
            <option value="AS">Asia</option>
            <option value="EU">Europe</option>
            <option value="NA">North America</option>
            <option value="OC">Oceania</option>
            <option value="SA">South America</option>
          </select>
        </div>
        <div className="pv-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" autoComplete="country-name" maxLength={100} required />
        </div>
        <div className="pv-field">
          <label htmlFor="countryCode">Country code</label>
          <input id="countryCode" name="countryCode" autoCapitalize="characters" placeholder="CY" pattern="[A-Za-z]{2}" minLength={2} maxLength={2} required />
          <small className="pv-muted">ISO two-letter code, for example CY, GR, GB.</small>
        </div>
        <div className="pv-field">
          <label htmlFor="region">Region / Province</label>
          <input id="region" name="region" autoComplete="address-level1" maxLength={120} required />
        </div>
        <div className="pv-field">
          <label htmlFor="city">City / Area</label>
          <input id="city" name="city" autoComplete="address-level2" maxLength={120} required />
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
        <input name="assistedSetup" type="checkbox" />
        <span>I prefer assisted setup with simpler, guided security steps.</span>
      </label>
      <label className="pv-checkbox">
        <input name="termsAccepted" type="checkbox" required />
        <span>I accept the Terms of Use.</span>
      </label>
      <label className="pv-checkbox">
        <input name="privacyAccepted" type="checkbox" required />
        <span>I acknowledge the Privacy Policy and the use of my information for account creation and security.</span>
      </label>

      <div className="pv-panel">
        <strong>Photo & identity verification</strong>
        <p className="pv-muted">
          Profile photo, live selfie/liveness and stronger identity checks are completed after the account is verified. Protected/public-figure accounts require enhanced review. No biometric template is claimed or stored by this registration form.
        </p>
      </div>

      <SubmitButton />
      <p className="pv-muted">Already registered? <Link href="/auth/login">Login</Link></p>
    </form>
  );
}
