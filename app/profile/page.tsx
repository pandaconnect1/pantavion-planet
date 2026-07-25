import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/profile");

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, country, language")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data ?? {
    id: user.id,
    username: null,
    display_name: user.user_metadata?.display_name ?? user.user_metadata?.first_name ?? null,
    avatar_url: null,
    bio: null,
    country: user.user_metadata?.country ?? null,
    language: user.user_metadata?.language ?? "el"
  };

  return (
    <section className="pv-section">
      <div className="pv-container">
        <ProfileClient profile={profile} email={user.email ?? ""} />
      </div>
    </section>
  );
}
