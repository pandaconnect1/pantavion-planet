"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProviderStatus = {
  ok?: boolean;
  provider?: string;
  endpointConfigured?: boolean;
  apiKeyConfigured?: boolean;
};

export default function PantaTranslateFloatingWidget() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/translate/status")
      .then((response) => response.json())
      .then((payload) => {
        if (active) setStatus(payload);
      })
      .catch(() => {
        if (active) setStatus(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const ready = Boolean(status?.ok);

  return (
    <Link
      href="/translate"
      data-pantavion-global-translate-widget="true"
      aria-label="Open PantaTranslate universal interpreter"
      title="PantaTranslate"
      style={{
        position: "fixed",
        right: 16,
        bottom: 18,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        border: "1px solid rgba(103, 232, 249, 0.78)",
        borderRadius: 22,
        background: "linear-gradient(135deg, rgba(3, 12, 24, 0.96), rgba(8, 35, 54, 0.96))",
        color: "#cffafe",
        padding: "10px 14px",
        fontWeight: 900,
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        textDecoration: "none",
        maxWidth: 240
      }}
    >
      <span style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        PantaTranslate
      </span>
      <span style={{ fontSize: 11, color: ready ? "#86efac" : "#fde68a" }}>
        {ready
          ? "Provider connected: " + (status?.provider || "active")
          : "Open interpreter"}
      </span>
    </Link>
  );
}
