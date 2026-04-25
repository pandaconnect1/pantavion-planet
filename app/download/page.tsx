import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Download | Pantavion One",
  description: "Pantavion install and PWA foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.download} />;
}
