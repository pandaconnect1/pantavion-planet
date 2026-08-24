import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonalAIConsole from "./PersonalAIConsole";

export const dynamic = "force-dynamic";

export default async function MyAIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/my-ai");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,language,country")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-section-head">
          <div>
            <p className="pv-kicker">Pantavion Personal AI</p>
            <h1 className="pv-title">Το δικό σου AI, με συνέχεια.</h1>
            <p className="pv-lead">
              Απομονωμένο ανά χρήστη, με μνήμη ανά νήμα, επιτρεπόμενη συνέχεια μεταξύ νημάτων,
              προσωπικές σημειώσεις και relationship context.
            </p>
          </div>
          <span className="pv-status gold">Authenticated · {profile?.language || "language auto"}</span>
        </div>

        <PersonalAIConsole
          displayName={profile?.display_name || user.email?.split("@")[0] || "Pantavion member"}
          language={profile?.language || null}
          country={profile?.country || null}
        />
      </div>
    </section>
  );
}
