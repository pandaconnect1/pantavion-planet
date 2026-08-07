"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createPost(formData: FormData) {
  const body = text(formData, "body");
  const visibility = text(formData, "visibility") || "public";
  if (!body || body.length > 5000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/daily/feed");

  const { error } = await supabase.from("social_posts").insert({
    author_id: user.id,
    body,
    visibility,
    language_code: user.user_metadata?.language || "und",
    country_code: user.user_metadata?.country || null,
  });

  if (error) redirect(`/daily/feed?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/daily/feed");
}

export async function toggleLike(formData: FormData) {
  const postId = text(formData, "postId");
  if (!postId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/daily/feed");

  const { data: existing } = await supabase
    .from("social_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("social_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("social_reactions").insert({ post_id: postId, user_id: user.id, reaction: "like" });
  }

  revalidatePath("/daily/feed");
}

export async function addComment(formData: FormData) {
  const postId = text(formData, "postId");
  const body = text(formData, "body");
  if (!postId || !body || body.length > 2000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/daily/feed");

  const { error } = await supabase.from("social_comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
  });

  if (error) redirect(`/daily/feed?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/daily/feed");
}
