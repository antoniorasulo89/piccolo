"use client";

import { ChatCenteredText, PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type CommentFormProps = {
  postId: number;
};

export function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const remaining = 500 - content.length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const payload = await response.json();
        const message = payload.error ?? "Commento non salvato.";
        setError(message);
        showToast(message, "error");
        return;
      }

      setContent("");
      showToast("Commento pubblicato.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-charcoal/10 bg-surface p-4 shadow-[0_18px_56px_-48px_oklch(22%_0.018_160)]"
    >
      <label htmlFor="comment" className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <ChatCenteredText size={17} className="text-clay-900" />
        Aggiungi un commento
      </label>
      <textarea
        id="comment"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Rispondi con qualcosa di utile, gentile o preciso."
        className="mt-3 min-h-24 w-full resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 text-base leading-7 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className={`font-mono text-xs ${remaining < 40 ? "text-rose-900" : "text-charcoal/45"}`}>
            {remaining} caratteri
          </p>
          {error ? <p className="mt-1 text-sm text-rose-900">{error}</p> : null}
        </div>
        <button
          type="submit"
          disabled={pending || !content.trim() || remaining < 0}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <PaperPlaneTilt size={17} weight="bold" />
          {pending ? "Invio" : "Commenta"}
        </button>
      </div>
    </form>
  );
}
