import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { currentAdmin } from "@/lib/admin-auth";
import { currentResponse, getResponse } from "@/lib/admin-data";
import {
  PLACE_OPTIONS,
  STATUS_LABELS,
  activityLabel,
  formatDhakaDate,
  formatDhakaTimestamp,
  placeLabel,
  type ResponseStatus,
} from "@/lib/date-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const safeName = (value: string) => value.replace(/[^a-z0-9._-]/gi, "-");

export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "pdf";
  const id = url.searchParams.get("id");
  const response = id ? await getResponse(id) : await currentResponse();

  if (!response) {
    return NextResponse.json({ error: "No response to export yet." }, { status: 404 });
  }

  const activities = response.activities.map((activity) => activity.label);
  if (response.activityCustom) activities.push(`Something else: ${response.activityCustom}`);
  const place = response.placeCustom
    ? `${response.placeLabel} — ${response.placeCustom}`
    : response.placeLabel;

  if (format === "csv") {
    const header = [
      "Version",
      "Date (Dhaka)",
      "Time (Dhaka)",
      "Place",
      "Activities",
      "Her message",
      "Status",
      "Submitted at (Dhaka)",
      "Updated at (Dhaka)",
      "Private notes",
    ];
    const row = [
      response.version,
      formatDhakaDate(response.date),
      response.time,
      place,
      activities.join("; "),
      response.message ?? "",
      STATUS_LABELS[response.status as ResponseStatus] ?? response.status,
      formatDhakaTimestamp(response.submittedAt),
      formatDhakaTimestamp(response.updatedAt),
      response.adminNotes ?? "",
    ];
    const csv = `${header.map(csvCell).join(",")}\r\n${row.map(csvCell).join(",")}\r\n`;
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName(`samiya-date-plan-v${response.version}`)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const burgundy = rgb(0.447, 0.184, 0.263);
  const ink = rgb(0.16, 0.13, 0.13);
  const muted = rgb(0.45, 0.4, 0.4);

  const margin = 56;
  let y = 780;

  page.drawText("Our Little Date", { x: margin, y, size: 26, font: serifBold, color: burgundy });
  y -= 22;
  page.drawText("A plan from Samiya, kept private for Yousuf", { x: margin, y, size: 10, font: sans, color: muted });
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: 595.28 - margin, y }, thickness: 0.8, color: rgb(0.85, 0.78, 0.66) });
  y -= 30;

  const rows: [string, string][] = [
    ["Preferred date", formatDhakaDate(response.date)],
    ["Preferred time", `${response.time}${response.timeIsCustom ? " (her own time)" : ""}`],
    ["Place", place],
    ["Activities", activities.join(", ") || "—"],
    ["Planning status", STATUS_LABELS[response.status as ResponseStatus] ?? response.status],
    ["Response version", `v${response.version}`],
    ["Submitted", formatDhakaTimestamp(response.submittedAt)],
    ["Last updated", formatDhakaTimestamp(response.updatedAt)],
    ["Accepted the proposal", response.acceptedAt ? formatDhakaTimestamp(response.acceptedAt) : "—"],
    ["All times shown in", "Asia/Dhaka (Bangladesh time)"],
  ];

  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x: margin, y, size: 7.5, font: sans, color: muted });
    y -= 13;

    const maxWidth = 595.28 - margin * 2;
    const words = String(value).split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (serif.widthOfTextAtSize(candidate, 12) > maxWidth && line) {
        page.drawText(line, { x: margin, y, size: 12, font: serif, color: ink });
        y -= 16;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size: 12, font: serif, color: ink });
      y -= 16;
    }
    y -= 10;
  }

  const noteBlocks: [string, string][] = [
    ["Her message", response.message || "She did not write anything this time."],
    ["Your private notes", response.adminNotes || "No notes yet."],
  ];

  for (const [label, text] of noteBlocks) {
    if (y < 120) break;
    page.drawText(label.toUpperCase(), { x: margin, y, size: 7.5, font: sans, color: muted });
    y -= 14;
    const maxWidth = 595.28 - margin * 2;
    const words = String(text).split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (serif.widthOfTextAtSize(candidate, 11) > maxWidth && line) {
        page.drawText(line, { x: margin, y, size: 11, font: serif, color: ink });
        y -= 15;
        line = word;
        if (y < 90) break;
      } else {
        line = candidate;
      }
    }
    if (line && y >= 90) {
      page.drawText(line, { x: margin, y, size: 11, font: serif, color: ink });
      y -= 15;
    }
    y -= 14;
  }

  page.drawText("For Samee, from Yousuf", {
    x: margin,
    y: 60,
    size: 9,
    font: sans,
    color: muted,
  });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName(`samiya-date-plan-v${response.version}`)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
