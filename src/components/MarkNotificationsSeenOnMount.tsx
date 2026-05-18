"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function MarkNotificationsSeenOnMount() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    fetch("/api/notifications", { method: "PATCH" })
      .then(() => {
        window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
        router.refresh();
      })
      .catch(() => {});
  }, [router]);

  return null;
}
