"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch("/api/admin/logout", { method: "POST" });
        } finally {
          router.replace("/admin/login");
          router.refresh();
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/20 px-3.5 py-2 text-[0.7rem] uppercase tracking-[0.18em] text-burgundy transition hover:bg-blush/50 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
      )}
      Sign out
    </button>
  );
}
