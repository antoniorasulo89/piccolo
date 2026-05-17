"use client";

import { BookmarkSimple } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type BookmarkButtonProps = {
  postId: number;
  initialBookmarked: boolean;
};

export function BookmarkButton({
  postId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function toggleBookmark() {
    const previous = bookmarked;
    setBookmarked(!bookmarked);

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
      });

      if (!response.ok) {
        setBookmarked(previous);
        showToast("Salvataggio non aggiornato.", "error");
        return;
      }

      const payload = await response.json();
      setBookmarked(payload.bookmarked);
      showToast(payload.bookmarked ? "Post salvato." : "Post rimosso dai salvati.");
    });
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={pending}
      aria-pressed={bookmarked}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-300 active:scale-[0.96] disabled:opacity-60 ${
        bookmarked
          ? "bg-clay-100 text-clay-900 shadow-[inset_0_0_0_1px_oklch(64%_0.092_58_/_0.2)]"
          : "text-charcoal/60 hover:bg-clay-100 hover:text-clay-900"
      }`}
      title={bookmarked ? "Rimuovi dai salvati" : "Salva post"}
    >
      <BookmarkSimple size={18} weight={bookmarked ? "fill" : "regular"} />
    </button>
  );
}
