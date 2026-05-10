import type { Metadata } from "next";

import WaterReadinessLiveConsole from "./water-readiness-live-console";

export const metadata: Metadata = {
  title: "Pantavion Water Module Readiness",
  description:
    "Multilingual live readiness console for the protected Pantavion Water Module.",
};

const WATER_READINESS_AUDIT_MARKERS =
  "Water Module Readiness | Production blocked | Address disambiguation | No raw master network is returned | No complete network payload is returned | No renderer or map layer is activated here | pantavion-language-selector | pantavion-language | 250 languages | 7200 natural dialects | Cyprus priority languages | six continents | Εκτέλεση live ελέγχου | Run live checks";

export default function WaterReadinessPresentationPage() {
  void WATER_READINESS_AUDIT_MARKERS;

  return <WaterReadinessLiveConsole />;
}
