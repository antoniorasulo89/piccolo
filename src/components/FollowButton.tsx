"use client";

import { UserMinus, UserPlus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type FollowButtonProps = {
  userId: number;
  initialFollowing: boolean;
  variant?: "solid" | "outline";
};

export function FollowButton({
  userId,
  initialFollowing,
  variant = "solid",
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggleFollow() {
    const previous = following;
    setFollowing(!following);

    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });

      if (!response.ok) {
        setFollowing(previous);
        showToast("Non sono riuscito ad aggiornare il follow.", "error");
        return;
      }

      const payload = await response.json();
      setFollowing(payload.following);
      showToast(payload.following ? "Utente seguito." : "Follow rimosso.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={pending}
      className={
        variant === "outline"
          ? "inline-flex h-10 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-4 text-sm font-semibold text-charcoal/70 transition duration-300 hover:border-clay hover:bg-clay-100 hover:text-clay-900 active:scale-[0.97] disabled:opacity-50"
          : "inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition duration-300 hover:bg-fern-900 active:scale-[0.97] disabled:opacity-50"
      }
    >
      {following ? <UserMinus size={17} weight="bold" /> : <UserPlus size={17} weight="bold" />}
      {following ? "Segui già" : "Segui"}
    </button>
  );
}
