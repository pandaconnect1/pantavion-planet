import EmergencyFeaturePage from "../_components/EmergencyFeaturePage";
import { emergencyFeaturePages } from "@/core/emergency/lifeshield-emergency-i18n";

export default function EmergencyGlobalNetworkPage() {
  return <EmergencyFeaturePage {...emergencyFeaturePages.globalNetwork} />;
}
