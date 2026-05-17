"use client";

import { PushPin, PushPinSlash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function PinPostButton({ postId, pinned }: { postId: number; pinned: boolean }) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(pinned);
  const [pending, startTransition] = useTransition();

  function togglePin() {
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/pin`, { method: "PATCH" });
      if (!res.ok) {
        showToast("Impossibile fissare il post.", "error");
        return;
      }
      const data = await res.json();
      setIsPinned(data.pinned);
      showToast(data.pinned ? "Post fissato in alto." : "Post rimosso dalla cima.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={togglePin}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-charcoal/50 transition hover:bg-amber-100 hover:text-amber-900 active:scale-[0.97] disabled:opacity-50"
      title={isPinned ? "Rimuovi dalla cima" : "Fissa in alto"}
    >
      {isPinned ? <PushPinSlash size={14} weight="bold" /> : <PushPin size={14} weight="bold" />}
    </button>
  );
}
