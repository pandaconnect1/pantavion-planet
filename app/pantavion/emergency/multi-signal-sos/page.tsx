import EmergencyFeaturePage from "../_components/EmergencyFeaturePage";
import { emergencyFeaturePages } from "@/core/emergency/lifeshield-emergency-i18n";

export default function EmergencyMultiSignalPage() {
  return <EmergencyFeaturePage {...emergencyFeaturePages.multiSignal} />;
}
