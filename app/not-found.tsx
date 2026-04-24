import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="pv-section">
      <div className="pv-container pv-panel">
        <span className="pv-status red">Route not mapped</span>
        <h1>Αυτό το route δεν έχει μπει ακόμα στο Pantavion registry.</h1>
        <p className="pv-muted">
          Για να μην υπάρχουν νεκρά κουμπιά, κάθε public route πρέπει να μπει στο registry
          με status, works-now και next integrations.
        </p>
        <div className="pv-actions">
          <Link className="pv-button gold" href="/dashboard">Open Dashboard</Link>
          <Link className="pv-button" href="/">Home</Link>
        </div>
      </div>
    </section>
  );
}
