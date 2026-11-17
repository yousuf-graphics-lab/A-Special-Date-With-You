"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileText, Loader2, NotebookPen, Save } from "lucide-react";
import { RESPONSE_STATUSES, STATUS_LABELS, type ResponseStatus } from "@/lib/date-options";

export function ResponseEditor({
  responseId,
  status,
  adminNotes,
  version,
}: {
  responseId: string;
  status: string;
  adminNotes: string | null;
  version: number;
}) {
  const router = useRouter();
  const [draftStatus, setDraftStatus] = useState<ResponseStatus>((status as ResponseStatus) ?? "new");
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = draftStatus !== status || notes !== (adminNotes ?? "");

  async function save(extra?: { markReviewed?: boolean }) {
    setSaving(true);
    setError(null);
    setSavedAt(null);

    try {
      const response = await fetch(`/api/admin/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: extra?.markReviewed ? "reviewed" : draftStatus,
          adminNotes: notes,
          markReviewed: extra?.markReviewed,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not save those changes.");
        return;
      }
      if (extra?.markReviewed) setDraftStatus("reviewed");
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      router.refresh();
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg text-burgundy">
          <NotebookPen className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
          Decision &amp; notes
        </h3>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
          Only you can see this. Samiya never sees her status or these notes.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-[0.62rem] uppercase tracking-[0.24em] text-muted/85">
          Planning status
        </legend>
        <div className="flex flex-wrap gap-2">
          {RESPONSE_STATUSES.map((option) => {
            const active = draftStatus === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setDraftStatus(option)}
                className={[
                  "rounded-full border px-3 py-1.5 text-[0.72rem] transition",
                  active
                    ? "border-transparent bg-burgundy text-ivory"
                    : "border-burgundy/18 bg-cream text-ink/70 hover:border-burgundy/35 hover:bg-blush/40",
                ].join(" ")}
              >
                {STATUS_LABELS[option]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor={`notes-${responseId}`}
          className="mb-1.5 block text-[0.62rem] uppercase tracking-[0.24em] text-muted/85"
        >
          Private notes
        </label>
        <textarea
          id={`notes-${responseId}`}
          rows={4}
          maxLength={4000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Where you want to take her, what to book, little reminders…"
          className="field resize-y text-[0.9rem] leading-relaxed"
        />
        <p className="mt-1 text-right text-[0.65rem] text-muted/65">{notes.length}/4000</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-[#a33a4a]/30 bg-[#fbe9ec] px-3 py-2 text-[0.8rem] text-[#8f3040]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving || !dirty}
          className="btn-primary px-4 py-2.5 text-[0.68rem]"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
          )}
          Save changes
        </button>
        <button
          type="button"
          onClick={() => save({ markReviewed: true })}
          disabled={saving || status === "reviewed"}
          className="btn-ghost px-4 py-2.5 text-[0.68rem]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          Mark reviewed
        </button>
      </div>

      {savedAt && (
        <p role="status" className="text-[0.75rem] text-sage">
          Saved at {savedAt}.
        </p>
      )}

      <div className="border-t border-gold/25 pt-4">
        <p className="mb-2 text-[0.62rem] uppercase tracking-[0.24em] text-muted/85">Export</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/export?format=pdf&id=${responseId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/20 px-3.5 py-2 text-[0.7rem] text-burgundy transition hover:bg-blush/40"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            PDF (v{version})
          </a>
          <a
            href={`/api/admin/export?format=csv&id=${responseId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/20 px-3.5 py-2 text-[0.7rem] text-burgundy transition hover:bg-blush/40"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            CSV
          </a>
        </div>
      </div>
    </div>
  );
}
