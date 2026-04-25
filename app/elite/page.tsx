import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Elite | Pantavion One",
  description: "High-trust private communication.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.elite} />;
}
