"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthWidget() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-zinc-600 sm:inline">{user.email}</span>
        <button
          onClick={logout}
          className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Logout
        </button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <p className="max-w-[220px] text-sm text-zinc-600">
        Magic link sent to {email}. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={sendMagicLink} className="flex items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@school.edu"
        className="w-36 rounded-md border border-zinc-300 px-2 py-1.5 text-sm sm:w-44"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Login"}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-600">Error, try again</span>
      )}
    </form>
  );
}
