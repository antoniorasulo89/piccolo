"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { formatAppDateTime } from "@/lib/dates";

type ChatMessage = {
  id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
    role: "admin" | "user";
  };
};

type MessageListProps = {
  initial: ChatMessage[];
  conversationId: number;
  currentUserId: number;
};

function formatDate(value: string) {
  return formatAppDateTime(value, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList({ initial, conversationId, currentUserId }: MessageListProps) {
  const [messages, setMessages] = useState(initial);
  const lastId = useRef(Math.max(0, ...initial.map((m) => m.id)));

  useEffect(() => {
    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?since=${lastId.current}`);
        if (res.ok) {
          const data: ChatMessage[] = await res.json();
          if (data.length > 0) {
            setMessages((prev) => [...prev, ...data]);
            lastId.current = data[data.length - 1].id;
            window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
          }
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grid gap-3">
      {messages.length ? (
        messages.map((message) => {
          const mine = message.sender.id === currentUserId;
          return (
            <article key={message.id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine ? (
                <Link href={`/profile/${message.sender.id}`} className="mt-1 shrink-0">
                  <UserAvatar user={message.sender} size="sm" />
                </Link>
              ) : null}
              <div
                className={`max-w-[min(38rem,85%)] rounded-lg px-4 py-3 ${
                  mine
                    ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                    : "border border-charcoal/10 bg-paper text-charcoal"
                }`}
              >
                <p className={`text-xs font-semibold ${mine ? "text-paper/72" : "text-charcoal/45"}`}>
                  {message.sender.name} / {formatDate(message.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-7">{message.content}</p>
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-lg border border-dashed border-charcoal/16 bg-paper/64 p-8">
          <h2 className="text-xl font-semibold tracking-tight text-charcoal">Nessun messaggio ancora.</h2>
          <p className="mt-2 text-charcoal/58">Scrivi il primo messaggio qui sotto.</p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
