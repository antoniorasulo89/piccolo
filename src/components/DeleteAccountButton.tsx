"use client";

import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function DeleteAccountButton() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function deleteAccount() {
    if (!armed) {
      setArmed(true);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/account", { method: "DELETE" });

      if (!response.ok) {
        showToast("Account non eliminato.", "error");
        return;
      }

      showToast("Account eliminato.");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={deleteAccount}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-900/20 px-4 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
    >
      <Trash size={16} />
      {armed ? "Conferma eliminazione" : "Elimina account"}
    </button>
  );
}
