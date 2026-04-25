import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Acceptable Use | Pantavion One",
  description: "Acceptable use policy foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.acceptableUse} />;
}
