"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const isDev = process.env.NODE_ENV !== "production";

export function AuthWidget() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "sending">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

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

  // Dev-only fallback so the team isn't blocked by email rate limits while
  // testing. Requires "Confirm email" turned off in Supabase Auth settings,
  // otherwise signUp() also tries to send a (rate-limited) confirmation mail.
  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setPwStatus("sending");
    setPwError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        setPassword("");
        setPwStatus("idle");
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setPwError(signUpError.message);
        return;
      }

      if (!data.session) {
        const accountAlreadyExists = data.user?.identities?.length === 0;
        setPwError(
          accountAlreadyExists
            ? "Wrong password for an existing account."
            : 'Account created but needs email confirmation. Turn off "Confirm email" in Supabase → Authentication → Providers → Email to skip this.',
        );
      } else {
        setPassword("");
      }
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPwStatus("idle");
    }
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

  if (isDev && usePassword) {
    return (
      <form onSubmit={submitPassword} className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
            className="w-32 rounded-md border border-zinc-300 px-2 py-1.5 text-sm sm:w-36"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={pwStatus === "sending"}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pwStatus === "sending" ? "..." : "Go"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {pwError && (
            <span className="max-w-[260px] text-right text-xs text-red-600">
              {pwError}
            </span>
          )}
          <button
            type="button"
            onClick={() => setUsePassword(false)}
            className="text-xs text-zinc-500 underline"
          >
            Use magic link
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendMagicLink} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
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
      </div>
      <div className="flex items-center gap-2">
        {status === "error" && (
          <span className="text-xs text-red-600">Error, try again</span>
        )}
        {isDev && (
          <button
            type="button"
            onClick={() => setUsePassword(true)}
            className="text-xs text-zinc-500 underline"
          >
            Use password instead (dev)
          </button>
        )}
      </div>
    </form>
  );
}
