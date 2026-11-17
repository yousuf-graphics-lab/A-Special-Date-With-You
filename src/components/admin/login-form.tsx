"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ShieldCheck, User } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Those details do not match.");
        setPending(false);
        return;
      }

      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="paper rounded-2xl p-6 sm:p-7">
      <div className="space-y-4">
        <div>
          <label htmlFor="admin-username" className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.24em] text-muted">
            Username
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-burgundy/40" strokeWidth={1.6} aria-hidden="true" />
            <input
              id="admin-username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="field pl-10"
              placeholder="your username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.24em] text-muted">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-burgundy/40" strokeWidth={1.6} aria-hidden="true" />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pl-10"
              placeholder="your password"
            />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-[#a33a4a]/30 bg-[#fbe9ec] px-3.5 py-2.5 text-[0.82rem] text-[#8f3040]">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-5 w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" /> Sign in
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[0.68rem] leading-relaxed text-muted/75">
        Rate limited, hash-checked, and protected by a server-side session.
      </p>
    </form>
  );
}
