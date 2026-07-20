"use client";

import { useEffect } from "react";

const LEGACY_FOUNDER_CODE_KEYS = [
  "pantavion.water.admin.founderCode.v1",
  "pantavion_water_founder_code",
  "waterFounderCode",
  "waterFounderCodeClean",
] as const;

export default function WaterLegacySecretCleanup() {
  useEffect(() => {
    for (const key of LEGACY_FOUNDER_CODE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Strict`;
    }
  }, []);

  return null;
}
