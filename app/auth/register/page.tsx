import { createClient } from "@/lib/supabase/server";
import RegisterClient from "./RegisterClient";

type SearchParams = Promise<{ error?: string | string[] }>;

type RegistrationGate = {
  public_registration_enabled?: boolean;
  required_launch_state?: string;
  reason?: string;
};

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pantavion_public_registration_status");
  const gate = (Array.isArray(data) ? data[0] : data) as RegistrationGate | null;
  const registrationEnabled = !error && gate?.public_registration_enabled === true;

  return (
    <section className="pv-section">
      <div className="pv-container">
        <RegisterClient
          registrationEnabled={registrationEnabled}
          requiredLaunchState={gate?.required_launch_state ?? "VERIFIED_LIVE"}
          gateReason={
            error
              ? "Δεν ήταν δυνατό να επαληθευτεί με ασφάλεια το production registration gate."
              : gate?.reason ?? "Οι δημόσιες εγγραφές δεν είναι ακόμη διαθέσιμες."
          }
          errorCode={errorCode ?? ""}
        />
      </div>
    </section>
  );
}
