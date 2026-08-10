import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Campus Lost &amp; Found
      </h1>
      <p className="mt-4 max-w-xl text-green-900/70 dark:text-green-100/70">
        Lost something on campus, or found something that isn&apos;t yours?
        Report it here so we can get it back to its owner.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/browse"
          className="rounded-md border border-green-200 px-6 py-3 font-medium hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
        >
          Browse Items
        </Link>
        <Link
          href="/report"
          className="rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
        >
          Report Item
        </Link>
      </div>
    </div>
  );
}
