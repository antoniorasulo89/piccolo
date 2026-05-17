"use client";

import { Key, Link as LinkIcon } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type AdminPasswordResetButtonProps = {
  userId: number;
};

export function AdminPasswordResetButton({ userId }: AdminPasswordResetButtonProps) {
  const [pending, startTransition] = useTransition();
  const [resetUrl, setResetUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (!resetUrl) return;

    const timeout = window.setTimeout(() => {
      setResetUrl("");
      setExpiresAt("");
    }, 30_000);

    return () => window.clearTimeout(timeout);
  }, [resetUrl]);

  function createLink() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/password-reset`, {
        method: "POST",
      });

      const payload = await response.json();
      if (!response.ok) {
        showToast(payload.error ?? "Reset password non disponibile.", "error");
        return;
      }

      setResetUrl(payload.resetUrl);
      setExpiresAt(payload.expires_at ?? "");
      try {
        await navigator.clipboard.writeText(payload.resetUrl);
        showToast("Link copiato. Non sara mostrato di nuovo.");
      } catch {
        showToast("Link generato. Copialo ora.");
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={createLink}
        disabled={pending}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-fern-900/25 hover:bg-fern-100 hover:text-fern-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Key size={16} />
        {pending ? "Genero" : "Reset"}
      </button>
      {resetUrl ? (
        <div className="max-w-56 rounded-md border border-fern-900/15 bg-fern-100 px-2 py-2 text-xs text-fern-950">
          <p className="font-semibold">Copialo ora: sparisce tra 30s.</p>
          <a
            href={resetUrl}
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate font-semibold text-fern-950 underline-offset-4 hover:underline"
          >
            <LinkIcon size={13} />
            {resetUrl}
          </a>
          {expiresAt ? (
            <p className="mt-1 font-mono text-[0.68rem] text-fern-950/55">
              Scade: {expiresAt}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
