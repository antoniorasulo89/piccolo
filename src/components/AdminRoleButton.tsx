"use client";

import { Shield, ShieldSlash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminRoleButtonProps = {
  userId: number;
  role: "admin" | "user";
  isCurrentUser: boolean;
};

export function AdminRoleButton({
  userId,
  role,
  isCurrentUser,
}: AdminRoleButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const nextRole = role === "admin" ? "user" : "admin";

  function updateRole() {
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Cambio ruolo non riuscito.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={updateRole}
        disabled={pending || (isCurrentUser && role === "admin")}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
      >
        {nextRole === "admin" ? <Shield size={16} /> : <ShieldSlash size={16} />}
        {role === "admin" ? "Rendi user" : "Rendi admin"}
      </button>
      {error ? <p className="max-w-40 text-xs text-rose-900">{error}</p> : null}
    </div>
  );
}
