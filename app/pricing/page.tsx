import { SurfacePage } from "@/components/PantavionPublicShell";
import { surfaces } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Pricing | Pantavion One",
  description: "Pantavion founding access, market, media and business pricing foundation.",
};

export default function PricingPage() {
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_LINK;

  return (
    <SurfacePage
      surface={{
        ...surfaces.pricing,
        primaryHref: stripeLink || "/founding-access",
        primaryLabel: stripeLink ? "Start Founding Trial" : "Stripe Link Pending",
      }}
    />
  );
}
