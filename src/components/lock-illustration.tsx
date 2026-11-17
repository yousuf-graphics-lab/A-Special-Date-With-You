"use client";

import { motion, useReducedMotion } from "framer-motion";

export type LockState = "idle" | "checking" | "error" | "unlocked";

/**
 * An antique brass-and-burgundy padlock. The shackle lifts and the body glows
 * once the date is right.
 */
export function LockIllustration({ state }: { state: LockState }) {
  const reduced = useReducedMotion();
  const unlocked = state === "unlocked";
  const checking = state === "checking";

  return (
    <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
      {/* halo */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(216,183,122,0.55) 0%, rgba(247,221,227,0.35) 45%, transparent 72%)",
        }}
        animate={
          reduced
            ? { opacity: 0.5 }
            : unlocked
              ? { opacity: 0.9, scale: 1.15 }
              : { opacity: [0.4, 0.65, 0.4], scale: [1, 1.04, 1] }
        }
        transition={reduced ? { duration: 0 } : { duration: unlocked ? 0.8 : 5, repeat: unlocked ? 0 : Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 160 180" className="relative h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="lock-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8f4055" />
            <stop offset="45%" stopColor="#722f43" />
            <stop offset="100%" stopColor="#4e1d2b" />
          </linearGradient>
          <linearGradient id="lock-shackle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0dcb2" />
            <stop offset="40%" stopColor="#d8b77a" />
            <stop offset="100%" stopColor="#ab8a52" />
          </linearGradient>
          <linearGradient id="lock-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="lock-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#58222f" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* shackle */}
        <motion.g
          style={{ originX: "118px", originY: "86px" }}
          animate={{ rotate: unlocked ? 24 : 0, y: unlocked ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 16, delay: unlocked ? 0.15 : 0 }}
        >
          <path
            d="M50 92V66C50 45 63 32 80 32C97 32 110 45 110 66V92"
            fill="none"
            stroke="url(#lock-shackle)"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M54 88V66C54 48 65 37 80 37"
            fill="none"
            stroke="#fff6e2"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>

        {/* body */}
        <motion.g
          filter="url(#lock-soft)"
          animate={reduced ? {} : { y: unlocked ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
        >
          <rect x="28" y="86" width="104" height="76" rx="22" fill="url(#lock-body)" />
          <rect x="28" y="86" width="104" height="76" rx="22" fill="url(#lock-sheen)" />
          <rect
            x="34"
            y="92"
            width="92"
            height="64"
            rx="17"
            fill="none"
            stroke="#d8b77a"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />

          {/* keyhole */}
          <circle cx="80" cy="118" r="8.5" fill="#2b1119" />
          <path d="M76.5 124L74.5 140H85.5L83.5 124Z" fill="#2b1119" />
          <circle cx="80" cy="118" r="8.5" fill="none" stroke="#e6cb98" strokeOpacity="0.5" strokeWidth="1" />

          {/* little ornament */}
          <path
            d="M62 148C68 151 74 152 80 152C86 152 92 151 98 148"
            fill="none"
            stroke="#d8b77a"
            strokeOpacity="0.45"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {checking && (
            <motion.circle
              cx="80"
              cy="118"
              r="20"
              fill="none"
              stroke="#ead7ae"
              strokeWidth="1.5"
              strokeOpacity="0.7"
              animate={{ r: [16, 26], opacity: [0.7, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.g>
      </svg>

      {unlocked && !reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          initial={{ opacity: 0.7, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ boxShadow: "0 0 0 2px rgba(216,183,122,0.55)" }}
        />
      )}
    </div>
  );
}
