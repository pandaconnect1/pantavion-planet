import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Media | Pantavion One",
  description: "Pantavion media and creator network.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.media} />;
}
