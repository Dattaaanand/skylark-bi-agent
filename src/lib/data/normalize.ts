/**
 * Data resilience layer.
 *
 * monday.com gives us raw column_values where every value is either a
 * plain "text" rendering or a JSON-encoded "value" blob depending on
 * column type (status, date, numbers, text...). Real-world imported data
 * is also just messy: blanks, stray whitespace, inconsistent casing,
 * dates in different formats.
 *
 * This module's job: turn a MondayBoard into a NormalizedBoardData —
 * plain objects keyed by human column titles, cleaned values, and an
 * explicit list of data-quality issues so the agent can *say* "12 of 40
 * deals are missing a Close Date" instead of silently guessing.
 */

import type {
  DataQualityNote,
  MondayBoard,
  MondayItem,
  NormalizedBoardData,
  NormalizedRecord,
} from "@/types";

const NULLISH_TEXT = new Set(["", "-", "--", "n/a", "na", "null", "none", "tbd"]);

/** Collapse whitespace, strip zero-width junk, trim. */
function cleanText(raw: string | null): string | null {
  if (raw == null) return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (NULLISH_TEXT.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

/** Best-effort parse of a variety of date text formats into ISO (YYYY-MM-DD). */
function normalizeDate(raw: string | null): string | null {
  const text = cleanText(raw);
  if (!text) return null;

  // monday.com "date" columns usually already emit YYYY-MM-DD in `text`.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  // Common alternates: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, "Jan 5 2026"
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
    const [, a, b, year] = slashMatch;
    // Ambiguous DD/MM vs MM/DD — assume DD/MM/YYYY (non-US convention),
    // documented as an assumption in the Decision Log.
    const day = a.padStart(2, "0");
    const month = b.padStart(2, "0");
    if (Number(month) <= 12) return `${year}-${month}-${day}`;
    // fall through if "month" > 12, meaning it was actually MM/DD
    return `${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null; // unparseable — treated as missing, not thrown away silently
}

/** Try to coerce a numeric-looking text value (handles "1,234", "₹1,234", "12%"). */
function normalizeNumber(raw: string | null): number | null {
  const text = cleanText(raw);
  if (!text) return null;
  const stripped = text.replace(/[^0-9.\-]/g, "");
  if (!stripped) return null;
  const n = Number(stripped);
  return Number.isNaN(n) ? null : n;
}

/** Column types where we should attempt numeric coercion. */
const NUMERIC_TYPES = new Set(["numbers"]);
const DATE_TYPES = new Set(["date"]);

export function normalizeBoard(board: MondayBoard): NormalizedBoardData {
  const columnMeta = new Map(board.columns.map((c) => [c.id, c]));
  const records: NormalizedRecord[] = [];

  // field -> count of missing/null values, accumulated as we go
  const missingCounts = new Map<string, number>();
  const unparseableDates = new Map<string, number>();
  const totalByField = new Map<string, number>();

  for (const item of board.items_page.items as MondayItem[]) {
    const record: NormalizedRecord = {
      id: item.id,
      name: cleanText(item.name) ?? item.name,
      group: item.group?.title ?? null,
    };

    for (const cv of item.column_values) {
      const meta = columnMeta.get(cv.id);
      const title = meta?.title ?? cv.id;
      const type = meta?.type ?? cv.type ?? "text";

      totalByField.set(title, (totalByField.get(title) ?? 0) + 1);

      let value: string | number | null;
      if (DATE_TYPES.has(type)) {
        value = normalizeDate(cv.text);
        if (cv.text && cleanText(cv.text) && value === null) {
          unparseableDates.set(title, (unparseableDates.get(title) ?? 0) + 1);
        }
      } else if (NUMERIC_TYPES.has(type)) {
        value = normalizeNumber(cv.text);
      } else {
        value = cleanText(cv.text);
      }

      if (value === null) {
        missingCounts.set(title, (missingCounts.get(title) ?? 0) + 1);
      }

      record[title] = value;
    }

    records.push(record);
  }

  const dataQuality: DataQualityNote[] = [];
  for (const [field, count] of missingCounts) {
    if (count > 0) {
      dataQuality.push({ field, issue: "missing/blank value", affectedCount: count });
    }
  }
  for (const [field, count] of unparseableDates) {
    if (count > 0) {
      dataQuality.push({ field, issue: "date text could not be parsed", affectedCount: count });
    }
  }

  return {
    boardName: board.name,
    records,
    dataQuality,
  };
}
