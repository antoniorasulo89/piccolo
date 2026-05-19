"use client";

import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type AdminDeleteUserButtonProps = {
  userId: number;
  userName: string;
  isCurrentUser: boolean;
};

export function AdminDeleteUserButton({ userId, userName, isCurrentUser }: AdminDeleteUserButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function deleteUser() {
    const confirmed = window.confirm(
      `Eliminare definitivamente ${userName}? L'azione cancella account, post, commenti, messaggi, relazioni e notifiche collegate.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Eliminazione non riuscita.", "error");
        return;
      }

      showToast("Utente eliminato definitivamente.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={deleteUser}
      disabled={pending || isCurrentUser}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-900/15 px-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Trash size={16} weight="bold" />
      Elimina
    </button>
  );
}
