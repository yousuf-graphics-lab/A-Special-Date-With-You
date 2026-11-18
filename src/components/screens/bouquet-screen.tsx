"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BabyBreath, Leaf, Rose, Tulip } from "@/components/flowers";
import { BlossomRule } from "@/components/ornaments";
import { BOUQUET } from "@/lib/content";

/**
 * The bouquet is laid out in a fixed 400 × 410 design space and scaled with
 * percentages, so one arrangement works at every screen size.
 */
const DESIGN = { width: 400, height: 410 };

type Stem = {
  id: string;
  kind: "rose" | "tulip" | "breath" | "leaf";
  tone: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
};

const STEMS: Stem[] = [
  { id: "b1", kind: "breath", tone: "ivory", x: 112, y: 78, rotate: -16, scale: 0.72, delay: 1.35 },
  { id: "b2", kind: "breath", tone: "sage", x: 300, y: 84, rotate: 18, scale: 0.68, delay: 1.45 },
  { id: "b3", kind: "breath", tone: "ivory", x: 208, y: 52, rotate: 6, scale: 0.62, delay: 1.55 },
  { id: "t1", kind: "tulip", tone: "ivory", x: 86, y: 176, rotate: -22, scale: 0.78, delay: 1.2 },
  { id: "t2", kind: "tulip", tone: "gold", x: 320, y: 186, rotate: 20, scale: 0.74, delay: 1.28 },
  { id: "l1", kind: "leaf", tone: "sage", x: 96, y: 246, rotate: -54, scale: 0.95, delay: 0.95 },
  { id: "l2", kind: "leaf", tone: "sage", x: 312, y: 250, rotate: 54, scale: 0.92, delay: 1.0 },
  { id: "l3", kind: "leaf", tone: "sage", x: 146, y: 252, rotate: -22, scale: 0.7, delay: 1.05 },
  { id: "l4", kind: "leaf", tone: "sage", x: 262, y: 256, rotate: 22, scale: 0.68, delay: 1.1 },
  { id: "r1", kind: "rose", tone: "burgundy", x: 148, y: 132, rotate: -8, scale: 0.72, delay: 1.1 },
  { id: "r2", kind: "rose", tone: "rose", x: 264, y: 136, rotate: 8, scale: 0.68, delay: 1.2 },
  { id: "r3", kind: "rose", tone: "ivory", x: 210, y: 104, rotate: 0, scale: 0.58, delay: 1.3 },
  { id: "r4", kind: "rose", tone: "blush", x: 168, y: 202, rotate: -5, scale: 0.66, delay: 1.35 },
  { id: "r5", kind: "rose", tone: "blush", x: 244, y: 204, rotate: 6, scale: 0.63, delay: 1.4 },
];

const CENTRE: Stem = {
  id: "r6",
  kind: "rose",
  tone: "rose",
  x: 206,
  y: 168,
  rotate: 0,
  scale: 0.9,
  delay: 0.9,
};

const BOX = 200; // every illustration is a 200×200 box

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

function flowerNode(stem: Stem) {
  switch (stem.kind) {
    case "rose":
      return <Rose tone={stem.tone} size={BOX} />;
    case "tulip":
      return <Tulip tone={stem.tone} size={BOX} />;
    case "breath":
      return <BabyBreath tone={stem.tone} size={BOX} />;
    default:
      return <Leaf tone={stem.tone} className="h-full w-full" />;
  }
}

export function BouquetScreen({ onContinue }: { onContinue: () => void }) {
  const reduced = useReducedMotion();
  const timing = (delay: number) =>
    reduced
      ? { duration: 0 }
      : { delay, duration: 1.15, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-[26rem]">
        <div className="relative mx-auto w-full" style={{ aspectRatio: `${DESIGN.width} / ${DESIGN.height}` }}>
          {/* light pooled behind the bouquet */}
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-[46%] h-[70%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(247,221,227,0.85) 0%, rgba(216,183,122,0.26) 48%, transparent 74%)",
            }}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />

          {/* kraft wrap and silk ribbon */}
          <motion.svg
            viewBox={`0 0 ${DESIGN.width} ${DESIGN.height}`}
            className="absolute inset-0 z-0 h-full w-full"
            aria-hidden="true"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={timing(1.75)}
          >
            <defs>
              <linearGradient id="bouquet-wrap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fffaf5" />
                <stop offset="45%" stopColor="#fbeadf" />
                <stop offset="100%" stopColor="#edd2c6" />
              </linearGradient>
              <linearGradient id="bouquet-ribbon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eed6a7" />
                <stop offset="50%" stopColor="#d8b77a" />
                <stop offset="100%" stopColor="#b48c53" />
              </linearGradient>
            </defs>
            <path
              d="M132 246C132 246 108 322 100 380C124 392 288 392 312 380C304 322 280 246 280 246Z"
              fill="url(#bouquet-wrap)"
            />
            <path d="M142 250L120 380" stroke="#dcbfae" strokeWidth="1.4" opacity="0.55" />
            <path d="M270 250L292 380" stroke="#dcbfae" strokeWidth="1.4" opacity="0.55" />
            <path d="M172 248L164 386" stroke="#f3ddcf" strokeWidth="1.2" opacity="0.7" />
            <path d="M240 248L248 386" stroke="#f3ddcf" strokeWidth="1.2" opacity="0.7" />
            <path d="M198 250C210 300 214 340 212 382" stroke="#f7e6da" strokeWidth="1.1" opacity="0.55" fill="none" />
            <rect x="96" y="272" width="208" height="14" rx="7" fill="url(#bouquet-ribbon)" opacity="0.97" />
            <path d="M200 278C182 260 160 268 162 281C164 293 185 289 200 278Z" fill="url(#bouquet-ribbon)" />
            <path d="M200 278C218 260 240 268 238 281C236 293 215 289 200 278Z" fill="url(#bouquet-ribbon)" />
            <path
              d="M200 280C193 294 175 302 161 297"
              fill="none"
              stroke="url(#bouquet-ribbon)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M200 280C207 296 225 304 239 299"
              fill="none"
              stroke="url(#bouquet-ribbon)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <ellipse cx="200" cy="279" rx="9.5" ry="7.5" fill="#d8b77a" />
            <ellipse cx="200" cy="278" rx="4" ry="3" fill="#f9edd2" />
          </motion.svg>

          {/* the one bud she gets first */}
          <motion.div
            className="absolute z-20"
            style={{
              left: pct(CENTRE.x - (BOX * CENTRE.scale) / 2, DESIGN.width),
              top: pct(CENTRE.y - (BOX * CENTRE.scale) / 2, DESIGN.height),
              width: pct(BOX * CENTRE.scale, DESIGN.width),
              height: pct(BOX * CENTRE.scale, DESIGN.width),
            }}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.25 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="h-full w-full"
              initial={reduced ? { scale: 1 } : { scale: 0.62, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={timing(0.55)}
            >
              {flowerNode(CENTRE)}
            </motion.div>
          </motion.div>

          {/* everything else blooms outward */}
          {STEMS.map((stem) => (
            <motion.div
              key={stem.id}
              className="absolute z-10"
              style={{
                left: pct(stem.x - (BOX * stem.scale) / 2, DESIGN.width),
                top: pct(stem.y - (BOX * stem.scale) / 2, DESIGN.height),
                width: pct(BOX * stem.scale, DESIGN.width),
                height: pct(BOX * stem.scale, DESIGN.width),
                transformOrigin: "50% 62%",
              }}
              initial={
                reduced
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.45, rotate: stem.rotate * 1.6, y: 10 }
              }
              animate={{ opacity: 1, scale: 1, rotate: stem.rotate, y: 0 }}
              transition={timing(stem.delay)}
            >
              {flowerNode(stem)}
            </motion.div>
          ))}
        </div>

        <BlossomRule className="mt-9" />

        <motion.h2
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={timing(1.3)}
          className="mt-6 text-center font-display text-[1.85rem] leading-tight tracking-tight text-burgundy sm:text-[2.5rem]"
        >
          {BOUQUET.heading}
        </motion.h2>

        <div className="mx-auto mt-5 max-w-xl space-y-4 text-center">
          {BOUQUET.paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={timing(1.45 + index * 0.2)}
              className={
                index === 0
                  ? "font-serif text-[1.04rem] italic leading-relaxed text-burgundy/85 sm:text-[1.14rem]"
                  : "text-[0.94rem] leading-relaxed text-muted sm:text-base"
              }
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={timing(1.75)}
          className="mt-9 flex justify-center"
        >
          <button type="button" onClick={onContinue} className="btn-primary">
            {BOUQUET.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
