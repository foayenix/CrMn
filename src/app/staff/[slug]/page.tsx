import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSlug, getVenuePhone } from "@/lib/settings";
import { getThrottle } from "@/lib/staff-pin";
import { IPAD_IDLE_SECONDS } from "@/lib/staff-session";
import { getStaffSession, getDeviceMode } from "@/lib/staff-cookies";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  weekRangeLabel,
  dayLabel,
  dayDateLabel,
  startOfDay,
  addDays,
  formatHours,
} from "@/lib/dates";
import { describeShift, slotHours } from "@/lib/rota";
import { fetchBookings, isCalConfigured } from "@/lib/cal";
import { LockScreen } from "./lock-screen";
import { DeviceChoice } from "./device-choice";
import { IdleLock } from "./idle-lock";
import { lockAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffApp({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const realSlug = await getStaffSlug();

  // Device gate: a wrong or stale slug looks like any other 404 and reveals
  // nothing about what lives here.
  if (!realSlug || slug !== realSlug) notFound();

  const [session, device, venuePhone, pinnedStaff] = await Promise.all([
    getStaffSession(),
    getDeviceMode(),
    getVenuePhone(),
    prisma.staffMember.count({ where: { active: true, pinHash: { not: null } } }),
  ]);

  if (pinnedStaff === 0) {
    return (
      <div className="staff-page" style={{ justifyContent: "center", textAlign: "center", gap: 14 }}>
        <h1 className="staff-serif" style={{ fontSize: 34, margin: 0 }}>
          Not ready yet
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "var(--dim)" }}>
          Nobody has a PIN yet. A manager sets them in the admin area, then this
          screen comes to life.
        </p>
      </div>
    );
  }

  if (!device) return <DeviceChoice slug={slug} />;

  // Person gate. A deactivated or deleted staff member falls back to the pad —
  // their shift history stays untouched either way.
  const me = session
    ? await prisma.staffMember.findFirst({
        where: { id: session.staffId, active: true },
        select: { id: true, name: true },
      })
    : null;

  if (!me) {
    const throttle = await getThrottle(slug);
    return (
      <LockScreen
        slug={slug}
        venuePhone={venuePhone}
        initialLockedForSeconds={throttle.lockedForSeconds}
        initialTriesLeft={throttle.triesLeft}
      />
    );
  }

  return <Unlocked slug={slug} me={me} isPad={device === "ipad"} />;
}

// The unlocked screen for this phase: who you are, your week, tonight's tables,
// and Lock always within reach. The hub, tiles and per-section screens land in
// the next phase.
async function Unlocked({
  slug,
  me,
  isPad,
}: {
  slug: string;
  me: { id: string; name: string };
  isPad: boolean;
}) {
  const now = new Date();
  const monday = startOfWeekMonday(now);
  const sunday = endOfWeekSunday(now);
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  const shifts = await prisma.shift.findMany({
    where: { staffMemberId: me.id, date: { gte: monday, lte: sunday } },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
  });

  // cal.diy being down must never take this screen with it — someone is reading
  // it at 00:12 with the shutter half down.
  const bookingsResult = isCalConfigured() ? await fetchBookings(todayStart, todayEnd) : null;
  const bookings =
    bookingsResult?.configured && bookingsResult.ok ? bookingsResult.bookings : [];
  const bookingsDown = bookingsResult?.configured === true && bookingsResult.ok === false;

  const weekHours = shifts.reduce((sum, s) => sum + slotHours(s), 0);
  const firstName = me.name.split(" ")[0];
  const hour = now.getUTCHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <div className="staff-page">
      {isPad && <IdleLock seconds={IPAD_IDLE_SECONDS} />}

      <div style={{ flex: 1 }}>
        <div className="staff-eyebrow">
          {dayLabel(now)} {dayDateLabel(now)}
        </div>
        <h1 className="staff-greeting">
          {greeting}, {firstName}
        </h1>

        <div className="staff-mono" style={{ marginBottom: 8 }}>
          Your week&nbsp;·&nbsp;{formatHours(weekHours)}h
        </div>
        <div style={{ borderTop: "1px solid var(--hair)" }}>
          {shifts.length === 0 ? (
            <div style={{ padding: "18px 0", color: "var(--dim)", fontSize: 16 }}>
              Nothing on the rota for you this week.
            </div>
          ) : (
            shifts.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  minHeight: 76,
                  padding: "16px 0",
                  borderBottom: "1px solid var(--hair)",
                }}
              >
                <span className="staff-mono" style={{ flex: "0 0 76px" }}>
                  {dayLabel(s.date)} {s.date.getUTCDate()}
                </span>
                <span style={{ flex: 1 }}>
                  <span className="staff-serif" style={{ fontSize: 26, fontWeight: 400 }}>
                    {describeShift(s)}
                  </span>
                  {s.notes && (
                    <span style={{ display: "block", fontSize: 15, color: "var(--dim)", marginTop: 4 }}>
                      {s.notes}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="staff-mono" style={{ marginTop: 8, fontSize: 10.5 }}>
          {weekRangeLabel(now)}
        </div>

        <div className="staff-mono" style={{ margin: "26px 0 8px" }}>
          Tonight&apos;s tables
        </div>
        {!isCalConfigured() ? (
          <p style={{ margin: 0, fontSize: 16, color: "var(--dim)" }}>
            Bookings aren&apos;t connected yet.
          </p>
        ) : bookingsDown ? (
          <p style={{ margin: 0, fontSize: 16, color: "var(--dim)" }}>
            Bookings aren&apos;t reachable right now. The book behind the bar is
            the one that counts.
          </p>
        ) : bookings.length === 0 ? (
          <p style={{ margin: 0, fontSize: 16, color: "var(--dim)" }}>Nothing booked in.</p>
        ) : (
          <table className="staff-tables">
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Time</th>
                <th>Name</th>
                <th style={{ width: "22%", textAlign: "right" }}>Party</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={String(b.id)} className={b.start < now ? "staff-past" : undefined}>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20 }}>
                    {b.start.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="staff-serif" style={{ fontSize: 26, fontWeight: 400 }}>
                    {b.name}
                  </td>
                  <td
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 20,
                      textAlign: "right",
                    }}
                  >
                    {b.partySize ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Not decoration: it stops people hunting for a number that isn't here. */}
        <p className="staff-mono" style={{ fontSize: 10.5, marginTop: 12, lineHeight: 1.8 }}>
          No guest phone numbers or emails on this screen — ask a manager.
        </p>
      </div>

      <form action={lockAction} style={{ marginTop: 22 }}>
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className="staff-button">
          <span
            style={{
              width: 11,
              height: 11,
              border: "1.5px solid rgba(232,224,207,.7)",
              borderRadius: 2,
            }}
          />
          Lock
        </button>
      </form>
    </div>
  );
}
