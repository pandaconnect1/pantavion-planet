import type { Metadata } from "next";

import WaterIntelligenceCommandClient from "./water-intelligence-command-client";

export const metadata: Metadata = {
  title: "Κέντρο Διοίκησης Ύδρευσης | Pantavion",
  description:
    "Ελληνικό κέντρο διοίκησης ύδρευσης για ιδρυτή, εγκρίσεις, συνεργεία, βλάβες, αποθήκη, λογιστήριο, HR και ατιμολόγητο νερό.",
};

export default function WaterIntelligencePage() {
  return <WaterIntelligenceCommandClient />;
}