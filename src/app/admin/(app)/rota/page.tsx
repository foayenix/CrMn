import { prisma } from "@/lib/prisma";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  weekDays,
  dateKey,
  parseDateKey,
  addWeeks,
} from "@/lib/dates";
import { RotaGrid } from "./grid";
import Link from "next/link";
import { unavailabilityBetween, unavailabilityByCell } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function RotaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  // ?week=YYYY-MM-DD anchors the displayed week; default = current week.
  const anchor = sp.week ? parseDateKey(sp.week) : new Date();
  const monday = startOfWeekMonday(anchor);
  const sunday = endOfWeekSunday(anchor);
  const days = weekDays(anchor);

  const [staff, shifts, notes, unavailable, awaitingSwaps] = await Promise.all([
    prisma.staffMember.findMany({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }] }),
    prisma.shift.findMany({
      where: { date: { gte: monday, lte: sunday } },
      orderBy: [{ slot: "asc" }],
    }),
    prisma.dayNote.findMany({ where: { date: { gte: monday, lte: sunday } } }),
    unavailabilityBetween(monday, sunday),
    prisma.shiftSwap.count({ where: { status: "ACCEPTED" } }),
  ]);
  const cantWork = Object.fromEntries(unavailabilityByCell(unavailable, days));

  const prevWeek = dateKey(addWeeks(monday, -1));
  const nextWeek = dateKey(addWeeks(monday, 1));
  const thisWeek = dateKey(startOfWeekMonday(new Date()));

  return (
    <div>
      <h1 className="admin-h1">Rota</h1>
      <p className="admin-sub">
        Weekly shifts, Monday to Sunday — same shape as the spreadsheet. Tap any
        cell to set a shift, mark Closed / Unavailable / Holiday, or add a split
        shift. Days someone said they can&apos;t work are marked.
      </p>

      {awaitingSwaps > 0 && (
        <div className="alert ok">
          {awaitingSwaps} {awaitingSwaps === 1 ? "swap is" : "swaps are"} waiting for you.{" "}
          <Link href="/admin/requests">Review →</Link>
        </div>
      )}

      <RotaGrid
        prevWeek={prevWeek}
        nextWeek={nextWeek}
        thisWeek={thisWeek}
        days={days.map((d) => ({
          key: dateKey(d),
          dow: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
          date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
          note: notes.find((n) => dateKey(n.date) === dateKey(d))?.note ?? "",
        }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
        cantWork={cantWork}
        todayKey={dateKey(new Date())}
        shifts={shifts.map((s) => ({
          id: s.id,
          staffMemberId: s.staffMemberId,
          dateKey: dateKey(s.date),
          slot: s.slot,
          kind: s.kind,
          startMinutes: s.startMinutes,
          endMinutes: s.endMinutes,
          holidayEnd: s.holidayEnd ? dateKey(s.holidayEnd) : null,
          notes: s.notes,
        }))}
      />
    </div>
  );
}
