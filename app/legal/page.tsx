import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Legal Center | Pantavion One",
  description: "Legal and trust foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.legal} />;
}
