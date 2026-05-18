"use client";

import { SlidersHorizontal } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type NotificationPreferencesFormProps = {
  initial: {
    notify_likes: boolean;
    notify_comments: boolean;
    notify_follows: boolean;
    notify_group_posts: boolean;
  };
};

export function NotificationPreferencesForm({
  initial,
}: NotificationPreferencesFormProps) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update(next: typeof values) {
    setValues(next);
    startTransition(async () => {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        setValues(values);
        showToast("Preferenze non aggiornate.", "error");
        return;
      }

      showToast("Preferenze aggiornate.");
    });
  }

  return (
    <div className="rounded-lg border border-charcoal/10 bg-paper p-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-fern-900" />
        <h2 className="font-semibold text-charcoal">Preferenze</h2>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          ["notify_likes", "Like"],
          ["notify_comments", "Commenti"],
          ["notify_follows", "Follow"],
          ["notify_group_posts", "Post nei gruppi"],
        ].map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-charcoal/10 bg-surface px-3 py-2 text-sm font-semibold text-charcoal/70"
          >
            {label}
            <input
              type="checkbox"
              checked={values[key as keyof typeof values]}
              disabled={pending}
              onChange={(event) =>
                update({ ...values, [key]: event.target.checked })
              }
              className="h-4 w-4 accent-[var(--fern-900)]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
