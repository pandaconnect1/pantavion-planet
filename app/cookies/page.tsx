import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Cookies | Pantavion One",
  description: "Cookie policy foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.cookies} />;
}
