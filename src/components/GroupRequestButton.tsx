"use client";

import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type GroupRequestButtonProps = {
  groupId: number;
  userId: number;
  status: "approved" | "rejected";
};

export function GroupRequestButton({ groupId, userId, status }: GroupRequestButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const response = await fetch(`/api/groups/${groupId}/requests/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast(payload.error ?? "Richiesta non aggiornata.", "error");
        return;
      }

      showToast(status === "approved" ? "Richiesta approvata." : "Richiesta rifiutata.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={pending}
      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
        status === "approved"
          ? "bg-fern-100 text-fern-900 hover:bg-clay-100 hover:text-clay-900"
          : "border border-charcoal/10 text-charcoal/62 hover:border-rose-900/25 hover:text-rose-900"
      }`}
    >
      {status === "approved" ? <CheckCircle size={16} weight="bold" /> : <XCircle size={16} weight="bold" />}
      {status === "approved" ? "Approva" : "Rifiuta"}
    </button>
  );
}
