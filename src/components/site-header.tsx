import Link from "next/link";
import { AuthWidget } from "./auth-widget";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          Campus Lost &amp; Found
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
          <Link href="/browse" className="hover:text-zinc-900">
            Browse Items
          </Link>
          <Link href="/report" className="hover:text-zinc-900">
            Report Item
          </Link>
          <Link href="/my-listings" className="hover:text-zinc-900">
            My Listings
          </Link>
          <Link href="/sent-claims" className="hover:text-zinc-900">
            Sent Claims
          </Link>
        </nav>
        <AuthWidget />
      </div>
    </header>
  );
}
