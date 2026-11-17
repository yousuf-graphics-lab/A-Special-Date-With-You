import { MailOpen } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gold/45 bg-cream/60 px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-cream text-burgundy/70">
        <MailOpen className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg text-burgundy">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
