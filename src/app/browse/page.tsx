import { Suspense } from "react";
import { fetchBrowseItems } from "@/lib/items";
import { BrowseFilters } from "@/components/browse-filters";
import { ItemCard } from "@/components/item-card";

interface BrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const rawType = typeof params.type === "string" ? params.type : undefined;
  const type = rawType === "lost" || rawType === "found" ? rawType : "all";
  const category = typeof params.category === "string" ? params.category : undefined;
  const location = typeof params.location === "string" ? params.location : undefined;
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const items = await fetchBrowseItems({ q, type, category, location, sort });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Browse Lost &amp; Found Items
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {items.length} item{items.length === 1 ? "" : "s"} found
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[58px] rounded-xl border border-zinc-200 bg-white" />
        }
      >
        <BrowseFilters />
      </Suspense>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          No items match your search. Try different filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
