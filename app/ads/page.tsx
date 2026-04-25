import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Ads Center | Pantavion One",
  description: "Dedicated non-intrusive commercial promotion.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.ads} />;
}
