import type { CSSProperties } from "react";

const layerGroups = [
  {
    title: "Official network",
    items: [
      "Official water network",
      "Central mains",
      "Pipes",
      "Valves",
      "Service connections",
      "Meters where available",
      "Fittings where available",
    ],
  },
  {
    title: "Pantavion operational layers",
    items: [
      "Pending Pantavion edits",
      "Approved Pantavion edits",
      "As-built evidence",
      "Old / replaced network",
      "Faults and assigned jobs",
      "Technical address points",
    ],
  },
  {
    title: "Field intelligence",
    items: [
      "GPS / current location",
      "GSM / cell approximate location",
      "Take me there",
      "Offline area cache",
      "Sync status",
      "Low-data mode",
    ],
  },
];

const phaseOneChecks = [
  "Private real KMZ/KML/GIS import only",
  "Original source file remains locked",
  "No raw network download for normal users",
  "Mobile, tablet and desktop map-first view",
  "Search by road, area, coordinates and asset ID",
  "Technical Address support for missing roads/numbers",
  "Asset tap opens technical evidence window",
  "Access, views and sensitive actions are audit logged",
];

const assetCards = [
  {
    id: "VAL-000245",
    type: "Valve",
    detail: "Î¦110 / active / connected to PIPE-003812",
    status: "Example asset card",
  },
  {
    id: "PIPE-003812",
    type: "Pipe",
    detail: "UPVC / Î¦110 / depth when available / official layer",
    status: "Example asset card",
  },
  {
    id: "CONN-000291",
    type: "Service connection",
    detail: "Technical address ready when public address is missing",
    status: "Example asset card",
  },
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>PROTECTED PROFESSIONAL MODULE Â· PHASE 1A SHELL</div>
        <p style={styles.kicker}>Pantavion Professional Infrastructure</p>
        <h1 style={styles.title}>Water Network Control</h1>
        <p style={styles.subtitle}>
          Map-first protected workspace for the real water network: pipes,
          valves, service connections, technical addresses, location support,
          field evidence and future private KMZ/KML/GIS imports.
        </p>

        <div style={styles.securityStrip}>
          <span>No raw KMZ/KML download</span>
          <span>Private storage only</span>
          <span>Role-based access</span>
          <span>Audit-ready</span>
          <span>Mobile-first</span>
        </div>
      </section>

      <section style={styles.mapWorkspace} aria-label="Protected water network map shell">
        <aside style={styles.leftPanel}>
          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>Search / locate</p>
            <div style={styles.searchBox}>
              Road, area, coordinates, asset ID, valve ID, pipe ID...
            </div>
            <div style={styles.buttonGrid}>
              <button style={styles.goldButton}>Search</button>
              <button style={styles.darkButton}>Current location</button>
              <button style={styles.darkButton}>Take me there</button>
              <button style={styles.darkButton}>Manual point</button>
            </div>
          </div>

          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>Layer control</p>
            {layerGroups.map((group) => (
              <div key={group.title} style={styles.layerGroup}>
                <h2 style={styles.layerTitle}>{group.title}</h2>
                {group.items.map((item) => (
                  <label key={item} style={styles.layerItem}>
                    <input type="checkbox" defaultChecked={group.title === "Official network"} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section style={styles.mapPanel}>
          <div style={styles.mapTopBar}>
            <div>
              <p style={styles.mapLabel}>Live protected map area</p>
              <h2 style={styles.mapTitle}>Real network layer loads here after private import</h2>
            </div>
            <div style={styles.mapStatus}>OFFICIAL DATA NOT LOADED</div>
          </div>

          <WaterNetworkClient />

          <div style={styles.mapFooter}>
            <span>GPS: waiting</span>
            <span>GSM fallback: available when supported</span>
            <span>Offline cache: pending implementation</span>
            <span>Sync: no queue</span>
          </div>
        </section>

        <aside style={styles.rightPanel}>
          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>Selected asset</p>
            <div style={styles.assetEmpty}>
              Tap a pipe, valve, service connection or meter to open the
              technical evidence window.
            </div>
          </div>

          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>Example asset records</p>
            {assetCards.map((asset) => (
              <div key={asset.id} style={styles.assetCard}>
                <div style={styles.assetTop}>
                  <strong>{asset.id}</strong>
                  <span>{asset.type}</span>
                </div>
                <p>{asset.detail}</p>
                <small>{asset.status}</small>
              </div>
            ))}
          </div>

          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>Phase 1 acceptance</p>
            <ul style={styles.checkList}>
              {phaseOneChecks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section style={styles.doctrine}>
        <div>
          <p style={styles.kicker}>Production rule</p>
          <h2 style={styles.sectionTitle}>The map works first. Everything else follows.</h2>
        </div>
        <p style={styles.sectionText}>
          This route is a protected Phase 1A shell. It does not expose real
          water-network data. The next production step is a private import and
          conversion pipeline that transforms real KMZ/KML/GIS files into
          optimized protected map layers.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(circle at top, #1b2d58 0, #071020 42%, #02040b 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    maxWidth: 1480,
    margin: "0 auto 18px",
    padding: "18px 4px",
  },
  lockBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(246,200,95,.12)",
    border: "1px solid rgba(246,200,95,.35)",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1,
  },
  kicker: {
    margin: "16px 0 8px",
    color: "#f6c85f",
    letterSpacing: 3,
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: 1000,
  },
  title: {
    margin: 0,
    fontSize: "clamp(40px, 6vw, 84px)",
    lineHeight: 0.94,
  },
  subtitle: {
    maxWidth: 980,
    color: "#d8e0f4",
    fontSize: 18,
    lineHeight: 1.55,
  },
  securityStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  mapWorkspace: {
    maxWidth: 1480,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "300px minmax(0, 1fr) 330px",
    gap: 14,
    alignItems: "stretch",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  panelBlock: {
    padding: 16,
    borderRadius: 24,
    background: "rgba(8,16,32,.86)",
    border: "1px solid rgba(246,200,95,.22)",
    boxShadow: "0 20px 50px rgba(0,0,0,.28)",
  },
  panelLabel: {
    margin: "0 0 12px",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  searchBox: {
    padding: 13,
    borderRadius: 16,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(216,224,244,.18)",
    color: "#d8e0f4",
    fontSize: 13,
    lineHeight: 1.4,
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 10,
  },
  goldButton: {
    border: 0,
    borderRadius: 14,
    padding: "11px 10px",
    background: "#f6c85f",
    color: "#071020",
    fontWeight: 1000,
  },
  darkButton: {
    border: "1px solid rgba(246,200,95,.24)",
    borderRadius: 14,
    padding: "11px 10px",
    background: "rgba(255,255,255,.04)",
    color: "#fff8e7",
    fontWeight: 900,
  },
  layerGroup: {
    padding: "10px 0",
    borderTop: "1px solid rgba(216,224,244,.12)",
  },
  layerTitle: {
    margin: "0 0 8px",
    fontSize: 15,
  },
  layerItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#d8e0f4",
    fontSize: 13,
    padding: "5px 0",
  },
  mapPanel: {
    minHeight: 690,
    borderRadius: 30,
    overflow: "hidden",
    background: "rgba(8,16,32,.92)",
    border: "1px solid rgba(246,200,95,.28)",
    boxShadow: "0 24px 70px rgba(0,0,0,.36)",
    display: "flex",
    flexDirection: "column",
  },
  mapTopBar: {
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    borderBottom: "1px solid rgba(216,224,244,.12)",
  },
  mapLabel: {
    margin: "0 0 5px",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  mapTitle: {
    margin: 0,
    fontSize: 20,
  },
  mapStatus: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,92,92,.4)",
    color: "#ffb3b3",
    background: "rgba(255,48,64,.08)",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  fakeMap: {
    position: "relative",
    flex: 1,
    minHeight: 560,
    overflow: "hidden",
    background:
      "linear-gradient(135deg, rgba(16,35,68,.9), rgba(5,12,24,.94)), radial-gradient(circle at 28% 30%, rgba(246,200,95,.08), transparent 34%)",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    opacity: 0.55,
  },
  pipeLine: {
    position: "absolute",
    height: 7,
    borderRadius: 999,
    background: "linear-gradient(90deg, #f6c85f, #fff1ad)",
    boxShadow: "0 0 22px rgba(246,200,95,.35)",
    transformOrigin: "left center",
  },
  pipeMain: {
    width: "72%",
    left: "12%",
    top: "48%",
    transform: "rotate(-8deg)",
  },
  pipeSecondary: {
    width: "42%",
    left: "42%",
    top: "34%",
    transform: "rotate(28deg)",
    opacity: 0.84,
  },
  pipeBranch: {
    width: "32%",
    left: "23%",
    top: "62%",
    transform: "rotate(-35deg)",
    opacity: 0.78,
  },
  assetPoint: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#f6c85f",
    color: "#071020",
    fontWeight: 1000,
    boxShadow: "0 0 0 8px rgba(246,200,95,.14)",
  },
  locationPulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#4fd1ff",
    boxShadow: "0 0 0 12px rgba(79,209,255,.18)",
  },
  mapNotice: {
    position: "absolute",
    left: 18,
    bottom: 18,
    right: 18,
    padding: 16,
    borderRadius: 22,
    background: "rgba(2,4,11,.78)",
    border: "1px solid rgba(246,200,95,.24)",
    display: "grid",
    gap: 6,
    color: "#d8e0f4",
  },
  mapFooter: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 13,
    borderTop: "1px solid rgba(216,224,244,.12)",
    color: "#d8e0f4",
    fontSize: 12,
  },
  assetEmpty: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,.05)",
    color: "#d8e0f4",
    lineHeight: 1.45,
  },
  assetCard: {
    padding: 13,
    borderRadius: 16,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(216,224,244,.12)",
    marginBottom: 10,
    color: "#d8e0f4",
  },
  assetTop: {
    display: "flex",
    justifyContent: "space-between",
    color: "#fff8e7",
    gap: 10,
  },
  checkList: {
    margin: 0,
    paddingLeft: 18,
    color: "#d8e0f4",
    lineHeight: 1.55,
    fontSize: 13,
  },
  doctrine: {
    maxWidth: 1480,
    margin: "18px auto 0",
    padding: 22,
    borderRadius: 28,
    background: "rgba(246,200,95,.08)",
    border: "1px solid rgba(246,200,95,.22)",
    display: "grid",
    gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)",
    gap: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "clamp(26px, 4vw, 46px)",
    lineHeight: 1.05,
  },
  sectionText: {
    margin: 0,
    color: "#d8e0f4",
    fontSize: 16,
    lineHeight: 1.6,
  },
};

