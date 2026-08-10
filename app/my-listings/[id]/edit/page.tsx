import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ItemForm from "@/components/ItemForm";
import { updateItem } from "./actions";
import type { Item } from "@/types/database";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/my-listings/${id}/edit`);
  }

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item || item.owner_id !== user.id) {
    notFound();
  }

  const updateItemWithId = updateItem.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Edit Listing</h1>
      <ItemForm mode="edit" item={item as Item} action={updateItemWithId} />
    </div>
  );
}
