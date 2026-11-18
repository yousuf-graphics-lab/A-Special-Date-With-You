"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AmbientLight, FloatingPetals } from "@/components/ambience";
import { MusicToggle } from "@/components/music";
import { LockScreen } from "@/components/screens/lock-screen";
import { LetterScreen } from "@/components/screens/letter-screen";
import { ProposalScreen } from "@/components/screens/proposal-screen";
import { PlannerScreen, type PlanFormState } from "@/components/screens/planner-screen";
import { BouquetScreen } from "@/components/screens/bouquet-screen";
import { FinaleScreen } from "@/components/screens/finale-screen";
import type { PlanView } from "@/lib/plan";

export type Stage = "lock" | "letter" | "proposal" | "planner" | "bouquet" | "finale";

const ORDER: Stage[] = ["lock", "letter", "proposal", "planner", "bouquet", "finale"];

const STAGE_LABELS: Record<Stage, string> = {
  lock: "The birthday lock",
  letter: "The letter",
  proposal: "The proposal",
  planner: "Our date plan",
  bouquet: "Your bouquet",
  finale: "The last page",
};

export const emptyPlan: PlanFormState = {
  date: "",
  timeMode: "slot",
  timeSlot: "",
  customTime: "",
  placeId: "",
  placeCustom: "",
  activities: [],
  activityCustom: "",
  message: "",
};

export function planToForm(plan: PlanView | null): PlanFormState {
  if (!plan) return emptyPlan;
  return {
    date: plan.date,
    timeMode: plan.timeIsCustom ? "custom" : "slot",
    timeSlot: plan.timeIsCustom ? "" : plan.time,
    customTime: plan.timeIsCustom ? plan.time : "",
    placeId: plan.placeId,
    placeCustom: plan.placeCustom ?? "",
    activities: plan.activities.map((activity) => activity.id),
    activityCustom: plan.activityCustom ?? "",
    message: plan.message ?? "",
  };
}

export default function Experience({
  initialUnlocked,
  initialPlan,
}: {
  initialUnlocked: boolean;
  initialPlan: PlanView | null;
}) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(initialUnlocked ? "letter" : "lock");
  const [furthest, setFurthest] = useState<number>(initialUnlocked ? 1 : 0);
  const [plan, setPlan] = useState<PlanView | null>(initialPlan);
  const [form, setForm] = useState<PlanFormState>(() => planToForm(initialPlan));
  const headingRef = useRef<HTMLDivElement | null>(null);

  // Registers the visit once per browser session and quietly resumes where she
  // stopped last time (after the initial paint, so the entrance still feels
  // like opening the envelope).
  useEffect(() => {
    const key = "fsd:session-sent";
    const first = !sessionStorage.getItem(key);
    sessionStorage.setItem(key, "1");

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/session", { method: "POST" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          stage?: Stage;
          plan?: PlanView | null;
        };
        if (cancelled || !data.stage) return;
        // A saved plan is the source of truth, and it also refills the form so
        // the finale card survives a refresh even when the database read has
        // since failed. Resuming at the finale with neither plan nor form is
        // what left the card empty.
        if (data.plan) {
          setPlan(data.plan);
          setForm(planToForm(data.plan));
        }
        // Always allow the resume itself; only the stage jump is first-visit
        // only, so returning to a half-finished story does not replay the
        // entrance animation from the lock screen.
        if (!first && data.stage !== "lock") {
          const position = ORDER.indexOf(data.stage);
          setFurthest((current) => Math.max(current, position));
          return;
        }
        const target = data.stage;
        const position = ORDER.indexOf(target);
        setFurthest((current) => Math.max(current, position));
        if (target !== "lock") {
          window.setTimeout(() => setStage(target), reduced ? 0 : 600);
        }
      } catch {
        /* stay on the current screen if the network blips */
      }
    })();

    return () => {
      cancelled = true;
    };
    // Mount only: the visit is counted once per browser session.
  }, [reduced]);

  const go = useCallback((next: Stage) => {
    setStage(next);
    setFurthest((current) => Math.max(current, ORDER.indexOf(next)));
  }, []);

  const notifyProgress = useCallback(
    (event: "letter_opened" | "accepted" | "thinking" | "bouquet_opened" | "final_opened") => {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      }).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    if (stage === "letter") notifyProgress("letter_opened");
    if (stage === "bouquet") notifyProgress("bouquet_opened");
    if (stage === "finale") notifyProgress("final_opened");
    // Only when the stage itself changes.
  }, [stage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    const node = headingRef.current?.querySelector<HTMLElement>("h1, h2");
    node?.setAttribute("tabindex", "-1");
    node?.focus({ preventScroll: true });
  }, [stage, reduced]);

  const unlocked = furthest >= 1;

  // Only the horizontal axis is clipped. `overflow-hidden` here also made the
  // element a scroll container, which broke any IntersectionObserver-based
  // animation further down the tree — the finale's `whileInView` never fired
  // and its text stayed invisible. Vertical overflow must stay visible so the
  // window remains the scrolling box.
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <AmbientLight variant={stage === "bouquet" || stage === "finale" ? "dawn" : "warm"} />
      <FloatingPetals count={stage === "lock" ? 9 : 14} />

      <main id="main" className="relative z-10 pb-24">
        <div ref={headingRef}>
          {/*
           * Deliberately NOT using <AnimatePresence mode="wait"> here.
           *
           * That mode holds the incoming screen back until the outgoing one has
           * finished animating. The exit animation ran through `filter: blur`,
           * which is expensive on phones, and if it stalled the old screen had
           * already faded out while the new one was never mounted at all: a
           * blank page, and the next screen "never arriving". Keying the wrapper
           * lets React swap immediately, and every screen already animates its
           * own contents, so nothing is lost but the fragile dependency.
           */}
          <motion.div
            key={stage}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
              {stage === "lock" && (
                <LockScreen
                  alreadyUnlocked={initialUnlocked}
                  onUnlocked={() => {
                    go("letter");
                  }}
                />
              )}

              {stage === "letter" && (
                <LetterScreen onContinue={() => go("proposal")} />
              )}

              {stage === "proposal" && (
                <ProposalScreen
                  onAccept={() => {
                    go("planner");
                    notifyProgress("accepted");
                  }}
                  onThink={() => notifyProgress("thinking")}
                />
              )}

              {stage === "planner" && (
                <PlannerScreen
                  value={form}
                  onChange={setForm}
                  onSaved={(saved) => {
                    setPlan(saved);
                    go("bouquet");
                  }}
                  onBack={() => go("proposal")}
                />
              )}

              {stage === "bouquet" && (
                <BouquetScreen onContinue={() => go("finale")} />
              )}

              {stage === "finale" && (
                <FinaleScreen
                  plan={plan ?? initialPlan}
                  form={form}
                  onReplay={() => go("letter")}
                  onEdit={() => go("planner")}
                />
              )}
          </motion.div>
        </div>
      </main>

      {unlocked && (
        <nav
          aria-label="Story progress"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.9rem,env(safe-area-inset-bottom))]"
        >
          <ol className="pointer-events-auto flex items-center gap-2 rounded-full border border-gold/25 bg-cream/70 px-3.5 py-2 shadow-[0_10px_30px_-24px_rgba(88,34,47,0.6)] backdrop-blur-sm">
            {ORDER.slice(1).map((item, index) => {
              const position = index + 1;
              const reachable = position <= furthest;
              const active = item === stage;
              return (
                <li key={item}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => reachable && go(item)}
                    aria-current={active ? "step" : undefined}
                    aria-label={STAGE_LABELS[item]}
                    title={STAGE_LABELS[item]}
                    className="group flex h-6 w-6 items-center justify-center disabled:cursor-default"
                  >
                    <span
                      className={[
                        "block rounded-full transition-all duration-500",
                        active
                          ? "h-2 w-6 bg-burgundy"
                          : reachable
                            ? "h-1.5 w-1.5 bg-rose group-hover:bg-burgundy"
                            : "h-1.5 w-1.5 bg-rose/30",
                      ].join(" ")}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="pointer-events-none fixed bottom-5 left-5 z-40 hidden sm:block">
        <p className="font-script text-xl text-burgundy/55">Samee &amp; Yousuf</p>
      </div>

      <MusicToggle />
    </div>
  );
}
