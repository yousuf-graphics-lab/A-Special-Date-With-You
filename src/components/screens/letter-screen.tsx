"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Feather } from "lucide-react";
import { CornerFlourish, WaxSeal } from "@/components/ornaments";
import { LETTER } from "@/lib/content";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
};

export function LetterScreen({ onContinue }: { onContinue: () => void }) {
  const reduced = useReducedMotion();

  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  return (
    <section className="relative flex min-h-dvh flex-col items-center px-4 py-14 sm:px-8 sm:py-20">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="eyebrow mb-3 text-center"
      >
        {LETTER.eyebrow}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="gold-rule mb-8 w-40 sm:w-56"
      />

      <motion.article
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="paper relative w-full max-w-[42rem] rounded-[18px] px-6 pb-12 pt-10 sm:rounded-[22px] sm:px-14 sm:pb-16 sm:pt-14"
      >
        <CornerFlourish className="pointer-events-none absolute right-3 top-3 h-16 w-16 text-gold/60 sm:right-5 sm:top-5 sm:h-24 sm:w-24" />
        <CornerFlourish className="pointer-events-none absolute bottom-3 left-3 h-16 w-16 rotate-180 text-gold/60 sm:bottom-5 sm:left-5 sm:h-24 sm:w-24" />

        <div className="mb-7 flex items-center gap-3 text-rose/70">
          <Feather className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[0.62rem] uppercase tracking-[0.34em]">A letter for you</span>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="font-serif text-[1.12rem] leading-[1.95] text-ink/90 sm:text-[1.22rem] sm:leading-[2.05]"
        >
          <motion.p variants={item} className="mb-6 font-display text-[1.35rem] italic text-burgundy sm:text-[1.5rem]">
            {LETTER.salutation}
          </motion.p>

          {LETTER.paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              variants={item}
              className={index === LETTER.paragraphs.length - 1 ? "mt-7 font-display text-[1.18rem] italic text-burgundy sm:text-[1.3rem]" : "mb-5"}
            >
              {paragraph}
            </motion.p>
          ))}

          <motion.div variants={item} className="mt-10">
            <p className="text-[1.02rem] italic text-muted">{LETTER.closing}</p>
            <p className="mt-4 text-[1.02rem] text-ink/85">{LETTER.signoff}</p>
            <p className="mt-1 font-script text-[2.4rem] leading-tight text-burgundy sm:text-[3rem]">
              {LETTER.signature}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduced ? 0 : 1.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute -bottom-6 right-6 sm:-bottom-7 sm:right-12"
        >
          <WaxSeal initials="Y" />
        </motion.div>
      </motion.article>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 1.2, duration: 0.9 }}
        className="mt-14 flex flex-col items-center gap-3 text-center"
      >
        <button type="button" onClick={onContinue} className="btn-primary">
          {LETTER.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="text-xs text-muted/80">Take your time, my love.</p>
      </motion.div>
    </section>
  );
}
