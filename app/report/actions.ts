"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/types/database";
import type { ItemFormState } from "@/components/ItemForm";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (file.type === "image/png") return "png";
  return "jpg";
}

export async function createItem(
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/report");
  }

  const type = formData.get("type");
  const title = (formData.get("title") as string | null)?.trim();
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const category = formData.get("category") as string | null;
  const location = (formData.get("location") as string | null)?.trim();
  const item_date = formData.get("item_date") as string | null;
  const image = formData.get("image") as File | null;

  if (type !== "lost" && type !== "found") {
    return { error: "Please choose Lost or Found." };
  }
  if (!title) return { error: "Title is required." };
  if (!category || !CATEGORIES.includes(category as Category)) {
    return { error: "Please choose a category." };
  }
  if (!location) return { error: "Location is required." };
  if (!item_date) return { error: "Date is required." };
  if (!image || image.size === 0) return { error: "An image is required." };
  if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
    return { error: "Only JPG, JPEG or PNG images are supported." };
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 5MB or smaller." };
  }

  const ext = extensionFor(image);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("item-images")
    .upload(path, image, { contentType: image.type });

  if (uploadError) {
    return { error: `Image upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("item-images").getPublicUrl(path);

  const { error: insertError } = await supabase.from("items").insert({
    owner_id: user.id,
    type,
    title,
    description,
    category,
    location,
    item_date,
    image_url: publicUrl,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/my-listings");
  redirect("/my-listings");
}
