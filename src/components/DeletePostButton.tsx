"use client";

import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

export function DeletePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function deletePost() {
    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Post eliminato.");
        router.refresh();
        return;
      }

      showToast("Post non eliminato.", "error");
    });
  }

  return (
    <button
      type="button"
      onClick={deletePost}
      disabled={pending}
      aria-label="Cancella post"
      className="rounded-lg p-1.5 text-charcoal/35 transition hover:bg-rose-100 hover:text-rose-900 active:translate-y-px disabled:opacity-50"
    >
      <Trash size={17} />
    </button>
  );
}
