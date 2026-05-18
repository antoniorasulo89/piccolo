"use client";

import { LockKey, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminGroup = {
  id: number;
  name: string;
  slug: string;
  privacy: string;
  description: string;
  created_at: string;
  owner_name: string;
  members_count: number;
  posts_count: number;
};

export function AdminGroups() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((data) => setGroups(data))
      .catch(() => {});
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
      {groups.length ? (
        groups.map((group) => (
          <div key={group.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 p-4 last:border-b-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/groups/${group.slug}`} className="font-semibold text-charcoal hover:underline">
                  {group.name}
                </Link>
                <span className="inline-flex items-center gap-1 rounded-md bg-clay-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-clay-900">
                  {group.privacy === "private" ? <LockKey size={12} weight="bold" /> : <UsersThree size={12} weight="bold" />}
                  {group.privacy === "private" ? "Privato" : "Pubblico"}
                </span>
              </div>
              <p className="mt-1 text-sm text-charcoal/50">
                Owner: {group.owner_name} / {group.members_count} membri / {group.posts_count} post
              </p>
            </div>
            <Link
              href={`/groups/${group.slug}?tab=settings`}
              className="rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal"
            >
              Gestisci
            </Link>
          </div>
        ))
      ) : (
        <div className="p-8 text-sm text-charcoal/55">Nessun gruppo creato.</div>
      )}
    </div>
  );
}
