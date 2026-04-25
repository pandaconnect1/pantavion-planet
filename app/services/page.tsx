import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Services | Pantavion One",
  description: "Pantavion services marketplace foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.services} />;
}
