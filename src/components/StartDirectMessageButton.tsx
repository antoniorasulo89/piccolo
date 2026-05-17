"use client";

import { ChatCircleText } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

export function StartDirectMessageButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: [userId] }),
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast(payload.error ?? "DM non aperto.", "error");
        return;
      }

      router.push(`/messages/${payload.id}`);
    });
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900 active:scale-[0.97] disabled:opacity-50"
    >
      <ChatCircleText size={17} weight="bold" />
      Messaggio
    </button>
  );
}
