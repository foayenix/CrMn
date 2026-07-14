import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSlug, isStaffPinSet } from "@/lib/settings";
import { hasStaffSession } from "@/lib/session";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  weekDays,
  dateKey,
  startOfDay,
  addDays,
  weekRangeLabel,
} from "@/lib/dates";
import { fetchBookings, isCalConfigured } from "@/lib/cal";
import { RotaReadOnly } from "@/components/rota-readonly";
import { StaffPinForm } from "./pin-form";
import "../../admin/admin.css";

// Weaker protection than the boss login, so keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Crescent Moon — Staff",
};
export const dynamic = "force-dynamic";

export default async function StaffView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const realSlug = await getStaffSlug();

  // Unguessable-URL gate: wrong/absent slug looks like a normal 404.
  if (!realSlug || slug !== realSlug) notFound();

  const pinSet = await isStaffPinSet();
  const unlocked = await hasStaffSession();

  if (!pinSet) {
    return (
      <div className="admin-root">
        <div className="login-wrap">
          <div className="login-card">
            <h1 className="admin-serif" style={{ fontSize: 28, margin: 0 }}>Not ready yet</h1>
            <p style={{ fontSize: 13, marginTop: 12 }}>
              The manager hasn&apos;t set the staff PIN. Ask them to set it in the
              admin area first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Second gate: shared PIN (stored in a cookie once entered).
  if (!unlocked) {
    return (
      <div className="admin-root">
        <StaffPinForm slug={slug} />
      </div>
    );
  }

  // --- unlocked: show current week rota + today's bookings ---
  const now = new Date();
  const monday = startOfWeekMonday(now);
  const sunday = endOfWeekSunday(now);
  const days = weekDays(now);
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  const [staff, shifts, notes] = await Promise.all([
    prisma.staffMember.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.shift.findMany({ where: { date: { gte: monday, lte: sunday } }, orderBy: { slot: "asc" } }),
    prisma.dayNote.findMany({ where: { date: { gte: monday, lte: sunday } } }),
  ]);

  const bookingsResult = isCalConfigured() ? await fetchBookings(todayStart, todayEnd) : null;
  const todaysBookings = bookingsResult && bookingsResult.configured && bookingsResult.ok ? bookingsResult.bookings : [];

  return (
    <div className="admin-root">
      <div className="admin-main" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="admin-h1">This week</h1>
        <p className="admin-sub">{weekRangeLabel(now)}</p>

        <div className="card">
          <RotaReadOnly
            days={days.map((d) => ({
              key: dateKey(d),
              dow: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
              date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
              note: notes.find((n) => dateKey(n.date) === dateKey(d))?.note ?? "",
            }))}
            staff={staff.map((s) => ({ id: s.id, name: s.name }))}
            shifts={shifts.map((s) => ({
              staffMemberId: s.staffMemberId,
              dateKey: dateKey(s.date),
              slot: s.slot,
              kind: s.kind,
              startMinutes: s.startMinutes,
              endMinutes: s.endMinutes,
              holidayEnd: s.holidayEnd,
              notes: s.notes,
            }))}
          />
        </div>

        <div className="card">
          <h2>Today&apos;s bookings</h2>
          {!isCalConfigured() ? (
            <p className="muted" style={{ fontSize: 13 }}>Bookings aren&apos;t connected yet.</p>
          ) : todaysBookings.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No bookings today.</p>
          ) : (
            <table className="grid">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Party</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {todaysBookings.map((b) => (
                  <tr key={String(b.id)}>
                    <td>
                      {b.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                    </td>
                    <td>{b.partySize ?? "—"}</td>
                    <td>{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
            Contact details are kept off this screen — ask the manager if you need them.
          </p>
        </div>
      </div>
    </div>
  );
}
