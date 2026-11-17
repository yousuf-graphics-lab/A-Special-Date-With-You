"use client";

import { useEffect } from "react";
import { HeartCrack, RotateCcw } from "lucide-react";
import { Sprig } from "@/components/ornaments";

/**
 * A soft landing for anything unexpected.
 *
 * Without this file a render error in any screen replaces the whole page with
 * a blank white rectangle — which looks exactly like "nothing happened" and
 * gives nobody a way forward. Here she gets a warm sentence and a way back.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // For Yousuf's eyes in the browser console only — never shown on screen.
    console.error("[for-samee] screen error", error);
  }, [error]);

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <Sprig className="pointer-events-none absolute -left-6 top-12 h-28 w-28 text-rose/30 sm:left-4 sm:h-40 sm:w-40" />
      <Sprig className="pointer-events-none absolute -right-8 bottom-16 h-24 w-24 rotate-180 text-sage/25 sm:right-6 sm:h-36 sm:w-36" />

      <div className="w-full max-w-md">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-blush/50 text-burgundy">
          <HeartCrack className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
        </span>

        <h1 className="font-display text-3xl leading-tight text-burgundy sm:text-4xl">
          Ekta chhoto jhamela hoye geche
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-pretty text-[0.95rem] leading-relaxed text-muted">
          Kichu ekta thik moto load hote pareni, my love. Tomar kono kichu haray
          ni — ekbar arekbar chesta koro.
        </p>

        <button type="button" onClick={reset} className="btn-primary mt-8">
          <RotateCcw className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          Abar chesta kori
        </button>

        <p className="mt-10 text-[0.7rem] uppercase tracking-[0.34em] text-rose/70">
          Only for Samiya
        </p>
      </div>
    </section>
  );
}
