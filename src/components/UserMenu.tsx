"use client";

import {
  CaretDown,
  GearSix,
  ShieldCheck,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/db";
import { UserAvatar } from "./UserAvatar";

type UserMenuProps = {
  user: PublicUser;
  openReports?: number;
};

export function UserMenu({ user, openReports = 0 }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-transparent px-2 text-sm font-semibold text-charcoal/72 transition hover:border-charcoal/10 hover:bg-clay-100 hover:text-clay-900 active:scale-[0.98]"
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden max-w-32 truncate lg:inline">{user.name}</span>
        <CaretDown size={14} weight="bold" className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Chiudi menu utente"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div
            role="menu"
            className="absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-lg border border-charcoal/10 bg-surface shadow-[0_28px_90px_-58px_oklch(22%_0.018_160)]"
          >
            <div className="border-b border-charcoal/10 p-4">
              <p className="truncate font-semibold text-charcoal">{user.name}</p>
              <p className="mt-1 truncate text-sm text-charcoal/50">{user.email}</p>
            </div>
            <div className="grid p-2">
              <Link
                role="menuitem"
                href={`/profile/${user.id}`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900"
              >
                <UserCircle size={17} weight="bold" />
                Profilo pubblico
              </Link>
              <Link
                role="menuitem"
                href="/settings/account"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900"
              >
                <GearSix size={17} weight="bold" />
                Impostazioni
              </Link>
              {user.role === "admin" ? (
                <Link
                  role="menuitem"
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-charcoal/70 transition hover:bg-clay-100 hover:text-clay-900"
                >
                  <ShieldCheck size={17} weight="bold" />
                  Console amministratore
                  {openReports > 0 && (
                    <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-rose-900">
                      {openReports}
                    </span>
                  )}
                </Link>
              ) : null}
              <button
                role="menuitem"
                type="button"
                onClick={logout}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
              >
                <SignOut size={17} weight="bold" />
                {pending ? "Uscita" : "Logout"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
