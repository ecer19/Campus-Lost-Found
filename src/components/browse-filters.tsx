"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FocusEvent } from "react";
import { ITEM_CATEGORIES } from "@/types/database";

export function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("q", value), 350);
  }

  function handleLocationBlur(event: FocusEvent<HTMLInputElement>) {
    updateParam("location", event.target.value);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        type="search"
        value={q}
        onChange={handleSearchChange}
        placeholder="Search by title or description..."
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm sm:min-w-[200px] sm:flex-1"
      />

      <select
        defaultValue={searchParams.get("type") ?? "all"}
        onChange={(event) => updateParam("type", event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="all">All Types</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>

      <select
        defaultValue={searchParams.get("category") ?? "All"}
        onChange={(event) => updateParam("category", event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="All">All Categories</option>
        {ITEM_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <input
        type="text"
        defaultValue={searchParams.get("location") ?? ""}
        onBlur={handleLocationBlur}
        placeholder="Location (e.g. Library)"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:w-40"
      />

      <select
        defaultValue={searchParams.get("sort") ?? "newest"}
        onChange={(event) => updateParam("sort", event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
