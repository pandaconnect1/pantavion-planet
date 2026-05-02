"use client";

import { useEffect, useMemo, useState } from "react";

type CapabilityCheck = {
  id: string;
  label: string;
  supported: boolean;
  note: string;
};

function detectDeviceClass(userAgent: string, maxTouchPoints: number, width: number) {
  const ua = userAgent.toLowerCase();
  const isIPad = ua.includes("ipad") || (ua.includes("macintosh") && maxTouchPoints > 1);
  const isTablet = isIPad || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"));
  const isPhone = ua.includes("iphone") || ua.includes("mobile") || (ua.includes("android") && width < 800);

  if (isPhone) return "mobile phone";
  if (isTablet) return "tablet";
  if (width >= 1024) return "desktop / laptop";
  return "unknown device";
}

export default function DeviceCapabilityPanel() {
  const [ready, setReady] = useState(false);
  const [deviceClass, setDeviceClass] = useState("unknown device");
  const [checks, setChecks] = useState<CapabilityCheck[]>([]);

  useEffect(() => {
    const nav = window.navigator as Navigator & {
      bluetooth?: unknown;
      getBattery?: () => Promise<unknown>;
    };

    const win = window as Window & {
      NDEFReader?: unknown;
    };

    const width = window.innerWidth;
    const detected = detectDeviceClass(
      nav.userAgent,
      nav.maxTouchPoints ?? 0,
      width
    );

    const storageSupported = (() => {
      try {
        window.localStorage.setItem("__pantavion_test", "1");
        window.localStorage.removeItem("__pantavion_test");
        return true;
      } catch {
        return false;
      }
    })();

    const displayStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((nav as Navigator & { standalone?: boolean }).standalone);

    const nextChecks: CapabilityCheck[] = [
      {
        id: "responsive-ui",
        label: "Responsive emergency screen",
        supported: true,
        note: "Works in browser on phones, tablets, laptops, and desktops.",
      },
      {
        id: "online-state",
        label: "Online/offline status",
        supported: typeof nav.onLine === "boolean",
        note: nav.onLine ? "Device reports online right now." : "Device reports offline right now.",
      },
      {
        id: "local-storage",
        label: "Local emergency storage",
        supported: storageSupported,
        note: "Needed for offline profile, language choice, and local emergency data.",
      },
      {
        id: "geolocation",
        label: "Location permission support",
        supported: "geolocation" in nav,
        note: "Works only after user permission and only when device/location services can provide a position.",
      },
      {
        id: "service-worker",
        label: "Offline/PWA service worker support",
        supported: "serviceWorker" in nav,
        note: "Needed for stronger offline caching and installable emergency behavior.",
      },
      {
        id: "pwa-display",
        label: "Standalone app display",
        supported: displayStandalone,
        note: displayStandalone
          ? "Pantavion is running like an installed app."
          : "Browser mode now. Install behavior depends on OS/browser.",
      },
      {
        id: "vibration",
        label: "Vibration / haptic alert",
        supported: "vibrate" in nav,
        note: "Useful on phones/tablets. Desktop browsers usually do not support it.",
      },
      {
        id: "bluetooth",
        label: "Web Bluetooth availability",
        supported: "bluetooth" in nav,
        note: "Platform-dependent. Some browsers and iOS combinations may block it.",
      },
      {
        id: "nfc",
        label: "Web NFC availability",
        supported: "NDEFReader" in win,
        note: "Mainly Android/Chrome-dependent. iOS/browser support may be limited.",
      },
      {
        id: "battery",
        label: "Battery status API",
        supported: typeof nav.getBattery === "function",
        note: "Useful for survival mode, but not supported everywhere.",
      },
    ];

    setDeviceClass(detected);
    setChecks(nextChecks);
    setReady(true);
  }, []);

  const supportedCount = useMemo(
    () => checks.filter((check) => check.supported).length,
    [checks]
  );

  if (!ready) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-200">
        Checking this device...
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
        Live device check
      </p>

      <h2 className="mt-3 text-3xl font-bold text-white">
        This device: {deviceClass}
      </h2>

      <p className="mt-3 text-slate-200">
        Supported now: {supportedCount} / {checks.length}. Pantavion must show
        what works on this device and degrade safely when something is missing.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className="rounded-2xl border border-white/10 bg-black/30 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-white">{check.label}</h3>
              <span
                className={
                  check.supported
                    ? "rounded-full border border-emerald-300/30 px-3 py-1 text-xs font-bold text-emerald-200"
                    : "rounded-full border border-red-300/30 px-3 py-1 text-xs font-bold text-red-200"
                }
              >
                {check.supported ? "Works" : "Limited"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{check.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
