import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types/database";

export interface BrowseFilters {
  q?: string;
  type?: "all" | "lost" | "found";
  category?: string;
  location?: string;
  sort?: "newest" | "oldest";
}

// Escapes characters that are meaningful to PostgREST's or()/ilike filter syntax.
function escapeForOrFilter(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`).replace(/[,()]/g, " ");
}

export async function fetchBrowseItems(filters: BrowseFilters): Promise<Item[]> {
  const supabase = await createClient();

  let query = supabase.from("items").select("*").in("status", ["open", "claimed"]);

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }

  if (filters.location?.trim()) {
    query = query.ilike("location", `%${filters.location.trim()}%`);
  }

  if (filters.q?.trim()) {
    const term = escapeForOrFilter(filters.q.trim());
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  query = query.order("created_at", { ascending: filters.sort === "oldest" });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchItemById(id: string): Promise<Item | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyClaimForItem(itemId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("claims")
    .select("id, status")
    .eq("item_id", itemId)
    .eq("claimant_id", userId)
    .maybeSingle();
  return data;
}
