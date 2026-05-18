"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type UnreadData = {
  unreadNotifications: number;
  unreadMessages: number;
  pendingGroupRequests: number;
  openReports: number;
};

let currentData: UnreadData | null = null;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let activePollers = 0;

function notify() {
  listeners.forEach((l) => l());
}

function startPolling() {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/me/unread");
      if (res.ok) {
        const data = await res.json();
        if (JSON.stringify(data) !== JSON.stringify(currentData)) {
          currentData = data;
          notify();
        }
      }
    } catch {
      // ignore polling errors
    }
  }, 7000);
}

function stopPolling() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  activePollers++;
  if (activePollers === 1) startPolling();
  return () => {
    listeners.delete(listener);
    activePollers--;
    if (activePollers === 0) stopPolling();
  };
}

function getSnapshot() {
  return currentData;
}

export function useUnreadCounts(initial?: UnreadData) {
  const data = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (initial && !currentData) {
      currentData = initial;
      notify();
    }
  }, [initial]);

  useEffect(() => {
    const onRefresh = () => {
      fetch("/api/me/unread")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d && JSON.stringify(d) !== JSON.stringify(currentData)) {
            currentData = d;
            notify();
          }
        })
        .catch(() => {});
    };
    window.addEventListener("piccolo:refresh-counts", onRefresh);
    return () => window.removeEventListener("piccolo:refresh-counts", onRefresh);
  }, []);

  const refreshCounts = useCallback(() => {
    window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
  }, []);

  return {
    counts: data ?? initial ?? { unreadNotifications: 0, unreadMessages: 0, pendingGroupRequests: 0, openReports: 0 },
    refreshCounts,
  };
}
