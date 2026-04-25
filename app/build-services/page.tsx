import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Build Services | Pantavion One",
  description: "Websites, apps and AI-assisted build services.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.buildServices} />;
}
