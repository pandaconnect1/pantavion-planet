import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Market | Pantavion One",
  description: "Pantavion marketplace and listings foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.market} />;
}
