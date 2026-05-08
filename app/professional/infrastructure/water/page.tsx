import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";



const layerGroups = [
  {
    title: "\u0395\u03c0\u03af\u03c3\u03b7\u03bc\u03bf \u03b4\u03af\u03ba\u03c4\u03c5\u03bf",
    items: [
      "\u0394\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2",
      "\u039a\u03b5\u03bd\u03c4\u03c1\u03b9\u03ba\u03bf\u03af \u03b1\u03b3\u03c9\u03b3\u03bf\u03af",
      "\u03a3\u03c9\u03bb\u03ae\u03bd\u03b5\u03c2",
      "\u0392\u03ac\u03bd\u03b5\u03c2",
      "\u03a0\u03b1\u03c1\u03bf\u03c7\u03ad\u03c2",
      "\u039c\u03b5\u03c4\u03c1\u03b7\u03c4\u03ad\u03c2 \u03cc\u03c0\u03bf\u03c5 \u03c5\u03c0\u03ac\u03c1\u03c7\u03bf\u03c5\u03bd",
      "\u0395\u03be\u03b1\u03c1\u03c4\u03ae\u03bc\u03b1\u03c4\u03b1 \u03cc\u03c0\u03bf\u03c5 \u03c5\u03c0\u03ac\u03c1\u03c7\u03bf\u03c5\u03bd",
    ],
  },
  {
    title: "\u039b\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03b9\u03ba\u03ac \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1 Pantavion",
    items: [
      "\u0395\u03ba\u03ba\u03c1\u03b5\u03bc\u03b5\u03af\u03c2 \u03c3\u03b7\u03bc\u03b5\u03b9\u03ce\u03c3\u03b5\u03b9\u03c2",
      "\u0395\u03b3\u03ba\u03b5\u03ba\u03c1\u03b9\u03bc\u03ad\u03bd\u03b5\u03c2 \u03b1\u03bb\u03bb\u03b1\u03b3\u03ad\u03c2",
      "\u03a6\u03c9\u03c4\u03bf\u03b3\u03c1\u03b1\u03c6\u03af\u03b5\u03c2 / as-built \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1",
      "\u03a0\u03b1\u03bb\u03b9\u03cc \u03ae \u03b1\u03bd\u03c4\u03b9\u03ba\u03b1\u03c4\u03b5\u03c3\u03c4\u03b7\u03bc\u03ad\u03bd\u03bf \u03b4\u03af\u03ba\u03c4\u03c5\u03bf",
      "\u0392\u03bb\u03ac\u03b2\u03b5\u03c2 \u03ba\u03b1\u03b9 \u03b5\u03c1\u03b3\u03b1\u03c3\u03af\u03b5\u03c2 \u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03b5\u03af\u03c9\u03bd",
      "\u03a4\u03b5\u03c7\u03bd\u03b9\u03ba\u03ac \u03c3\u03b7\u03bc\u03b5\u03af\u03b1 \u03b4\u03b9\u03b5\u03c5\u03b8\u03cd\u03bd\u03c3\u03b5\u03c9\u03bd",
    ],
  },
  {
    title: "\u03a0\u03b5\u03b4\u03af\u03bf / \u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03b5\u03af\u03bf",
    items: [
      "GPS / \u03c4\u03c1\u03ad\u03c7\u03bf\u03c5\u03c3\u03b1 \u03b8\u03ad\u03c3\u03b7",
      "GSM / \u03ba\u03b1\u03c4\u03ac \u03c0\u03c1\u03bf\u03c3\u03ad\u03b3\u03b3\u03b9\u03c3\u03b7 \u03b8\u03ad\u03c3\u03b7",
      "\u03a0\u03ae\u03b3\u03b1\u03b9\u03bd\u03ad \u03bc\u03b5 \u03c3\u03c4\u03bf \u03c3\u03b7\u03bc\u03b5\u03af\u03bf",
      "Offline \u03b1\u03c0\u03bf\u03b8\u03ae\u03ba\u03b5\u03c5\u03c3\u03b7 \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae\u03c2",
      "\u039a\u03b1\u03c4\u03ac\u03c3\u03c4\u03b1\u03c3\u03b7 \u03c3\u03c5\u03b3\u03c7\u03c1\u03bf\u03bd\u03b9\u03c3\u03bc\u03bf\u03cd",
      "\u0395\u03bb\u03b1\u03c6\u03c1\u03b9\u03ac \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1 \u03b4\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03c9\u03bd",
    ],
  },
];


const phaseOneChecks = [
  "\u0399\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03ae \u03b5\u03b9\u03c3\u03b1\u03b3\u03c9\u03b3\u03ae \u03c0\u03c1\u03b1\u03b3\u03bc\u03b1\u03c4\u03b9\u03ba\u03bf\u03cd KMZ/KML/GIS",
  "\u03a4\u03bf \u03b1\u03c5\u03b8\u03b5\u03bd\u03c4\u03b9\u03ba\u03cc \u03b1\u03c1\u03c7\u03b5\u03af\u03bf \u03bc\u03ad\u03bd\u03b5\u03b9 \u03ba\u03bb\u03b5\u03b9\u03b4\u03c9\u03bc\u03ad\u03bd\u03bf",
  "\u039a\u03b1\u03bc\u03af\u03b1 \u03b4\u03b7\u03bc\u03cc\u03c3\u03b9\u03b1 \u03bb\u03ae\u03c8\u03b7 \u03c4\u03bf\u03c5 \u03b1\u03c1\u03c7\u03b9\u03ba\u03bf\u03cd \u03b4\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5",
  "\u03a0\u03c1\u03bf\u03b2\u03bf\u03bb\u03ae \u03c0\u03c1\u03ce\u03c4\u03b1 \u03b3\u03b9\u03b1 \u03ba\u03b9\u03bd\u03b7\u03c4\u03cc, tablet \u03ba\u03b1\u03b9 PC",
  "\u0391\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03bc\u03b5 \u03bf\u03b4\u03cc, \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae, \u03c3\u03c5\u03bd\u03c4\u03b5\u03c4\u03b1\u03b3\u03bc\u03ad\u03bd\u03b5\u03c2 \u03ba\u03b1\u03b9 asset ID",
  "\u03a4\u03b5\u03c7\u03bd\u03b9\u03ba\u03ae \u03b4\u03b9\u03b5\u03cd\u03b8\u03c5\u03bd\u03c3\u03b7 \u03b3\u03b9\u03b1 \u03b4\u03c1\u03cc\u03bc\u03bf\u03c5\u03c2/\u03b1\u03c1\u03b9\u03b8\u03bc\u03bf\u03cd\u03c2 \u03c0\u03bf\u03c5 \u03bb\u03b5\u03af\u03c0\u03bf\u03c5\u03bd",
  "\u03a0\u03ac\u03c4\u03b7\u03bc\u03b1 \u03c3\u03b5 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf \u03b1\u03bd\u03bf\u03af\u03b3\u03b5\u03b9 \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03ac \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1",
  "\u039a\u03b1\u03c4\u03b1\u03b3\u03c1\u03b1\u03c6\u03ae \u03c0\u03c1\u03cc\u03c3\u03b2\u03b1\u03c3\u03b7\u03c2 \u03ba\u03b1\u03b9 \u03b5\u03c5\u03b1\u03af\u03c3\u03b8\u03b7\u03c4\u03c9\u03bd \u03b5\u03bd\u03b5\u03c1\u03b3\u03b5\u03b9\u03ce\u03bd",
];


const assetCards = [
  {
    id: "VAL-000245",
    type: "\u0392\u03ac\u03bd\u03b1",
    detail: "\u03a6110 / \u03b5\u03bd\u03b5\u03c1\u03b3\u03ae / \u03c3\u03cd\u03bd\u03b4\u03b5\u03c3\u03b7 \u03bc\u03b5 PIPE-003812",
    status: "\u03a0\u03b1\u03c1\u03ac\u03b4\u03b5\u03b9\u03b3\u03bc\u03b1 \u03ba\u03b1\u03c1\u03c4\u03ad\u03bb\u03b1\u03c2 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf\u03c5",
  },
  {
    id: "PIPE-003812",
    type: "\u0391\u03b3\u03c9\u03b3\u03cc\u03c2",
    detail: "UPVC / \u03a6110 / \u03b2\u03ac\u03b8\u03bf\u03c2 \u03cc\u03c4\u03b1\u03bd \u03c5\u03c0\u03ac\u03c1\u03c7\u03b5\u03b9 / \u03b5\u03c0\u03af\u03c3\u03b7\u03bc\u03bf layer",
    status: "\u03a0\u03b1\u03c1\u03ac\u03b4\u03b5\u03b9\u03b3\u03bc\u03b1 \u03ba\u03b1\u03c1\u03c4\u03ad\u03bb\u03b1\u03c2 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf\u03c5",
  },
  {
    id: "CONN-000291",
    type: "\u03a0\u03b1\u03c1\u03bf\u03c7\u03ae",
    detail: "\u0388\u03c4\u03bf\u03b9\u03bc\u03b7 \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03ae \u03b4\u03b9\u03b5\u03cd\u03b8\u03c5\u03bd\u03c3\u03b7 \u03cc\u03c4\u03b1\u03bd \u03bb\u03b5\u03af\u03c0\u03b5\u03b9 \u03b4\u03b7\u03bc\u03cc\u03c3\u03b9\u03b1 \u03b4\u03b9\u03b5\u03cd\u03b8\u03c5\u03bd\u03c3\u03b7",
    status: "\u03a0\u03b1\u03c1\u03ac\u03b4\u03b5\u03b9\u03b3\u03bc\u03b1 \u03ba\u03b1\u03c1\u03c4\u03ad\u03bb\u03b1\u03c2 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf\u03c5",
  },
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>{"\u03a0\u03a1\u039f\u03a3\u03a4\u0391\u03a4\u0395\u03a5\u039c\u0395\u039d\u0397 \u0395\u03a0\u0391\u0393\u0393\u0395\u039b\u039c\u0391\u03a4\u0399\u039a\u0397 \u0395\u039d\u039f\u03a4\u0397\u03a4\u0391 \u00b7 \u0394\u0399\u039a\u03a4\u03a5\u039f \u03a5\u0394\u03a1\u0395\u03a5\u03a3\u0397\u03a3"}</div>
        <p style={styles.kicker}>{"Pantavion \u03b5\u03c0\u03b1\u03b3\u03b3\u03b5\u03bb\u03bc\u03b1\u03c4\u03b9\u03ba\u03ae \u03c5\u03c0\u03bf\u03b4\u03bf\u03bc\u03ae"}</p>
        <h1 style={styles.title}>{"\u0388\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 \u0394\u03b9\u03ba\u03c4\u03cd\u03bf\u03c5 \u038e\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2"}</h1>
        <p style={styles.subtitle}>{"\u03a0\u03c1\u03bf\u03c3\u03c4\u03b1\u03c4\u03b5\u03c5\u03bc\u03ad\u03bd\u03bf\u03c2 \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03b5\u03c1\u03b3\u03b1\u03c3\u03af\u03b1\u03c2 \u03b3\u03b9\u03b1 \u03c0\u03c1\u03b1\u03b3\u03bc\u03b1\u03c4\u03b9\u03ba\u03cc \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2: \u03b1\u03b3\u03c9\u03b3\u03bf\u03af, \u03b2\u03ac\u03bd\u03b5\u03c2, \u03c0\u03b1\u03c1\u03bf\u03c7\u03ad\u03c2, \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03ad\u03c2 \u03b4\u03b9\u03b5\u03c5\u03b8\u03cd\u03bd\u03c3\u03b5\u03b9\u03c2, \u03b8\u03ad\u03c3\u03b7 \u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03b5\u03af\u03bf\u03c5, \u03c6\u03c9\u03c4\u03bf\u03b3\u03c1\u03b1\u03c6\u03af\u03b5\u03c2 \u03ba\u03b1\u03b9 \u03b9\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03ae \u03b5\u03b9\u03c3\u03b1\u03b3\u03c9\u03b3\u03ae KMZ/KML/GIS."}</p>

        <div style={styles.securityStrip}>
          <span>{"\u039a\u03b1\u03bc\u03af\u03b1 \u03b4\u03b7\u03bc\u03cc\u03c3\u03b9\u03b1 \u03bb\u03ae\u03c8\u03b7 KMZ/KML"}</span>
          <span>{"\u039c\u03cc\u03bd\u03bf \u03b9\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03ae \u03b1\u03c0\u03bf\u03b8\u03ae\u03ba\u03b5\u03c5\u03c3\u03b7"}</span>
          <span>{"\u03a0\u03c1\u03cc\u03c3\u03b2\u03b1\u03c3\u03b7 \u03bc\u03b5 \u03c1\u03cc\u03bb\u03bf\u03c5\u03c2"}</span>
          <span>{"\u039a\u03b1\u03c4\u03b1\u03b3\u03c1\u03b1\u03c6\u03ae \u03b5\u03bd\u03b5\u03c1\u03b3\u03b5\u03b9\u03ce\u03bd"}</span>
          <span>{"\u03a0\u03c1\u03ce\u03c4\u03b1 \u03b3\u03b9\u03b1 \u03ba\u03b9\u03bd\u03b7\u03c4\u03cc"}</span>
        </div>
      </section>

      <section style={styles.mapWorkspace} aria-label="Protected water network map shell">
        <aside style={styles.leftPanel}>
          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>{"\u0391\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 / \u03b5\u03bd\u03c4\u03bf\u03c0\u03b9\u03c3\u03bc\u03cc\u03c2"}</p>
            <div style={styles.searchBox}>
              {"\u039f\u03b4\u03cc\u03c2, \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae, \u03c3\u03c5\u03bd\u03c4\u03b5\u03c4\u03b1\u03b3\u03bc\u03ad\u03bd\u03b5\u03c2, asset ID, \u03b2\u03ac\u03bd\u03b1, \u03b1\u03b3\u03c9\u03b3\u03cc\u03c2..."}
            </div>
            <div style={styles.buttonGrid}>
              <button style={styles.goldButton}>{"\u0391\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7"}</button>
              <button style={styles.darkButton}>{"\u03a4\u03c1\u03ad\u03c7\u03bf\u03c5\u03c3\u03b1 \u03b8\u03ad\u03c3\u03b7"}</button>
              <button style={styles.darkButton}>{"\u03a0\u03ae\u03b3\u03b1\u03b9\u03bd\u03ad \u03bc\u03b5"}</button>
              <button style={styles.darkButton}>{"\u03a7\u03b5\u03b9\u03c1\u03bf\u03ba\u03af\u03bd\u03b7\u03c4\u03bf \u03c3\u03b7\u03bc\u03b5\u03af\u03bf"}</button>
            </div>
          </div>

          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>{"\u0388\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 layers"}</p>
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
              <p style={styles.mapLabel}>{"\u03a0\u03c1\u03bf\u03c3\u03c4\u03b1\u03c4\u03b5\u03c5\u03bc\u03ad\u03bd\u03bf\u03c2 \u03b6\u03c9\u03bd\u03c4\u03b1\u03bd\u03cc\u03c2 \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2"}</p>
              <h2 style={styles.mapTitle}>{"\u03a4\u03bf \u03c0\u03c1\u03b1\u03b3\u03bc\u03b1\u03c4\u03b9\u03ba\u03cc \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03c6\u03bf\u03c1\u03c4\u03ce\u03bd\u03b5\u03b9 \u03b5\u03b4\u03ce \u03b1\u03c0\u03cc \u03b9\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03ae \u03b5\u03b9\u03c3\u03b1\u03b3\u03c9\u03b3\u03ae"}</h2>
            </div>
            <div style={styles.mapStatus}>{"\u0399\u0394\u0399\u03a9\u03a4\u0399\u039a\u039f LAYER / \u03a0\u03a1\u039f\u03a3 \u0395\u039b\u0395\u0393\u03a7\u039f"}</div>
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
            <p style={styles.panelLabel}>{"\u0395\u03c0\u03b9\u03bb\u03b5\u03b3\u03bc\u03ad\u03bd\u03bf \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03bf"}</p>
            <div style={styles.assetEmpty}>
              {"\u03a0\u03ac\u03c4\u03b1 \u03c3\u03b5 \u03b1\u03b3\u03c9\u03b3\u03cc, \u03b2\u03ac\u03bd\u03b1, \u03c0\u03b1\u03c1\u03bf\u03c7\u03ae \u03ae \u03bc\u03b5\u03c4\u03c1\u03b7\u03c4\u03ae \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03b1\u03bd\u03bf\u03af\u03be\u03b5\u03b9 \u03c4\u03bf \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03cc \u03c0\u03b1\u03c1\u03ac\u03b8\u03c5\u03c1\u03bf."}
            </div>
          </div>

          <div style={styles.panelBlock}>
            <p style={styles.panelLabel}>{"\u03a0\u03b1\u03c1\u03b1\u03b4\u03b5\u03af\u03b3\u03bc\u03b1\u03c4\u03b1 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03c9\u03bd"}</p>
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
            <p style={styles.panelLabel}>{"\u0388\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 \u03c0\u03c1\u03ce\u03c4\u03b7\u03c2 \u03c6\u03ac\u03c3\u03b7\u03c2"}</p>
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
          <p style={styles.kicker}>{"\u039a\u03b1\u03bd\u03cc\u03bd\u03b1\u03c2 \u03c0\u03b1\u03c1\u03b1\u03b3\u03c9\u03b3\u03ae\u03c2"}</p>
          <h2 style={styles.sectionTitle}>{"\u03a0\u03c1\u03ce\u03c4\u03b1 \u03b4\u03bf\u03c5\u03bb\u03b5\u03cd\u03b5\u03b9 \u03bf \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2. \u039c\u03b5\u03c4\u03ac \u03cc\u03bb\u03b1 \u03c4\u03b1 \u03c5\u03c0\u03cc\u03bb\u03bf\u03b9\u03c0\u03b1."}</h2>
        </div>
        <p style={styles.sectionText}>
          {"\u0397 \u03b5\u03bd\u03cc\u03c4\u03b7\u03c4\u03b1 \u03b5\u03af\u03bd\u03b1\u03b9 \u03c0\u03c1\u03bf\u03c3\u03c4\u03b1\u03c4\u03b5\u03c5\u03bc\u03ad\u03bd\u03b7. \u03a4\u03bf \u03b1\u03c5\u03b8\u03b5\u03bd\u03c4\u03b9\u03ba\u03cc KMZ/KML \u03b4\u03b5\u03bd \u03b5\u03ba\u03c4\u03af\u03b8\u03b5\u03c4\u03b1\u03b9 \u03b4\u03b7\u03bc\u03cc\u03c3\u03b9\u03b1. \u03a4\u03bf Pantavion \u03b4\u03b5\u03af\u03c7\u03bd\u03b5\u03b9 \u03bc\u03cc\u03bd\u03bf \u03b5\u03c0\u03b5\u03be\u03b5\u03c1\u03b3\u03b1\u03c3\u03bc\u03ad\u03bd\u03bf \u03b9\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03cc layer, \u03ce\u03c3\u03c4\u03b5 \u03bf \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03bd\u03b1 \u03b4\u03bf\u03c5\u03bb\u03b5\u03cd\u03b5\u03b9 \u03b3\u03c1\u03ae\u03b3\u03bf\u03c1\u03b1 \u03c3\u03b5 PC, tablet \u03ba\u03b1\u03b9 \u03ba\u03b9\u03bd\u03b7\u03c4\u03cc."}
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
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "stretch",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    flex: "1 1 260px",
    maxWidth: 340,
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    flex: "1 1 280px",
    maxWidth: 360,
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
    flex: "3 1 520px",
    minWidth: 0,
    minHeight: 620,
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

