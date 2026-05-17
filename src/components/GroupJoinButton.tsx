"use client";

import { LockKey, UserPlus, UsersThree } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type GroupJoinButtonProps = {
  groupId: number;
  privacy: "public" | "private";
  initialStatus?: "active" | "pending" | null;
};

export function GroupJoinButton({ groupId, privacy, initialStatus }: GroupJoinButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  function join() {
    startTransition(async () => {
      const response = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        showToast(payload.error ?? "Ingresso non riuscito.", "error");
        return;
      }

      setStatus(payload.status);
      showToast(payload.status === "pending" ? "Richiesta inviata." : "Sei nel gruppo.");
      router.refresh();
    });
  }

  if (status === "active") {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-fern-100 px-4 text-sm font-semibold text-fern-900">
        <UsersThree size={17} weight="bold" />
        Membro
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-clay-100 px-4 text-sm font-semibold text-clay-900">
        <LockKey size={17} weight="bold" />
        Richiesta inviata
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:scale-[0.97] disabled:opacity-50"
    >
      {privacy === "private" ? <LockKey size={17} weight="bold" /> : <UserPlus size={17} weight="bold" />}
      {pending ? "Attendo" : privacy === "private" ? "Richiedi accesso" : "Entra"}
    </button>
  );
}
