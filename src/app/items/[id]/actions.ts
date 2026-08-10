"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ClaimActionState {
  error?: string;
  success?: boolean;
}

export async function sendClaimAction(
  itemId: string,
  _prevState: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to send a claim." };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (!message) {
    return { error: "Proof of ownership is required." };
  }

  const { data: item } = await supabase
    .from("items")
    .select("id, type, status, owner_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return { error: "This item no longer exists." };
  }
  if (item.owner_id === user.id) {
    return { error: "You can't claim your own listing." };
  }
  if (item.type !== "found") {
    return { error: "Only found items can be claimed." };
  }
  if (item.status !== "open") {
    return { error: "This item is no longer available to claim." };
  }

  // RLS enforces the same rules again at the database level as a backstop.
  const { error } = await supabase.from("claims").insert({
    item_id: itemId,
    claimant_id: user.id,
    message,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already sent a claim for this item." };
    }
    return { error: "Could not send claim. Please try again." };
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/sent-claims");
  return { success: true };
}
