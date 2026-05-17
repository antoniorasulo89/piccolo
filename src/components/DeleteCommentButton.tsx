"use client";

import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type DeleteCommentButtonProps = {
  commentId: number;
  label?: string;
};

export function DeleteCommentButton({
  commentId,
  label,
}: DeleteCommentButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function deleteComment() {
    startTransition(async () => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Commento non eliminato.", "error");
        return;
      }

      showToast("Commento eliminato.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={deleteComment}
      disabled={pending}
      className={
        label
          ? "inline-flex h-9 items-center gap-2 rounded-lg border border-rose-900/15 px-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50"
          : "rounded-lg p-1.5 text-charcoal/35 transition hover:bg-rose-100 hover:text-rose-900 active:translate-y-px disabled:opacity-50"
      }
      aria-label={label ?? "Elimina commento"}
    >
      <Trash size={16} />
      {label}
    </button>
  );
}
