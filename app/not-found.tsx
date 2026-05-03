import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="pv-section">
      <div className="pv-container pv-panel">
        <span className="pv-status red">Page unavailable</span>
        <h1>Η σελίδα δεν είναι ακόμη διαθέσιμη.</h1>
        <p className="pv-muted">
          Το Pantavion ανοίγει μόνο πραγματικές, ελεγμένες επιφάνειες. 
          Επιστρέψτε στην αρχική ή ανοίξτε το κέντρο ασφάλειας.
        </p>
        <div className="pv-actions">
          <Link className="pv-button gold" href="/safety">Κέντρο ασφάλειας</Link>
          <Link className="pv-button" href="/">Αρχική</Link>
        </div>
      </div>
    </section>
  );
}
