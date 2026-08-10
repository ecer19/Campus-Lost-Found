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

// Aliases for the naming convention used on the browse/claim side.
export const ITEM_CATEGORIES = CATEGORIES;
export type ItemCategory = Category;

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
  description: string | null;
  category: Category;
  location: string;
  item_date: string;
  image_url: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

// Raw claims table row.
export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  message: string;
  status: ClaimStatus;
  created_at: string;
}

// Shape returned by the get_received_claims() RPC: a claim joined with the
// claimant's profile, with the email masked until the claim is accepted.
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
