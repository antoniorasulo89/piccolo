"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "./ToastProvider";

type ResolveReportButtonProps = {
  reportId: number;
  status?: "resolved" | "dismissed";
};

export function ResolveReportButton({
  reportId,
  status = "resolved",
}: ResolveReportButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function resolve() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: status === "dismissed" ? "Segnalazione archiviata" : "Segnalazione gestita",
        }),
      });

      if (!response.ok) {
        showToast("Segnalazione non risolta.", "error");
        return;
      }

      showToast(status === "dismissed" ? "Segnalazione archiviata." : "Segnalazione risolta.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={resolve}
      disabled={pending}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-fern-700/30 hover:bg-fern-100 hover:text-fern-900 active:scale-[0.98] disabled:opacity-50"
    >
      <CheckCircle size={16} weight="bold" />
      {status === "dismissed" ? "Archivia" : "Risolta"}
    </button>
  );
}
