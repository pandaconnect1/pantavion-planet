import { SimpleLegalPage } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Privacy Policy | Pantavion One",
  description: "Pantavion privacy foundation for user control, consent-first import, age-aware experiences and future data portability.",
};

export default function Page() {
  return (
    <SimpleLegalPage
      title="Privacy Policy"
      lead="Pantavion privacy foundation for user control, consent-first import, age-aware experiences and future data portability."
      sections={[
        { title: "Consent First", body: "Pantavion should not import contacts, messages, emails, social handles, files or communication history without user authorization or user-provided export." },
        { title: "User Control", body: "Users should be able to manage, disconnect, delete, export and review their data as the platform matures." },
        { title: "Sensitive Areas", body: "Minors, adult zones, financial content, health content and private communications require stricter privacy, safety and legal controls." }
      ]}
    />
  );
}
