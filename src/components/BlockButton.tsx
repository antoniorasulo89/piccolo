"use client";

import { Prohibit, UserCircleCheck } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function BlockButton({ userId, initialBlocked }: { userId: number; initialBlocked: boolean }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleBlock() {
    if (!blocked && !confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: blocked ? "DELETE" : "POST",
      });
      if (res.ok) {
        setBlocked(!blocked);
        setConfirming(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {confirming ? (
        <span className="text-xs text-rose-900">Confermi blocco?</span>
      ) : null}
      <button
        type="button"
        onClick={toggleBlock}
        disabled={pending}
        className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
          blocked
            ? "border border-charcoal/10 text-charcoal/70 hover:border-charcoal/25 hover:text-charcoal"
            : "border border-rose-900/15 text-rose-900 hover:bg-rose-100"
        }`}
      >
        {blocked ? <UserCircleCheck size={16} /> : <Prohibit size={16} />}
        {blocked ? "Sblocca" : confirming ? "Conferma blocco" : "Blocca"}
      </button>
      {confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-charcoal/50 transition hover:text-charcoal"
        >
          Annulla
        </button>
      ) : null}
    </div>
  );
}
