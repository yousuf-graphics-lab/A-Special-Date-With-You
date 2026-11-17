"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Rose, Tulip, BabyBreath, Leaf, BlossomCluster } from "@/components/flowers";
import { PROPOSAL } from "@/lib/content";

export function ProposalScreen({
  onAccept,
  onThink,
}: {
  onAccept: () => void;
  onThink: () => void;
}) {
  const reduced = useReducedMotion();
  const [showThink, setShowThink] = useState(false);

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16 sm:px-8">
      {/* animated floral arrangement behind the invitation */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 0.28, scale: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative h-[36rem] w-[36rem] sm:h-[46rem] sm:w-[46rem]">
            <Rose tone="blush" className="absolute left-[6%] top-[22%] h-24 w-24 sm:h-32 sm:w-32" />
            <Rose tone="rose" className="absolute right-[8%] top-[12%] h-20 w-20 sm:h-28 sm:w-28" />
            <Tulip tone="ivory" className="absolute bottom-[16%] left-[14%] h-24 w-16 sm:h-32 sm:w-24" />
            <Tulip tone="gold" className="absolute bottom-[22%] right-[16%] h-20 w-14 sm:h-28 sm:w-20" />
            <BabyBreath className="absolute bottom-[6%] left-[44%] h-24 w-16 sm:h-32 sm:w-24" />
            <Leaf className="absolute left-[30%] top-[4%] h-16 w-10 opacity-70" rotate={-18} />
            <Leaf className="absolute right-[32%] bottom-[2%] h-16 w-10 opacity-70" rotate={22} />
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <BlossomCluster className="mx-auto mb-4 h-12 w-48 text-rose sm:h-14 sm:w-56" />
          <p className="eyebrow mb-5">And now the real question</p>

          <h2 className="font-display text-[2.15rem] leading-[1.1] tracking-tight text-burgundy sm:text-[3.1rem]">
            {PROPOSAL.heading}
          </h2>
        </motion.div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-7 max-w-xl"
        >
          <p className="text-pretty text-[1rem] leading-relaxed text-muted sm:text-[1.08rem]">
            {PROPOSAL.body}
          </p>
          <p className="mt-5 font-serif text-[1.18rem] italic text-burgundy/85 sm:text-[1.32rem]">
            {PROPOSAL.question}
          </p>
        </motion.div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: reduced ? 0 : 0.45 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
        >
          <button
            type="button"
            onClick={onAccept}
            className="btn-primary w-full max-w-xs sm:w-auto"
          >
            <Heart className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {PROPOSAL.accept}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowThink(true);
              onThink();
            }}
            className="btn-ghost w-full max-w-xs sm:w-auto"
          >
            {PROPOSAL.think}
          </button>
        </motion.div>

        <div aria-live="polite" className="mt-7 min-h-[4.5rem]">
          <AnimatePresence>
            {showThink && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-md rounded-2xl border border-gold/35 bg-cream/80 px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur-sm"
              >
                <p className="flex items-start gap-2.5 text-left text-sm leading-relaxed text-ink/80">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden="true" />
                  <span>{PROPOSAL.thinkResponse}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
