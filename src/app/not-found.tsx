import Link from "next/link";
import { AmbientLight } from "@/components/ambience";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <AmbientLight variant="rose" />
      <p className="eyebrow mb-4">Wrong little path</p>
      <h1 className="font-display text-3xl text-burgundy sm:text-4xl">
        This page is not part of our story
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Let&apos;s take you back to the beginning, my love.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to the start
      </Link>
    </main>
  );
}
