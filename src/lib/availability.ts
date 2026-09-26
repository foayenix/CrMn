import { prisma } from "@/lib/prisma";
import { dateKey, dayDateLabel, dayLabel } from "@/lib/dates";

// Staff-entered "can't work" days.
//
// Information for the boss while he builds the rota, never a write to Shift:
// the rota stays his to set, and this shows beside it. Two shapes — a day or
// an inclusive range of days, or the same weekday every week.

export type UnavailabilityRow = {
  id: string;
  staffMemberId: string;
  kind: "DATES" | "WEEKLY";
  startDate: Date | null;
  endDate: Date | null;
  weekday: number | null;
  note: string | null;
};

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// 0 = Monday … 6 = Sunday, the rota's own week order.
export function weekdayIndex(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

export function appliesOn(u: UnavailabilityRow, day: Date): boolean {
  if (u.kind === "WEEKLY") return u.weekday === weekdayIndex(day);
  if (!u.startDate || !u.endDate) return false;
  return day >= u.startDate && day <= u.endDate;
}

// "Every Monday", "Sat 11 Oct", "Sat 11 Oct – Sun 19 Oct".
export function describeUnavailability(u: UnavailabilityRow): string {
  if (u.kind === "WEEKLY") return `Every ${u.weekday != null ? WEEKDAYS[u.weekday] : "week"}`;
  if (!u.startDate || !u.endDate) return "";
  const s = `${dayLabel(u.startDate)} ${dayDateLabel(u.startDate)}`;
  if (dateKey(u.startDate) === dateKey(u.endDate)) return s;
  return `${s} – ${dayLabel(u.endDate)} ${dayDateLabel(u.endDate)}`;
}

// Everything that touches [from, to]: every weekly row, and date rows that
// overlap the window.
export async function unavailabilityBetween(
  from: Date,
  to: Date,
  staffMemberId?: string,
): Promise<UnavailabilityRow[]> {
  return prisma.unavailability.findMany({
    where: {
      ...(staffMemberId ? { staffMemberId } : {}),
      OR: [{ kind: "WEEKLY" }, { kind: "DATES", startDate: { lte: to }, endDate: { gte: from } }],
    },
    orderBy: [{ kind: "asc" }, { startDate: "asc" }, { weekday: "asc" }],
  });
}

// "staffId|YYYY-MM-DD" → the reasons that apply that day ("" when no note).
export function unavailabilityByCell(
  rows: UnavailabilityRow[],
  days: Date[],
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const day of days) {
    for (const u of rows) {
      if (!appliesOn(u, day)) continue;
      const k = `${u.staffMemberId}|${dateKey(day)}`;
      out.set(k, [...(out.get(k) ?? []), u.note ?? ""]);
    }
  }
  return out;
}
