"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type AdminApproveUserButtonProps = {
  userId: number;
  approved: boolean;
};

export function AdminApproveUserButton({ userId, approved }: AdminApproveUserButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function approveUser() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/approval`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Approvazione non riuscita.", "error");
        return;
      }

      showToast("Utente approvato.");
      router.refresh();
    });
  }

  if (approved) return null;

  return (
    <button
      type="button"
      onClick={approveUser}
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-fern-700/20 bg-fern-100 px-3 text-sm font-semibold text-fern-900 transition hover:border-fern-700/35 hover:bg-fern-700 hover:text-paper active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <CheckCircle size={16} weight="bold" />
      Approva
    </button>
  );
}
