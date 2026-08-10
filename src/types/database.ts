export type ItemType = "lost" | "found";

export type ItemStatus = "open" | "claimed" | "returned" | "closed";

export type ClaimStatus = "pending" | "accepted" | "rejected";

export const ITEM_CATEGORIES = [
  "Electronics",
  "Wallet / Money",
  "Keys",
  "Bag",
  "Clothing",
  "Books",
  "ID / Cards",
  "Accessories",
  "Other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  owner_id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  item_date: string;
  image_url: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  message: string;
  status: ClaimStatus;
  created_at: string;
}
