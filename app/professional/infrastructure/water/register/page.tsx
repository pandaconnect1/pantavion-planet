import WaterNetworkRegisterClient from "./water-network-register-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water — Μητρώο Δικτύου",
  description: "Βάνες, ρεούλες, αεροβαλβίδες, υδροστόμια και δεξαμενές ανά περιοχή και οδό, από το αυθεντικό DWG.",
};

export default function WaterNetworkRegisterPage() {
  return <WaterNetworkRegisterClient />;
}
