import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Safety | Pantavion One",
  description: "Pantavion safety and trust foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.safety} />;
}
