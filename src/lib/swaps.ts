import { prisma } from "@/lib/prisma";
import { addDays, dayDateLabel, dayLabel, minutesTo24h } from "@/lib/dates";
import { businessDateFor } from "@/lib/business-date";
import { appliesOn, unavailabilityBetween } from "@/lib/availability";

// Shift swaps.
//
// Someone offers one of their upcoming shifts; a colleague takes it, as cover
// or in exchange for one of their own; the boss approves, and only then does
// the rota change. Only WORKING shifts from tonight onwards can be offered —
// a shift that has already happened has nothing left to swap.

// How far ahead the staff app lists your shifts to offer or give back.
export const SWAP_HORIZON_DAYS = 42;

export type ShiftBrief = {
  id: string;
  staffMemberId: string;
  date: Date;
  startMinutes: number | null;
  endMinutes: number | null;
};

// "Fri 10 Oct · 19:00–23:00" — the staff app's 24h times, so a shift that ends
// after midnight still reads plainly.
export function shiftLine(s: ShiftBrief): string {
  const times =
    s.startMinutes != null && s.endMinutes != null
      ? `${minutesTo24h(s.startMinutes)}–${minutesTo24h(s.endMinutes)}`
      : "";
  return [`${dayLabel(s.date)} ${dayDateLabel(s.date)}`, times].filter(Boolean).join(" · ");
}

// Tonight's trading date: a shift dated today is still offerable at 00:30.
export function firstSwappableDate(now = new Date()): Date {
  return businessDateFor(now);
}

// A person's working shifts from tonight to the horizon.
export async function upcomingShiftsFor(staffMemberId: string, now = new Date()) {
  const from = firstSwappableDate(now);
  return prisma.shift.findMany({
    where: { staffMemberId, kind: "WORKING", date: { gte: from, lte: addDays(from, SWAP_HORIZON_DAYS) } },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });
}

// Statuses in which a swap still ties up its shift.
export const LIVE_STATUSES = ["OFFERED", "ACCEPTED"] as const;

// What the boss should know before saying yes: whether the person taking a
// shift already works that day or said they can't, and the same for the
// person getting a shift back.
export async function swapClashes(swap: {
  fromId: string;
  toId: string | null;
  shift: ShiftBrief;
  returnShift: ShiftBrief | null;
}): Promise<string[]> {
  if (!swap.toId) return [];
  // Both shifts in the swap are about to move, so neither counts as a clash:
  // on a same-day swap each person "already works" exactly the shift they're
  // handing over.
  const moving = [swap.shift.id, swap.returnShift?.id].filter(Boolean) as string[];
  const checks: { who: string; day: Date }[] = [{ who: swap.toId, day: swap.shift.date }];
  if (swap.returnShift) checks.push({ who: swap.fromId, day: swap.returnShift.date });

  const names = new Map(
    (await prisma.staffMember.findMany({ where: { id: { in: [swap.fromId, swap.toId] } }, select: { id: true, name: true } })).map(
      (p) => [p.id, p.name],
    ),
  );

  const out: string[] = [];
  for (const c of checks) {
    const name = names.get(c.who) ?? "They";
    const sameDay = await prisma.shift.findMany({
      where: { staffMemberId: c.who, date: c.day, kind: "WORKING", id: { notIn: moving } },
    });
    for (const s of sameDay) out.push(`${name} already works ${shiftLine(s)}.`);
    const unavailable = (await unavailabilityBetween(c.day, c.day, c.who)).filter((u) => appliesOn(u, c.day));
    for (const u of unavailable) {
      out.push(`${name} said they can't work ${dayLabel(c.day)} ${dayDateLabel(c.day)}${u.note ? ` (${u.note})` : ""}.`);
    }
  }
  return out;
}
