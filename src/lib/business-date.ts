import { startOfDay, addDays, dayLabel, dayDateLabel } from "@/lib/dates";

// The trading night, not the calendar day.
//
// A bar closes after midnight, so 00:12 on Saturday belongs to Friday's night.
// Everything in the staff app that says "tonight" — tonight's tables, tonight's
// checklist run, tonight's flagged stock — has to agree about which night that
// is, or the same shift splits across two rows at midnight.
//
// One helper, used everywhere. The night for date D runs from D 05:00 UTC to
// D+1 05:00 UTC: late enough that the last person out is still on the right
// night, early enough that a lunchtime booking isn't on the previous one.

export const ROLLOVER_HOUR = 5;

// UTC midnight of the trading night `instant` falls in.
export function businessDateFor(instant: Date): Date {
  const shifted = new Date(instant.getTime() - ROLLOVER_HOUR * 60 * 60 * 1000);
  return startOfDay(shifted);
}

// The half-open [from, to) window of real instants belonging to that night.
export function businessNightRange(instant: Date): { from: Date; to: Date } {
  const date = businessDateFor(instant);
  const from = new Date(date.getTime() + ROLLOVER_HOUR * 60 * 60 * 1000);
  return { from, to: addDays(from, 1) };
}

// "Fri 24 Jul" for the night in progress — what a person would call it, even at
// ten past midnight.
export function businessNightLabel(instant: Date): string {
  const d = businessDateFor(instant);
  return `${dayLabel(d)} ${dayDateLabel(d)}`;
}
