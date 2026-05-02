import EmergencyFeaturePage from "../_components/EmergencyFeaturePage";
import { emergencyFeaturePages } from "@/core/emergency/lifeshield-emergency-i18n";

export default function EmergencySafePulsePage() {
  return <EmergencyFeaturePage {...emergencyFeaturePages.safepulse} />;
}
