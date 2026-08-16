import PantavionLiveSurfaceClient from "../../../components/pantavion/PantavionLiveSurfaceClient";

export const metadata = {
  title: "Pantavion Live",
  description: "Pantavion live user surface with chat, pulse, people, tools and execution status."
};

export default function PantavionLivePage() {
  return <PantavionLiveSurfaceClient defaultMode="live" />;
}
