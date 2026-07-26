import { prisma } from "@/lib/prisma";
import { businessDateFor } from "@/lib/business-date";
import { dateKey, endsNextDay } from "@/lib/dates";

// Clocking in is optional, and the app says so out loud. This module exists to
// make sure forgetting to clock *out* costs nobody anything.
//
// Screen 7.2 promises: "Forgot to clock out last time? It closed itself at your
// rota end. No one was told." That promise is kept here.

// How long past a rostered end we wait before closing an entry ourselves. The
// recorded time is still the rota end — this window only stops us snatching a
// shift from someone who is genuinely running twenty minutes over and about to
// clock out by hand.
const GRACE_HOURS = 2;

// No rostered shift to close against: we cap rather than guess, and leave a
// note so the boss can see it was us and not a twenty-hour day.
const NO_SHIFT_CAP_HOURS = 12;

const HOUR = 60 * 60 * 1000;

export type ClockState = {
  openEntry: { id: string; clockInAt: Date } | null;
  // Their rostered shift on tonight's trading date, if there is one.
  shiftStart: Date | null;
  shiftEnd: Date | null;
  // Whether the previous entry was closed by reconciliation — the one moment
  // the reassurance copy is worth showing.
  lastWasAutoClosed: boolean;
  // "clocked 3 of 4 shifts" for last week's quiet footer.
  lastWeek: { shifts: number; clocked: number };
};

// The instant a rostered slot ends, in real time: shifts store a date plus
// minutes-from-midnight, and anything ending at or before its start runs into
// the next day.
export function shiftEndInstant(shift: {
  date: Date;
  startMinutes: number | null;
  endMinutes: number | null;
}): Date | null {
  if (shift.startMinutes === null || shift.endMinutes === null) return null;
  const base = shift.date.getTime() + shift.endMinutes * 60 * 1000;
  return new Date(endsNextDay(shift.startMinutes, shift.endMinutes) ? base + 24 * HOUR : base);
}

export function shiftStartInstant(shift: {
  date: Date;
  startMinutes: number | null;
}): Date | null {
  if (shift.startMinutes === null) return null;
  return new Date(shift.date.getTime() + shift.startMinutes * 60 * 1000);
}

// The end of the last rostered slot on the trading night an entry belongs to.
// A split shift is closed against the late slot, never the lunchtime one.
async function rosteredEndFor(staffId: string, clockInAt: Date): Promise<Date | null> {
  const date = businessDateFor(clockInAt);
  const shifts = await prisma.shift.findMany({
    where: { staffMemberId: staffId, date, kind: "WORKING" },
  });
  const ends = shifts.map(shiftEndInstant).filter((d): d is Date => d !== null);
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends.map((d) => d.getTime())));
}

// Lazily on read — cheap, and no cron to keep alive on Coolify.
//
// Pass a staffId to reconcile one person (the clock screen), or nothing to
// sweep everyone (the admin view).
export async function reconcileOpenEntries(staffId?: string): Promise<number> {
  const now = new Date();
  const open = await prisma.timeEntry.findMany({
    where: {
      clockOutAt: null,
      ...(staffId ? { staffId } : {}),
      // Nothing opened in the last couple of hours can be overdue yet.
      clockInAt: { lt: new Date(now.getTime() - GRACE_HOURS * HOUR) },
    },
  });

  let closed = 0;
  for (const entry of open) {
    const rosteredEnd = await rosteredEndFor(entry.staffId, entry.clockInAt);

    if (rosteredEnd) {
      if (now.getTime() < rosteredEnd.getTime() + GRACE_HOURS * HOUR) continue;
      await prisma.timeEntry.update({
        where: { id: entry.id },
        data: { clockOutAt: rosteredEnd, autoClosed: true },
      });
      closed++;
      continue;
    }

    // No rostered shift: cap it rather than guess, and say so.
    const cap = new Date(entry.clockInAt.getTime() + NO_SHIFT_CAP_HOURS * HOUR);
    if (now.getTime() < cap.getTime()) continue;
    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        clockOutAt: cap,
        autoClosed: true,
        note: `No rostered shift to close against — capped at ${NO_SHIFT_CAP_HOURS} hours.`,
      },
    });
    closed++;
  }
  return closed;
}

export async function readClock(staffId: string, weekStart: Date, weekEnd: Date): Promise<ClockState> {
  await reconcileOpenEntries(staffId);

  const now = new Date();
  const tonight = businessDateFor(now);

  const [openEntry, lastClosed, todayShifts, lastWeekShifts, lastWeekEntries] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { staffId, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
      select: { id: true, clockInAt: true },
    }),
    prisma.timeEntry.findFirst({
      where: { staffId, clockOutAt: { not: null } },
      orderBy: { clockOutAt: "desc" },
      select: { autoClosed: true },
    }),
    prisma.shift.findMany({
      where: { staffMemberId: staffId, date: tonight, kind: "WORKING" },
      orderBy: { slot: "asc" },
    }),
    prisma.shift.findMany({
      where: { staffMemberId: staffId, date: { gte: weekStart, lte: weekEnd }, kind: "WORKING" },
    }),
    prisma.timeEntry.findMany({
      where: { staffId, clockInAt: { gte: weekStart, lt: new Date(weekEnd.getTime() + 24 * HOUR) } },
      select: { clockInAt: true },
    }),
  ]);

  const starts = todayShifts.map(shiftStartInstant).filter((d): d is Date => d !== null);
  const ends = todayShifts.map(shiftEndInstant).filter((d): d is Date => d !== null);

  // "3 of 4 shifts" counts distinct rostered days that saw a clock-in, not
  // entries — two clock-ins on one night is still one shift.
  const rosteredDays = new Set(lastWeekShifts.map((s) => dateKey(s.date)));
  const clockedDays = new Set(lastWeekEntries.map((e) => dateKey(businessDateFor(e.clockInAt))));

  return {
    openEntry: openEntry ?? null,
    shiftStart: starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : null,
    shiftEnd: ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : null,
    lastWasAutoClosed: lastClosed?.autoClosed ?? false,
    lastWeek: {
      shifts: rosteredDays.size,
      clocked: [...clockedDays].filter((d) => rosteredDays.has(d)).length,
    },
  };
}

export type StaffWeek = {
  id: string;
  name: string;
  rosteredHours: number;
  clockedHours: number;
  entries: {
    id: string;
    clockInAt: Date;
    clockOutAt: Date | null;
    autoClosed: boolean;
    adminEdited: boolean;
    note: string | null;
    hours: number | null;
  }[];
};

// Actual against rostered, for the admin week view. Rota hours are what get
// paid — this is only ever presented beside them, never instead of them.
export async function weekSummary(weekStart: Date, weekEnd: Date): Promise<StaffWeek[]> {
  await reconcileOpenEntries();

  const [staff, shifts, entries] = await Promise.all([
    prisma.staffMember.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.shift.findMany({
      where: { date: { gte: weekStart, lte: weekEnd }, kind: "WORKING" },
    }),
    prisma.timeEntry.findMany({
      // A shift starting Sunday 18:00 runs into Monday, so the window reaches
      // a day past the week's end.
      where: { clockInAt: { gte: weekStart, lt: new Date(weekEnd.getTime() + 24 * HOUR) } },
      orderBy: { clockInAt: "asc" },
    }),
  ]);

  return staff.map((person) => {
    const theirShifts = shifts.filter((s) => s.staffMemberId === person.id);
    const rosteredHours = theirShifts.reduce((sum, s) => {
      const start = shiftStartInstant(s);
      const end = shiftEndInstant(s);
      return start && end ? sum + (end.getTime() - start.getTime()) / HOUR : sum;
    }, 0);

    const theirEntries = entries
      .filter((e) => e.staffId === person.id)
      .map((e) => ({
        id: e.id,
        clockInAt: e.clockInAt,
        clockOutAt: e.clockOutAt,
        autoClosed: e.autoClosed,
        adminEdited: e.adminEdited,
        note: e.note,
        hours: e.clockOutAt
          ? (e.clockOutAt.getTime() - e.clockInAt.getTime()) / HOUR
          : null,
      }));

    return {
      id: person.id,
      name: person.name,
      rosteredHours,
      clockedHours: theirEntries.reduce((sum, e) => sum + (e.hours ?? 0), 0),
      entries: theirEntries,
    };
  });
}

// "4:12" — hours and minutes, the way a person reads elapsed time.
export function elapsedLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
