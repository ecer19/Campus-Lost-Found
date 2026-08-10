"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Item, ReceivedClaim } from "@/types/database";
import {
  closeItem,
  deleteItem,
  markReturned,
  acceptClaim,
  rejectClaim,
} from "@/app/my-listings/actions";

const STATUS_STYLES: Record<Item["status"], string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  claimed:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  returned: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const CLAIM_STATUS_STYLES: Record<ReceivedClaim["status"], string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function MyListingsClient({
  items,
  claimsByItem,
}: {
  items: Item[];
  claimsByItem: Record<string, ReceivedClaim[]>;
}) {
  if (items.length === 0) {
    return (
      <p className="text-green-900/60 dark:text-green-100/60">
        You haven&apos;t reported any items yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <ListingCard
          key={item.id}
          item={item}
          claims={claimsByItem[item.id] ?? []}
        />
      ))}
    </div>
  );
}

function ListingCard({
  item,
  claims,
}: {
  item: Item;
  claims: ReceivedClaim[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const blockingClaims = claims.filter((c) => c.status !== "rejected");
  const canDelete = blockingClaims.length === 0;
  const canClose = item.status === "open" || item.status === "claimed";
  const canMarkReturned =
    (item.type === "lost" && item.status === "open") ||
    (item.type === "found" && item.status === "claimed");

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-green-200 p-4 dark:border-green-900">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title}
          className="h-32 w-32 shrink-0 rounded-md object-cover"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize dark:bg-green-900/40">
              {item.type}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
            >
              {item.status}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
          <p className="text-sm text-green-900/60 dark:text-green-100/60">
            {item.category} · {item.location} ·{" "}
            {new Date(item.item_date).toLocaleDateString()}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/my-listings/${item.id}/edit`}
              className="rounded-md border border-green-200 px-3 py-1.5 text-sm hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
            >
              Edit
            </Link>

            {canDelete ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (
                    confirm("Delete this listing? This cannot be undone.")
                  ) {
                    run(() => deleteItem(item.id));
                  }
                }}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </button>
            ) : (
              canClose && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => closeItem(item.id))}
                  className="rounded-md border border-green-200 px-3 py-1.5 text-sm hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:hover:bg-green-900/40"
                >
                  Close Listing
                </button>
              )
            )}

            {canMarkReturned && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => markReturned(item.id))}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark as Returned
              </button>
            )}
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      {item.type === "found" && claims.length > 0 && (
        <div className="mt-4 border-t border-green-200 pt-4 dark:border-green-900">
          <h4 className="mb-2 text-sm font-semibold">
            Received Claims ({claims.length})
          </h4>
          <div className="flex flex-col gap-3">
            {claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="rounded-md bg-green-50 p-3 dark:bg-green-900/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {claim.claimant_name ?? "Unknown user"}
                    </p>
                    {claim.claimant_email && (
                      <p className="text-xs text-green-900/60 dark:text-green-100/60">
                        {claim.claimant_email}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CLAIM_STATUS_STYLES[claim.status]}`}
                  >
                    {claim.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">{claim.message}</p>

                {claim.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => acceptClaim(claim.claim_id))}
                      className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => rejectClaim(claim.claim_id))}
                      className="rounded-md border border-green-200 px-3 py-1 text-xs hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:hover:bg-green-900/40"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
