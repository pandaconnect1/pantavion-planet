import { SimpleLegalPage } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Refund and Cancellation Policy | Pantavion One",
  description: "Pantavion refund foundation for founding subscriptions, listings, promotions and professional services.",
};

export default function Page() {
  return (
    <SimpleLegalPage
      title="Refund and Cancellation Policy"
      lead="Pantavion refund foundation for founding subscriptions, listings, promotions and professional services."
      sections={[
        { title: "Founding Access", body: "Founding subscriptions support platform development and access to live/foundation features. Users should have clear cancellation before renewal." },
        { title: "Listings and Promotion", body: "Paid listing or promotion fees are generally tied to visibility periods. Refund rules should be clear before purchase and may vary by product." },
        { title: "Build Services", body: "Custom build services may require deposits, milestones and separate written scope. Refunds depend on work delivered, scope and service terms." }
      ]}
    />
  );
}
