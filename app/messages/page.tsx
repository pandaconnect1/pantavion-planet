import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Messages | Pantavion One",
  description: "Pantavion native communication foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.messages} />;
}
