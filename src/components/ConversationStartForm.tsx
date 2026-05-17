"use client";

import { ChatCircleText, PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type ConversationStartFormProps = {
  users: Array<{ id: number; name: string }>;
};

export function ConversationStartForm({ users }: ConversationStartFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selected,
          title: form.get("title"),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast(payload.error ?? "Chat non creata.", "error");
        return;
      }

      showToast("Conversazione pronta.");
      router.push(`/messages/${payload.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-charcoal/10 bg-surface p-4">
      <label htmlFor="conversation-title" className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <ChatCircleText size={17} weight="bold" className="text-clay-900" />
        Nuova conversazione
      </label>
      <input
        id="conversation-title"
        name="title"
        placeholder="Titolo per DM di gruppo, opzionale"
        className="mt-3 h-10 w-full rounded-lg border border-charcoal/10 bg-paper px-3 text-sm outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
      />
      <div className="mt-3 max-h-52 overflow-auto rounded-lg border border-charcoal/10 bg-paper/70 p-2">
        {users.length ? (
          users.map((user) => (
            <label
              key={user.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-charcoal/72 transition hover:bg-clay-100 hover:text-clay-900"
            >
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggle(user.id)}
              />
              {user.name}
            </label>
          ))
        ) : (
          <p className="p-2 text-sm text-charcoal/55">Non ci sono ancora altri utenti disponibili.</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending || selected.length === 0}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
      >
        <PaperPlaneTilt size={17} weight="bold" />
        {pending ? "Creo" : selected.length > 1 ? "Crea DM gruppo" : "Apri DM"}
      </button>
    </form>
  );
}
