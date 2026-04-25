import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Refund Policy | Pantavion One",
  description: "Pantavion refund and cancellation foundation.",
};

export default function Page() {
  return <SurfacePage surface={surfaces.refundPolicy} />;
}
