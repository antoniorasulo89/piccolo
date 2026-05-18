"use client";

import { ChatCircleText, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Conversation = {
  id: number;
  type: "direct" | "group_dm";
  title: string;
  last_message: string | null;
  last_message_at: string | null;
  members_label: string;
  unread_count: number;
};

type MessagesClientProps = {
  initial: Conversation[];
};

function formatDate(value: string | null) {
  if (!value) return "nessun messaggio";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MessagesClient({ initial }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initial);

  useEffect(() => {
    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          if (JSON.stringify(data) !== JSON.stringify(conversations)) {
            setConversations(data);
          }
        }
      } catch {
        // ignore
      }
    };
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [conversations]);

  return (
    <div className="grid gap-3">
      {conversations.length ? (
        conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={`group relative overflow-hidden rounded-lg border border-charcoal/10 p-4 shadow-[0_20px_60px_-52px_oklch(22%_0.018_160)] transition hover:-translate-y-0.5 hover:border-clay/55 ${
              conversation.unread_count > 0
                ? "bg-linear-to-br from-fern-100/45 via-surface to-surface"
                : "bg-linear-to-br from-surface via-surface to-clay-100/24"
            }`}
          >
            <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${conversation.unread_count > 0 ? "bg-fern-700" : "bg-clay"}`} />
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-charcoal text-paper">
                {conversation.type === "group_dm" ? <UsersThree size={19} weight="bold" /> : <ChatCircleText size={19} weight="bold" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-charcoal">
                    {conversation.title || conversation.members_label || "Conversazione"}
                  </h2>
                  {conversation.unread_count > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 font-mono text-xs font-semibold text-rose-900">
                      {conversation.unread_count} nuovo{conversation.unread_count !== 1 ? "i" : ""}
                    </span>
                  )}
                </div>
                <p className={`mt-1 line-clamp-1 text-sm ${conversation.unread_count > 0 ? "font-medium text-charcoal" : "text-charcoal/58"}`}>
                  {conversation.last_message || "Nessun messaggio ancora."}
                </p>
                <p className="mt-2 font-mono text-xs text-charcoal/42">
                  {conversation.type === "group_dm" ? "DM gruppo" : "DM"} / {formatDate(conversation.last_message_at)}
                </p>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="rounded-lg border border-charcoal/10 bg-surface p-8">
          <h2 className="text-xl font-semibold tracking-tight text-charcoal">Nessuna conversazione.</h2>
          <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
            Apri un DM con un profilo o crea una chat privata con piu persone.
          </p>
        </div>
      )}
    </div>
  );
}
