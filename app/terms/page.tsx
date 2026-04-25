import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Terms | Pantavion One",
  description: "Pantavion terms of service foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.terms} />;
}
