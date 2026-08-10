import type { ReactNode } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchItemById, fetchMyClaimForItem } from "@/lib/items";
import { ItemStatusBadge, TypeBadge } from "@/components/badge";
import { ClaimForm } from "@/components/claim-form";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  const item = await fetchItemById(id);
  if (!item) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const myClaim = user ? await fetchMyClaimForItem(item.id, user.id) : null;

  let claimSection: ReactNode;
  if (item.type !== "found") {
    claimSection = (
      <p className="text-sm text-zinc-500">Only found items can be claimed.</p>
    );
  } else if (item.status !== "open") {
    claimSection = (
      <p className="text-sm text-zinc-500">
        This item is {item.status} and can no longer be claimed.
      </p>
    );
  } else if (!user) {
    claimSection = (
      <p className="text-sm text-zinc-600">
        Please log in (top right) to send a claim for this item.
      </p>
    );
  } else if (item.owner_id === user.id) {
    claimSection = (
      <p className="text-sm text-zinc-500">This is your own listing.</p>
    );
  } else if (myClaim) {
    claimSection = (
      <p className="text-sm text-zinc-600">
        You already sent a claim for this item. Check{" "}
        <a href="/sent-claims" className="font-medium underline">
          Sent Claims
        </a>{" "}
        for its status.
      </p>
    );
  } else {
    claimSection = <ClaimForm itemId={item.id} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={item.type} />
            <ItemStatusBadge status={item.status} />
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900">{item.title}</h1>
          <p className="whitespace-pre-wrap text-zinc-700">{item.description}</p>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Category</dt>
              <dd className="font-medium text-zinc-900">{item.category}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Location</dt>
              <dd className="font-medium text-zinc-900">{item.location}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Item Date</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(item.item_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Reported</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(item.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Is this yours?
        </h2>
        {claimSection}
      </div>
    </main>
  );
}
