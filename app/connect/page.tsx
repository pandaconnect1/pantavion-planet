import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Pantavion Connect | Pantavion One",
  description: "Native communication and lawful bridges.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.connect} />;
}
