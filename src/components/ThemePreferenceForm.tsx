"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type ThemePreferenceFormProps = {
  initialTheme: "light" | "dark" | "system";
};

export function ThemePreferenceForm({ initialTheme }: ThemePreferenceFormProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [pending, startTransition] = useTransition();

  function update(nextTheme: "light" | "dark" | "system") {
    const previous = theme;
    setTheme(nextTheme);
    document.documentElement.classList.toggle("theme-dark", nextTheme === "dark");
    document.documentElement.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.classList.toggle("theme-system", nextTheme === "system");

    startTransition(async () => {
      const response = await fetch("/api/account/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme }),
      });

      if (!response.ok) {
        setTheme(previous);
        document.documentElement.classList.toggle("theme-dark", previous === "dark");
        document.documentElement.classList.toggle("theme-light", previous === "light");
        document.documentElement.classList.toggle("theme-system", previous === "system");
        showToast("Tema non aggiornato.", "error");
        return;
      }

      showToast(
        nextTheme === "dark"
          ? "Tema scuro attivo."
          : nextTheme === "light"
            ? "Tema chiaro attivo."
            : "Tema di sistema attivo.",
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-charcoal/10 bg-surface p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { value: "system" as const, label: "Sistema", icon: Desktop },
          { value: "light" as const, label: "Chiaro", icon: Sun },
          { value: "dark" as const, label: "Scuro", icon: Moon },
        ].map((item) => {
          const Icon = item.icon;
          const active = theme === item.value;

          return (
            <button
              key={item.value}
              type="button"
              disabled={pending}
              onClick={() => update(item.value)}
              aria-pressed={active}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
                active
                  ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                  : "border border-charcoal/10 bg-paper/70 text-charcoal/68 hover:border-clay hover:bg-clay-100 hover:text-clay-900"
              }`}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
