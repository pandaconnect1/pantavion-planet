import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Minors Protection | Pantavion One",
  description: "Age-aware protection foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.minors} />;
}
