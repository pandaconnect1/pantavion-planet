"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCommunity(formData: FormData) {
  const name = text(formData, "name");
  const description = text(formData, "description");
  const visibility = text(formData, "visibility") || "public";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  if (!name || slug.length < 3) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");

  const { data: community, error } = await supabase
    .from("communities")
    .insert({ name, slug, description, visibility, created_by: user.id })
    .select("id")
    .single();
  if (error) redirect(`/social/communities?error=${encodeURIComponent(error.message)}`);

  await supabase.from("community_members").insert({
    community_id: community.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });
  revalidatePath("/social/communities");
}

export async function joinCommunity(formData: FormData) {
  const communityId = text(formData, "communityId");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");
  await supabase.from("community_members").upsert({
    community_id: communityId,
    user_id: user.id,
    role: "member",
    status: "active",
  });
  revalidatePath("/social/communities");
}
