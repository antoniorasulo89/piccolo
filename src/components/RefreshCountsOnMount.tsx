"use client";

import { useEffect } from "react";

export function RefreshCountsOnMount() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("piccolo:refresh-counts"));
  }, []);

  return null;
}
