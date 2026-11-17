"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Pause } from "lucide-react";

/**
 * A gentle romantic loop, composed in the browser with the Web Audio API.
 *
 * Nothing is fetched and nothing autoplays: the AudioContext is created on the
 * visitor's first tap. Sound is an enhancement only — the whole experience
 * works with it switched off, and the choice is remembered.
 */
type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  timer: number;
  nextTime: number;
  step: number;
};

const PROGRESSION: number[][] = [
  [220.0, 277.18, 329.63, 440.0], // A major
  [164.81, 207.65, 246.94, 329.63], // E major
  [146.83, 185.0, 220.0, 293.66], // D major
  [196.0, 246.94, 293.66, 392.0], // G major
];

const STEP_SECONDS = 0.46;

export function MusicToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const nodes = useRef<Nodes | null>(null);

  const stop = useCallback(() => {
    const current = nodes.current;
    if (!current) return;
    window.clearInterval(current.timer);
    current.master.gain.cancelScheduledValues(current.ctx.currentTime);
    current.master.gain.setTargetAtTime(0, current.ctx.currentTime, 0.4);
    const ctx = current.ctx;
    window.setTimeout(() => void ctx.close().catch(() => {}), 900);
    nodes.current = null;
  }, []);

  const start = useCallback(() => {
    if (nodes.current) return;
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.16, ctx.currentTime, 1.2);
    master.connect(ctx.destination);

    const nodesRef: Nodes = { ctx, master, timer: 0, nextTime: ctx.currentTime + 0.15, step: 0 };

    const playTone = (frequency: number, time: number, duration: number, peak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2200;
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peak, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(filter).connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    const schedule = () => {
      const now = ctx.currentTime;
      while (nodesRef.nextTime < now + 0.6) {
        const chord = PROGRESSION[Math.floor(nodesRef.step / 8) % PROGRESSION.length];
        const position = nodesRef.step % 8;
        const time = nodesRef.nextTime;

        // arpeggio, a soft bell-like pattern
        const note = chord[position % chord.length];
        playTone(note, time, 2.4, 0.16);
        if (position === 0) playTone(note / 2, time, 4.5, 0.1);
        if (position === 4) playTone(chord[2] / 2, time, 3.2, 0.07);

        nodesRef.nextTime += STEP_SECONDS;
        nodesRef.step += 1;
      }
    };

    schedule();
    nodesRef.timer = window.setInterval(schedule, 240);
    nodes.current = nodesRef;
  }, []);

  useEffect(() => {
    setReady(true);
    const stored = window.localStorage.getItem("fsd:music");
    if (stored === "on") {
      // Browsers require a gesture; resume as soon as the visitor touches anything.
      const resume = () => {
        start();
        setEnabled(true);
        window.removeEventListener("pointerdown", resume);
      };
      window.addEventListener("pointerdown", resume, { once: true });
      return () => window.removeEventListener("pointerdown", resume);
    }
    return undefined;
  }, [start]);

  useEffect(() => () => stop(), [stop]);

  const toggle = () => {
    if (enabled) {
      stop();
      setEnabled(false);
      window.localStorage.setItem("fsd:music", "off");
    } else {
      start();
      setEnabled(true);
      window.localStorage.setItem("fsd:music", "on");
    }
  };

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn background music off" : "Turn background music on"}
      title={enabled ? "Music is on" : "Add a little music"}
      className={`group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream/85 px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.22em] text-burgundy shadow-[0_10px_30px_-18px_rgba(88,34,47,0.6)] backdrop-blur transition hover:border-burgundy/40 hover:bg-blush/60 ${className}`}
    >
      {enabled ? (
        <Pause className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <Music2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{enabled ? "Music on" : "Music"}</span>
    </button>
  );
}

/**
 * A short, soft chime for the moment the lock opens. Silently does nothing
 * unless Samiya has already turned the music on, so it never plays uninvited.
 */
export function playUnlockChime() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("fsd:music") !== "on") return;

  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;

  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.06);
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.9);
  master.connect(ctx.destination);

  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const start = ctx.currentTime + index * 0.11;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.5, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + 1.3);
  });

  window.setTimeout(() => void ctx.close().catch(() => {}), 2400);
}
