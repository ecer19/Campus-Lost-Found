"use client";

import { useActionState } from "react";
import { sendClaimAction, type ClaimActionState } from "@/app/items/[id]/actions";

const initialState: ClaimActionState = {};

export function ClaimForm({ itemId }: { itemId: string }) {
  const action = sendClaimAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Claim sent. Track its status on{" "}
        <a href="/sent-claims" className="font-medium underline">
          Sent Claims
        </a>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="message" className="text-sm font-medium text-zinc-900">
        Proof of Ownership
      </label>
      <textarea
        id="message"
        name="message"
        required
        rows={4}
        placeholder="e.g. The wallet contains a blue student ID and two bank cards."
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send Claim"}
      </button>
    </form>
  );
}
