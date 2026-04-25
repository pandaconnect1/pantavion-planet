import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Contact | Pantavion One",
  description: "Contact and support foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.contact} />;
}
