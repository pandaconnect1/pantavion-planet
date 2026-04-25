import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Work | Pantavion One",
  description: "Office assistant and work execution foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.work} />;
}
