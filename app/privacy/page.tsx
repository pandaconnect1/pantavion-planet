import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Privacy | Pantavion One",
  description: "Pantavion privacy foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.privacy} />;
}
