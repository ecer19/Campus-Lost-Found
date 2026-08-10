export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "claimed" | "returned" | "closed";
export type ClaimStatus = "pending" | "accepted" | "rejected";

export const CATEGORIES = [
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

export type Category = (typeof CATEGORIES)[number];

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
};

export type Item = {
  id: string;
  owner_id: string;
  type: ItemType;
  title: string;
  description: string | null;
  category: Category;
  location: string;
  item_date: string;
  image_url: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export type ReceivedClaim = {
  claim_id: string;
  item_id: string;
  claimant_id: string;
  claimant_name: string | null;
  claimant_email: string | null;
  message: string;
  status: ClaimStatus;
  created_at: string;
};
