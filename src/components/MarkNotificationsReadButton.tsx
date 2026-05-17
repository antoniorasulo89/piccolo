"use client";

import { Check } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

export function MarkNotificationsReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead() {
    startTransition(async () => {
      const response = await fetch("/api/notifications", { method: "PATCH" });

      if (!response.ok) {
        showToast("Notifiche non aggiornate.", "error");
        return;
      }

      showToast("Notifiche segnate come lette.");
      window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={disabled || pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-charcoal/10 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Check size={17} weight="bold" />
      Segna lette
    </button>
  );
}
