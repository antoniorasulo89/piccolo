"use client";

import { Flag } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function ReportPostButton({ postId }: { postId: number }) {
  const [reported, setReported] = useState(false);
  const [pending, startTransition] = useTransition();

  function reportPost() {
    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Segnalato dall'interfaccia post" }),
      });

      if (!response.ok) {
        const payload = await response.json();
        showToast(payload.error ?? "Segnalazione non inviata.", "error");
        return;
      }

      setReported(true);
      showToast("Segnalazione inviata agli admin.");
    });
  }

  return (
    <button
      type="button"
      onClick={reportPost}
      disabled={pending || reported}
      className="rounded-lg p-1.5 text-charcoal/35 transition hover:bg-clay/15 hover:text-clay-900 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
      aria-label={reported ? "Post segnalato" : "Segnala post"}
      title={reported ? "Post segnalato" : "Segnala post"}
    >
      <Flag size={17} weight={reported ? "fill" : "regular"} />
    </button>
  );
}
