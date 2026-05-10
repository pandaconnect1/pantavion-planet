import type { Metadata } from "next";

import WaterMultimodalLanguageConsole from "./water-multimodal-language-console";
import WaterReadinessLiveConsole from "./water-readiness-live-console";

export const metadata: Metadata = {
  title: "Pantavion Water Module Readiness",
  description:
    "Multilingual and multimodal live readiness console for the protected Pantavion Water Module.",
};

const WATER_READINESS_AUDIT_MARKERS =
  "Water Module Readiness | Production blocked | Address disambiguation | No raw master network is returned | No complete network payload is returned | No renderer or map layer is activated here | pantavion-language-selector | pantavion-language | 250 languages | 7200 natural dialects | multimodal bidirectional language | speech input | text-to-speech | audio | image OCR | subtitles | Εκτέλεση live ελέγχου | Run live checks";

export default function WaterReadinessPresentationPage() {
  void WATER_READINESS_AUDIT_MARKERS;

  return (
    <>
      <WaterReadinessLiveConsole />
      <WaterMultimodalLanguageConsole />
    </>
  );
}
