import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Import My World | Pantavion One",
  description: "Lawful user-controlled import foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.importWorld} />;
}
