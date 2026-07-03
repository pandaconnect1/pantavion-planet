import PantavionLiveSurfaceClient from "../../../components/pantavion/PantavionLiveSurfaceClient";

export const metadata = {
  title: "Pantavion Chat",
  description: "Pantavion live chat foundation connected to the execution kernel."
};

export default function PantavionChatPage() {
  return <PantavionLiveSurfaceClient defaultMode="chat" />;
}
