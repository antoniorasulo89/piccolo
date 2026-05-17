"use client";

import { Prohibit, UserCircleCheck } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type AdminSuspendButtonProps = {
  userId: number;
  suspended: boolean;
  isCurrentUser: boolean;
};

export function AdminSuspendButton({
  userId,
  suspended,
  isCurrentUser,
}: AdminSuspendButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function updateSuspension() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/suspension`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !suspended }),
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Stato utente non aggiornato.", "error");
        return;
      }

      showToast(suspended ? "Utente riattivato." : "Utente sospeso.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={updateSuspension}
      disabled={pending || isCurrentUser}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-rose-900/25 hover:bg-rose-100 hover:text-rose-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {suspended ? <UserCircleCheck size={16} /> : <Prohibit size={16} />}
      {suspended ? "Riattiva" : "Sospendi"}
    </button>
  );
}
