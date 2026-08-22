import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-panel pv-form">
          <span className="pv-status">Email Verification</span>
          <h1>Έλεγξε το email σου</h1>
          <p className="pv-muted">
            Αν δημιουργήθηκε λογαριασμός, το Pantavion έστειλε σύνδεσμο επιβεβαίωσης. Μετά την επιβεβαίωση θα συνεχίσεις στην ασφαλή ολοκλήρωση προφίλ.
          </p>
          <div className="pv-result">
            Η επιβεβαίωση email δεν ενεργοποιεί από μόνη της δημόσια προβολή ή discoverability.
          </div>
          <div className="pv-actions">
            <Link className="pv-button gold" href="/auth/login">Σύνδεση</Link>
            <Link className="pv-button" href="/">Αρχική</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
