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

export default async function HomePage() {
  let unlocked = false;
  let plan = null;
  const storageReady = databaseConfigured();

  try {
    const visitor = await readVisitor();
    if (visitor) {
      unlocked = Boolean(visitor.unlocked_at);
      if (unlocked) plan = await currentPlanForVisitor(visitor.id);
    }
  } catch (error) {
    // A database hiccup must never stop her from opening the letter.
    console.error("[home] could not load progress", error);
  }

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
