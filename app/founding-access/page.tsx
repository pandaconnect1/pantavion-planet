import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Founding Access | Pantavion One",
  description: "Founding access to Pantavion One.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.foundingAccess} />;
}
