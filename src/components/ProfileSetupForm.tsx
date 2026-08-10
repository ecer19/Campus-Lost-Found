"use client";

import { useActionState } from "react";
import { setName, type ProfileSetupState } from "@/app/profile-setup/actions";

const initialState: ProfileSetupState = {};

export default function ProfileSetupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(setName, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Onur Çelik"
          className="w-full rounded-md border border-green-200 px-3 py-2 outline-none focus:border-green-500 dark:border-green-800 dark:bg-transparent dark:focus:border-green-400"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
