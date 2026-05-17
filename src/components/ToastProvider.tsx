"use client";

import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

type ToastEvent = CustomEvent<Omit<Toast, "id">>;

export function showToast(message: string, type: Toast["type"] = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("piccolo:toast", {
      detail: { message, type },
    }),
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as ToastEvent).detail;
      const id = Date.now();
      setToasts((current) => [...current.slice(-2), { id, ...detail }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3200);
    }

    window.addEventListener("piccolo:toast", onToast);
    return () => window.removeEventListener("piccolo:toast", onToast);
  }, []);

  return (
    <div className="fixed right-4 top-20 z-40 grid w-[min(22rem,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-toast-in rounded-lg border border-charcoal/10 bg-surface px-4 py-3 shadow-[0_24px_70px_-45px_oklch(22%_0.018_160)]"
        >
          <div className="flex items-start gap-3">
            {toast.type === "success" ? (
              <CheckCircle size={20} weight="bold" className="mt-0.5 shrink-0 text-fern-900" />
            ) : (
              <WarningCircle size={20} weight="bold" className="mt-0.5 shrink-0 text-rose-900" />
            )}
            <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-charcoal">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-md p-1 text-charcoal/45 transition hover:bg-charcoal/[0.06] hover:text-charcoal"
              aria-label="Chiudi notifica"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
