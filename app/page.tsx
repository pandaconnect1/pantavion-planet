import Link from "next/link";
import { pantavionFamilies } from "@/core/platform/pantavion-registry";

export default function HomePage() {
  return (
    <>
      <section className="pv-hero pv-container">
        <div>
          <p className="pv-kicker">Pantavion One</p>
          <h1 className="pv-title">
            One Planet. <span>One Living Screen.</span> All Humanity Connected.
          </h1>
          <p className="pv-lead">
            Μία παγκόσμια πλατφόρμα όπου κάθε άνθρωπος μπορεί να μιλά, να ακούει,
            να διαβάζει, να βλέπει, να δημιουργεί, να μαθαίνει, να εργάζεται,
            να ψυχαγωγείται και να συνδέεται με οποιονδήποτε άνθρωπο, σε οποιαδήποτε
            γλώσσα, χώρα, κουλτούρα και κοινότητα — σε πραγματικό χρόνο.
          </p>

          <div className="pv-actions">
            <Link className="pv-button gold" href="/auth/register">Enter Pantavion</Link>
            <Link className="pv-button blue" href="/language">Try Language Bridge</Link>
            <Link className="pv-button" href="/intelligence/execute">Open PantaAI</Link>
            <Link className="pv-button" href="/dashboard">Dashboard</Link>
          </div>
        </div>

        <div className="pv-command-card">
          <div className="pv-command-inner">
            <div className="pv-orb" aria-label="Pantavion Orb Gateway" />
            <div className="pv-signal-row">
              <div className="pv-signal"><strong>Planet</strong>World screen</div>
              <div className="pv-signal"><strong>Language</strong>Text bridge live</div>
              <div className="pv-signal"><strong>PantaAI</strong>Intent execution</div>
              <div className="pv-signal"><strong>Safety</strong>Legal routes</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pv-section">
        <div className="pv-container">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Capability Families</p>
              <h2>Everything organized around one governed center.</h2>
            </div>
            <Link className="pv-button blue" href="/dashboard">Open living dashboard</Link>
          </div>

          <div className="pv-grid">
            {pantavionFamilies.map((family) => (
              <Link className="pv-card" href={family.routes[0]} key={family.key}>
                <span className="pv-status">{family.key}</span>
                <h3>{family.title}</h3>
                <p>{family.promise}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-section">
        <div className="pv-container pv-panel">
          <p className="pv-kicker">No dead buttons doctrine</p>
          <h2>All visible buttons now route somewhere real.</h2>
          <p className="pv-muted">
            This patch converts the static Pantavion idea into a real navigable platform foundation.
            Provider-heavy functions are labeled honestly instead of being faked.
          </p>
          <div className="pv-actions">
            <Link className="pv-button gold" href="/founding">Founding Access</Link>
            <Link className="pv-button" href="/pricing">Pricing</Link>
            <Link className="pv-button" href="/legal">Legal Center</Link>
            <Link className="pv-button" href="/download">Install App</Link>
          </div>
        </div>
      </section>
    </>
  );
}
