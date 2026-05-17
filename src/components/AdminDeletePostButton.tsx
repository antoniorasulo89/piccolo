"use client";

import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminDeletePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function deletePost() {
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Eliminazione non riuscita.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        onClick={deletePost}
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-900/15 px-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 active:translate-y-px disabled:opacity-50"
      >
        <Trash size={16} />
        Rimuovi
      </button>
      {error ? <p className="max-w-44 text-right text-xs text-rose-900">{error}</p> : null}
    </div>
  );
}
