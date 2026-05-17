"use client";

import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type AccountPrivacyFormProps = {
  initial: {
    privacy_show_email: boolean;
    privacy_discoverable: boolean;
  };
};

export function AccountPrivacyForm({ initial }: AccountPrivacyFormProps) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update(next: typeof values) {
    const previous = values;
    setValues(next);

    startTransition(async () => {
      const response = await fetch("/api/account/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        setValues(previous);
        showToast("Privacy non aggiornata.", "error");
        return;
      }

      showToast("Privacy aggiornata.");
    });
  }

  return (
    <div className="grid gap-3">
      {[
        ["privacy_discoverable", "Rendi il profilo visibile in Esplora"],
        ["privacy_show_email", "Consenti ricerca tramite email"],
      ].map(([key, label]) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 rounded-lg border border-charcoal/10 bg-surface px-4 py-3 text-sm font-semibold text-charcoal/75"
        >
          {label}
          <input
            type="checkbox"
            checked={values[key as keyof typeof values]}
            disabled={pending}
            onChange={(event) => update({ ...values, [key]: event.target.checked })}
            className="h-4 w-4 accent-[var(--fern-900)]"
          />
        </label>
      ))}
    </div>
  );
}
