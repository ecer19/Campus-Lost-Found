import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MyListingsClient from "@/components/MyListingsClient";
import type { Item, ReceivedClaim } from "@/types/database";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-listings");
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: claims } = await supabase.rpc("get_received_claims");

  const claimsByItem: Record<string, ReceivedClaim[]> = {};
  for (const claim of (claims ?? []) as ReceivedClaim[]) {
    (claimsByItem[claim.item_id] ??= []).push(claim);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link
          href="/report"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Report New Item
        </Link>
      </div>
      <MyListingsClient
        items={(items ?? []) as Item[]}
        claimsByItem={claimsByItem}
      />
    </div>
  );
}
