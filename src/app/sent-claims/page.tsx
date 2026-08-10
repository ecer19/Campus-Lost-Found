import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClaimStatusBadge } from "@/components/badge";
import type { ClaimStatus } from "@/types/database";

interface SentClaimRow {
  id: string;
  message: string;
  status: ClaimStatus;
  created_at: string;
  item: {
    id: string;
    title: string;
    location: string;
    image_url: string;
    owner: { name: string | null; email: string } | null;
  } | null;
}

export default async function SentClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("claims")
    .select(
      `id, message, status, created_at,
       item:items ( id, title, location, image_url, owner:profiles ( name, email ) )`,
    )
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false })
    .returns<SentClaimRow[]>();

  if (error) throw error;
  const claims = data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Sent Claims</h1>

      {claims.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          You haven&apos;t sent any claims yet.{" "}
          <Link href="/browse" className="font-medium underline">
            Browse items
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {claims.map((claim) => (
            <li
              key={claim.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row"
            >
              {claim.item && (
                <Link
                  href={`/items/${claim.item.id}`}
                  className="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-24 sm:w-24"
                >
                  <Image
                    src={claim.item.image_url}
                    alt={claim.item.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
              )}

              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium text-zinc-900">
                    {claim.item?.title ?? "Item no longer available"}
                  </h2>
                  <ClaimStatusBadge status={claim.status} />
                </div>
                {claim.item && (
                  <p className="text-sm text-zinc-500">{claim.item.location}</p>
                )}
                <p className="text-sm text-zinc-600">{claim.message}</p>

                {claim.status === "accepted" && claim.item?.owner && (
                  <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <p className="font-medium">Owner contact</p>
                    <p>{claim.item.owner.name ?? "—"}</p>
                    <p>{claim.item.owner.email}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
