import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.name ?? null;
  }

  return (
    <header className="border-b border-green-200 dark:border-green-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>Campus Lost &amp; Found</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href="/browse" className="hover:underline">
            Browse Items
          </Link>
          <Link href="/report" className="hover:underline">
            Report Item
          </Link>

          {user ? (
            <div className="flex items-center gap-3 border-l border-green-200 pl-4 dark:border-green-900">
              <div className="text-right leading-tight">
                <p className="font-medium">{name || "Unnamed User"}</p>
                <p className="text-xs text-green-900/60 dark:text-green-100/60">
                  {user.email}
                </p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-green-200 px-3 py-1.5 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
