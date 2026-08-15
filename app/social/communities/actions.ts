"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  const base = value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${base || "community"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createCommunity(formData: FormData) {
  const name = text(formData, "name");
  const description = text(formData, "description");
  const requestedVisibility = text(formData, "visibility");
  const visibility = ["public", "private", "secret"].includes(requestedVisibility) ? requestedVisibility : "public";
  if (name.length < 2 || name.length > 100 || description.length > 1000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");

  const { data: community, error } = await supabase
    .from("communities")
    .insert({ name, slug: slugify(name), description, visibility, created_by: user.id })
    .select("id")
    .single();
  if (error || !community) redirect(`/social/communities?error=${encodeURIComponent(error?.message || "community_create_failed")}`);

  const { error: memberError } = await supabase.from("community_members").insert({
    community_id: community.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });
  if (memberError) redirect(`/social/communities?error=${encodeURIComponent(memberError.message)}`);
  revalidatePath("/social/communities");
}

export async function joinCommunity(formData: FormData) {
  const communityId = text(formData, "communityId");
  if (!communityId) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");
  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: user.id,
    role: "member",
    status: "active",
  });
  if (error && error.code !== "23505") redirect(`/social/communities?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/social/communities");
}
