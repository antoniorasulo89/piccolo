"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-medium text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      <SignOut size={17} weight="bold" />
      {pending ? "Uscita" : "Logout"}
    </button>
  );
}
