"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileSetupState = { error?: string };

export async function setName(
  _prevState: ProfileSetupState,
  formData: FormData
): Promise<ProfileSetupState> {
  const name = (formData.get("name") as string | null)?.trim();
  const next = (formData.get("next") as string | null) || "/my-listings";

  if (!name) {
    return { error: "Please enter your full name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}
