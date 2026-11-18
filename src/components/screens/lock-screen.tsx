"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock, LockOpen, Loader2 } from "lucide-react";
import { LockIllustration, type LockState } from "@/components/lock-illustration";
import { BlossomRule, Sprig } from "@/components/ornaments";
import { playUnlockChime } from "@/components/music";
import { LOCK } from "@/lib/content";
import { toLatinDigits } from "@/lib/validation";

export function LockScreen({
  alreadyUnlocked,
  onUnlocked,
}: {
  alreadyUnlocked: boolean;
  onUnlocked: () => void;
}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState("");
  const [state, setState] = useState<LockState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (alreadyUnlocked) {
      setState("unlocked");
      const timeout = window.setTimeout(onUnlocked, 1400);
      return () => window.clearTimeout(timeout);
    }
    inputRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [alreadyUnlocked, onUnlocked]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "checking" || state === "unlocked") return;
    if (value.trim().length < 4) {
      setError(LOCK.error);
      setShakeKey((key) => key + 1);
      return;
    }

    setState("checking");
    setError(null);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (response.ok && data.ok) {
        setState("unlocked");
        playUnlockChime();
        window.setTimeout(onUnlocked, reduced ? 250 : 1500);
        return;
      }

      setState("error");
      setShakeKey((key) => key + 1);
      setError(data.error ?? LOCK.error);
      window.setTimeout(() => setState("idle"), 700);
    } catch {
      setState("error");
      setError("Something went wrong on my side. Give it another try, my love.");
      window.setTimeout(() => setState("idle"), 700);
    }
  }

  const unlocked = state === "unlocked";

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16 sm:px-8">
      <Sprig className="pointer-events-none absolute -left-6 top-10 h-28 w-28 text-rose/35 sm:left-4 sm:h-40 sm:w-40" />
      <Sprig className="pointer-events-none absolute -right-8 bottom-16 h-24 w-24 rotate-180 text-sage/30 sm:right-6 sm:h-36 sm:w-36" />

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl text-center"
      >
        <p className="eyebrow mb-6">For Samee, from Yousuf</p>

        <h1 className="font-display text-[2.6rem] leading-[1.06] tracking-tight text-burgundy sm:text-6xl">
          Hey, My Samee
        </h1>

        <p className="mx-auto mt-5 max-w-md text-pretty text-[0.98rem] leading-relaxed text-muted sm:text-lg">
          {LOCK.subtitle}
        </p>

        <BlossomRule className="my-8 sm:my-10" />

        <motion.div
          key={shakeKey}
          className={state === "error" ? "animate-shake" : undefined}
          animate={reduced ? undefined : { scale: unlocked ? 1.04 : 1 }}
          transition={{ duration: 0.5 }}
        >
          <LockIllustration state={state} />
        </motion.div>

        <form onSubmit={submit} className="mx-auto mt-8 w-full max-w-sm text-left">
          <label
            htmlFor="special-date"
            className="mb-2 block text-center text-[0.7rem] uppercase tracking-[0.32em] text-muted"
          >
            {unlocked ? "Unlocked, my love" : "Only you know this one"}
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-burgundy/45">
              {unlocked ? (
                <LockOpen className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              )}
            </span>
            <input
              ref={inputRef}
              id="special-date"
              name="special-date"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="lock-help lock-error"
              aria-invalid={Boolean(error)}
              disabled={unlocked || state === "checking"}
              value={value}
              onChange={(event) => {
                // Bengali / Arabic-Indic / fullwidth digits are converted to
                // Latin instead of being deleted, so a Bangla keyboard works.
                setValue(toLatinDigits(event.target.value).replace(/[^0-9\s/-]/g, "").slice(0, 20));
                if (error) setError(null);
                if (state === "error") setState("idle");
              }}
              placeholder={LOCK.placeholder}
              className={`field h-[3.35rem] pl-11 pr-4 text-center text-[0.95rem] tracking-[0.14em] ${error ? "field-error" : ""}`}
            />
          </div>

          <p id="lock-help" className="mt-2.5 text-center text-xs text-muted/85">
            {LOCK.hint}
          </p>

          <div aria-live="polite" className="min-h-[1.75rem] pt-1.5 text-center">
            {error && (
              <p id="lock-error" className="text-sm text-[#a33a4a]">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={state === "checking" || unlocked}
            className="btn-primary mt-1 h-[3.35rem] w-full"
          >
            {state === "checking" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Opening…
              </>
            ) : unlocked ? (
              <>
                <LockOpen className="h-4 w-4" aria-hidden="true" />
                Come in, Samee
              </>
            ) : (
              <>
                {LOCK.button}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-[0.7rem] uppercase tracking-[0.34em] text-rose/70">
          Only for Samiya
        </p>
      </motion.div>
    </section>
  );
}
