"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return { supabase, user };
}

export async function closeItem(itemId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("items")
    .update({ status: "closed" })
    .eq("id", itemId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "You can't close this listing." };
  }

  revalidatePath("/my-listings");
  return {};
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return {
      error:
        "This listing can't be deleted because it has claims — use Close instead.",
    };
  }

  revalidatePath("/my-listings");
  return {};
}

export async function markReturned(itemId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("items")
    .update({ status: "returned" })
    .eq("id", itemId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "You can't mark this listing as returned." };
  }

  revalidatePath("/my-listings");
  return {};
}

export async function acceptClaim(claimId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("accept_claim", {
    p_claim_id: claimId,
  });

  if (error) return { error: error.message };

  revalidatePath("/my-listings");
  return {};
}

export async function rejectClaim(claimId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("reject_claim", {
    p_claim_id: claimId,
  });

  if (error) return { error: error.message };

  revalidatePath("/my-listings");
  return {};
}
