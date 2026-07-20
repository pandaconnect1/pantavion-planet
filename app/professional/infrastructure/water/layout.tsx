import type { ReactNode } from "react";

import WaterLegacySecretCleanup from "./legacy-secret-cleanup";

export default function WaterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <WaterLegacySecretCleanup />
      {children}
    </>
  );
}
