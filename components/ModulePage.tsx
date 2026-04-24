import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { pantavionFamilies, type PantavionRoute } from "@/core/platform/pantavion-registry";

export function ModulePage({ route }: { route: PantavionRoute }) {
  const relatedFamily = pantavionFamilies.find((family) =>
    family.routes.includes(route.path)
  );

  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-panel">
          <StatusBadge status={route.status} />
          <p className="pv-kicker">{route.family}</p>
          <h1 className="pv-title" style={{ fontSize: "clamp(38px, 6vw, 72px)" }}>
            {route.title}
          </h1>
          <p className="pv-lead">{route.summary}</p>

          <div className="pv-grid" style={{ marginTop: 26 }}>
            <div className="pv-card">
              <h3>Works now</h3>
              <ul>
                {route.worksNow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pv-card">
              <h3>Next integrations</h3>
              <ul>
                {route.next.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pv-card">
              <h3>Connected routes</h3>
              <p>{relatedFamily?.promise ?? "This route is part of the Pantavion capability system."}</p>
              <div className="pv-actions">
                <Link className="pv-button blue" href="/dashboard">Open Dashboard</Link>
                <Link className="pv-button" href="/intelligence/execute">Use PantaAI</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
