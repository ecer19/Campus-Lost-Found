import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        Campus Lost &amp; Found
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        Lost something on campus, or found something that isn&apos;t yours?
        Report it or search existing listings to reunite items with their
        owners.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/browse"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Browse Items
        </Link>
        <Link
          href="/report"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Report Item
        </Link>
      </div>
    </main>
  );
}
