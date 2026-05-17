"use client";

import { Heart } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type LikeButtonProps = {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
};

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  const [bouncing, setBouncing] = useState(false);

  function toggleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((value) => value + (nextLiked ? 1 : -1));
    if (nextLiked) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 350);
    }

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        setLiked(liked);
        setCount(initialCount);
        showToast("Like non aggiornato.", "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={pending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-300 active:scale-[0.96] disabled:opacity-60 ${
        bouncing ? "animate-like-pop" : ""
      } ${
        liked
          ? "bg-rose-100 text-rose-900 shadow-[inset_0_0_0_1px_oklch(36%_0.09_24_/_0.12)]"
          : "text-charcoal/60 hover:bg-rose-100 hover:text-rose-900"
      }`}
    >
      <Heart size={18} weight={liked ? "fill" : "regular"} />
      <span>{count}</span>
    </button>
  );
}
