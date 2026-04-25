import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Adult Connect | Pantavion One",
  description: "Future restricted 18+ policy foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.adultConnect} />;
}
