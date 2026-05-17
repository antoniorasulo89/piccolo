"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

export function GroupPostComposer({ groupId }: { groupId: number }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const remaining = 280 - content.length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showToast(payload.error ?? "Post non pubblicato.", "error");
        return;
      }

      setContent("");
      showToast("Post pubblicato nel gruppo.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-charcoal/10 bg-surface p-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={280}
        rows={3}
        placeholder="Scrivi nel gruppo..."
        className="w-full resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 leading-7 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`font-mono text-xs ${remaining < 24 ? "text-rose-900" : "text-charcoal/45"}`}>
          {remaining} caratteri
        </p>
        <button
          type="submit"
          disabled={pending || !content.trim() || remaining < 0}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-45"
        >
          <PaperPlaneTilt size={17} weight="bold" />
          {pending ? "Invio" : "Pubblica"}
        </button>
      </div>
    </form>
  );
}
