import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/types/database";
import { ItemStatusBadge, TypeBadge } from "./badge";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <TypeBadge type={item.type} />
          {item.status === "claimed" && <ItemStatusBadge status={item.status} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-medium text-zinc-900">{item.title}</h3>
        <p className="text-sm text-zinc-500">{item.category}</p>
        <p className="line-clamp-1 text-sm text-zinc-500">{item.location}</p>
        <p className="mt-auto pt-1 text-xs text-zinc-400">
          {new Date(item.item_date).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
