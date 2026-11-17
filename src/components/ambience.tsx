"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Petal = {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
  drift: number;
  opacity: number;
  rotate: number;
  tone: string;
};

const TONES = [
  "linear-gradient(150deg, #f7dde3 0%, #d99baa 100%)",
  "linear-gradient(150deg, #fbe8ec 0%, #e6b7c2 100%)",
  "linear-gradient(150deg, #f3cfd7 0%, #c2808f 100%)",
  "linear-gradient(150deg, #fdf0e6 0%, #e3c9a0 100%)",
];

function buildPetals(count: number): Petal[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    duration: 16 + Math.random() * 16,
    delay: Math.random() * 18,
    size: 8 + Math.random() * 10,
    drift: (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 50),
    opacity: 0.28 + Math.random() * 0.34,
    rotate: Math.random() * 360,
    tone: TONES[index % TONES.length],
  }));
}

/**
 * Very light falling rose petals. Only transform/opacity animate, the count is
 * small, and everything stops completely for reduced-motion visitors.
 */
export function FloatingPetals({ count = 12 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (reduced) {
      setPetals([]);
      return;
    }
    // Client-only so server and client markup match.
    setPetals(buildPetals(count));
  }, [count, reduced]);

  if (reduced || petals.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="absolute top-0 block"
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 1.25,
            background: petal.tone,
            borderRadius: "60% 60% 55% 55% / 75% 75% 40% 40%",
            transform: `rotate(${petal.rotate}deg)`,
            animation: `petal-fall ${petal.duration}s linear ${petal.delay}s infinite`,
            ["--petal-drift" as string]: `${petal.drift}px`,
            ["--petal-opacity" as string]: petal.opacity,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

/** Soft radial light pools that give the ivory background depth. */
export function AmbientLight({ variant = "warm" }: { variant?: "warm" | "rose" | "dawn" }) {
  const palettes: Record<string, [string, string, string]> = {
    warm: ["rgba(247, 221, 227, 0.55)", "rgba(216, 183, 122, 0.24)", "rgba(255, 253, 249, 0.9)"],
    rose: ["rgba(217, 155, 170, 0.4)", "rgba(247, 221, 227, 0.55)", "rgba(255, 248, 240, 0.95)"],
    dawn: ["rgba(216, 183, 122, 0.28)", "rgba(247, 221, 227, 0.5)", "rgba(255, 253, 249, 0.92)"],
  };
  const [a, b, c] = palettes[variant] ?? palettes.warm;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 80% at 50% -10%, ${c} 0%, var(--color-ivory) 45%, #fdf0e9 100%)` }}
      />
      <div
        className="absolute -left-24 top-[-10%] h-[52vh] w-[52vh] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${a} 0%, transparent 68%)`, animation: "soft-glow 14s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-20 bottom-[-12%] h-[46vh] w-[46vh] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${b} 0%, transparent 70%)`, animation: "soft-glow 18s ease-in-out infinite reverse" }}
      />
      <div className="grain-veil absolute inset-0 opacity-60" />
    </div>
  );
}
