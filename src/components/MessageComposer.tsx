"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function MessageComposer({ conversationId }: { conversationId: number }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast(payload.error ?? "Messaggio non inviato.", "error");
        return;
      }

      setContent("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Scrivi un messaggio..."
        className="min-h-12 resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
      />
      <button
        type="submit"
        disabled={pending || !content.trim()}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
      >
        <PaperPlaneTilt size={17} weight="bold" />
        Invia
      </button>
    </form>
  );
}
