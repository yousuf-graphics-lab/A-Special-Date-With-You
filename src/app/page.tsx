import type { Metadata } from "next";
import Experience from "@/components/experience";
import { readVisitor } from "@/lib/visitor";
import { currentPlanForVisitor } from "@/lib/plan";
import { SITE } from "@/lib/content";
import { databaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
};

/**
 * Never let an unreachable database keep the page from painting.
 *
 * Everything below is an optimisation — remembering that she already unlocked,
 * and which plan she saved. If the database is slow or down, the letter should
 * still open (the client re-checks the session after mount), so the database
 * work gets a hard deadline rather than an unbounded await. Without this a
 * stalled connection produced a blank page that looked like a broken site.
 */
const PROGRESS_DEADLINE_MS = 3_500;

function withDeadline<T>(work: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), PROGRESS_DEADLINE_MS);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export default async function HomePage() {
  let unlocked = false;
  let plan = null;
  const storageReady = databaseConfigured();

  const progress = await withDeadline(
    (async () => {
      const visitor = await readVisitor();
      if (!visitor) return { unlocked: false, plan: null };
      if (!visitor.unlocked_at) return { unlocked: false, plan: null };
      return { unlocked: true, plan: await currentPlanForVisitor(visitor.id) };
    })(),
    { unlocked: false, plan: null },
  );

  unlocked = progress.unlocked;
  plan = progress.plan;

  return (
    <>
      {!storageReady && (
        <div className="border-b border-gold/40 bg-blush/40 px-5 py-3 text-center text-[0.78rem] leading-relaxed text-burgundy">
          Heads up, Yousuf: no database is connected yet, so nothing Samiya saves
          can be stored. Add DATABASE_URL in your Vercel project settings.
        </div>
      )}
      <Experience initialUnlocked={unlocked} initialPlan={plan} />
    </>
  );
}
