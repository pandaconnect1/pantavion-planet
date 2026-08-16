import PantavionLiveSurfaceClient from "../../../components/pantavion/PantavionLiveSurfaceClient";

export const metadata = {
  title: "Pantavion Pulse",
  description: "Pantavion pulse feed foundation."
};

export default function PantavionPulsePage() {
  return <PantavionLiveSurfaceClient defaultMode="pulse" />;
}
