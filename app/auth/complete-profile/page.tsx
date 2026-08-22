import { redirect } from "next/navigation";
import { pantavionLanguages } from "@/core/i18n/languages";
import { createClient } from "@/lib/supabase/server";
import { completeRegistrationProfile } from "../actions";

type SearchParams = Promise<{ error?: string | string[] }>;

const errorLabel: Record<string, string> = {
  invalid_profile: "Έλεγξε τα στοιχεία του προφίλ.",
  invalid_date_of_birth: "Η ημερομηνία γέννησης δεν είναι έγκυρη.",
  username_taken: "Το username χρησιμοποιείται ήδη.",
  completion_failed: "Η ολοκλήρωση προφίλ δεν ολοκληρώθηκε. Δεν άλλαξε η κατάσταση λογαριασμού.",
};

export default async function CompleteProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/auth/complete-profile");

  const [{ data: registration }, { data: profile }] = await Promise.all([
    supabase
      .from("profile_registration_states")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("username,display_name,country,country_code,language")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (registration?.state === "email_confirmation_pending") redirect("/auth/check-email");
  if (registration?.state === "active" || registration?.state === "minor_protected") {
    redirect("/profile");
  }

  return (
    <section className="pv-section">
      <div className="pv-container">
        <form className="pv-form pv-panel" action={completeRegistrationProfile}>
          <span className="pv-status">Secure Profile Completion</span>
          <h1>Ολοκλήρωση Pantavion identity</h1>
          <p className="pv-muted">
            Τα στοιχεία ηλικίας χρησιμοποιούνται ιδιωτικά για να εφαρμοστούν οι σωστές age-safety προστασίες. Η ημερομηνία γέννησης δεν δημοσιεύεται στο δημόσιο προφίλ.
          </p>
          {errorCode ? <div className="pv-result">{errorLabel[errorCode] ?? errorCode}</div> : null}

          <div className="pv-grid">
            <div className="pv-field">
              <label htmlFor="legalFirstName">Legal first name</label>
              <input
                id="legalFirstName"
                name="legalFirstName"
                autoComplete="given-name"
                defaultValue={String(user.user_metadata?.first_name ?? "")}
                maxLength={80}
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="legalLastName">Legal last name</label>
              <input
                id="legalLastName"
                name="legalLastName"
                autoComplete="family-name"
                defaultValue={String(user.user_metadata?.last_name ?? "")}
                maxLength={80}
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                name="displayName"
                defaultValue={profile?.display_name ?? String(user.user_metadata?.display_name ?? "")}
                maxLength={120}
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                defaultValue={profile?.username ?? String(user.user_metadata?.username ?? "")}
                pattern="[a-zA-Z0-9_]{3,30}"
                minLength={3}
                maxLength={30}
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" required />
            </div>
            <div className="pv-field">
              <label htmlFor="countryCode">Country code (ISO 2 letters)</label>
              <input
                id="countryCode"
                name="countryCode"
                defaultValue={profile?.country_code ?? ""}
                pattern="[A-Za-z]{2}"
                minLength={2}
                maxLength={2}
                placeholder="CY"
                autoCapitalize="characters"
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                autoComplete="country-name"
                defaultValue={profile?.country ?? String(user.user_metadata?.country ?? "")}
                maxLength={120}
                required
              />
            </div>
            <div className="pv-field">
              <label htmlFor="language">Primary language</label>
              <select
                id="language"
                name="language"
                defaultValue={profile?.language ?? String(user.user_metadata?.language ?? "el")}
              >
                {pantavionLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeName} — {language.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pv-result">
            Με την υποβολή, το production database guard υπολογίζει την ηλικιακή κατηγορία και εφαρμόζει τις αντίστοιχες privacy/safety ρυθμίσεις πριν ενεργοποιηθεί η εγγραφή.
          </div>
          <button className="pv-button gold" type="submit">Ολοκλήρωση προφίλ</button>
        </form>
      </div>
    </section>
  );
}
