import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  dayLabel,
  dayLongLabel,
  dayDateLabel,
  minutesTo24h,
  formatHours,
} from "@/lib/dates";
import { businessDateFor, businessNightRange } from "@/lib/business-date";
import { shiftsOn, nextWorkingShift, slotFrom, type ShiftRow } from "@/lib/staff-rota";
import { slotHours } from "@/lib/rota";
import { fetchBookings, isCalConfigured } from "@/lib/cal";
import { readChecklist, lastSubmittedRun, estimatedMinutes } from "@/lib/checklist";
import { StaffShell, LockButton } from "./shell";

// Screen 02 — Home.
//
// First name, tonight's shift, then everything else as tiles. The two nudges
// sit in their own quiet band, stated once: no badges, no red, no count that
// climbs. When there's nothing to nudge about the band says so in one sage line
// and gets out of the way.
export async function Home({
  slug,
  me,
  isPad,
}: {
  slug: string;
  me: { id: string; name: string };
  isPad: boolean;
}) {
  const now = new Date();
  const tonight = businessDateFor(now);
  const night = businessNightRange(now);
  const monday = startOfWeekMonday(now);
  const sunday = endOfWeekSunday(now);

  const [shifts, dayNote, checklist, lastRun] = await Promise.all([
    prisma.shift.findMany({
      where: { staffMemberId: me.id, date: { gte: monday, lte: sunday } },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
    }),
    prisma.dayNote.findUnique({ where: { date: tonight } }),
    readChecklist(now),
    lastSubmittedRun(now),
  ]);

  // A service being down must never take this screen with it.
  const result = isCalConfigured() ? await fetchBookings(night.from, night.to) : null;
  const bookings = result?.configured && result.ok ? result.bookings : [];
  const bookingsDown = result?.configured === true && result.ok === false;
  const covers = bookings.reduce((sum, b) => sum + (Number(b.partySize) || 0), 0);

  const rows = shifts as ShiftRow[];
  const tonightShifts = shiftsOn(rows, tonight);
  const working = tonightShifts.filter((s) => s.kind === "WORKING");
  const weekHours = rows.reduce((sum, s) => sum + slotHours(s), 0);
  const next = nextWorkingShift(rows, tonight);

  const firstName = me.name.split(" ")[0];
  const hour = now.getUTCHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  // The lockdown nudge only appears once closing is plausibly on the horizon —
  // a checklist reminder at eleven in the morning is noise, and this app never
  // nags. It's stated once, and it never becomes a badge.
  const closingTime = hour >= 18 || hour < 5;
  const checklistStarted = checklist.done > 0;
  const nudges: {
    key: string;
    mark: "brass" | "rose" | "sage";
    text: string;
    detail?: string;
    href: string;
  }[] = [];

  if (checklist.total > 0 && !checklist.submittedAt && (closingTime || checklistStarted)) {
    nudges.push(
      checklistStarted
        ? {
            key: "lockdown",
            mark: "brass",
            text: `Lockdown ${checklist.done} of ${checklist.total} done`,
            detail: `${checklist.remaining} LEFT`,
            href: `/staff/${slug}/lockdown`,
          }
        : {
            key: "lockdown",
            mark: "brass",
            text: "Lockdown checklist not started",
            detail: `${checklist.total} ITEMS · ABOUT ${estimatedMinutes(checklist.total)} MIN`,
            href: `/staff/${slug}/lockdown`,
          },
    );
  }

  const lastLockedAt = lastRun?.submittedAt
    ? lastRun.submittedAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : null;
  const allClear = checklist.submittedAt
    ? `All square. Tonight was locked at ${checklist.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}.`
    : lastLockedAt
      ? `All square. Last night was locked at ${lastLockedAt} and nothing's flagged.`
      : "All square. Nothing needs you before service.";

  const checklistStat = checklist.total === 0
    ? "NO LIST YET"
    : checklist.submittedAt
      ? `SUBMITTED ${checklist.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`
      : checklistStarted
        ? `${checklist.done} / ${checklist.total} DONE`
        : "NOT STARTED";

  const bookingsStat = !isCalConfigured()
    ? "NOT CONNECTED"
    : bookingsDown
      ? "UNREACHABLE"
      : bookings.length === 0
        ? "NOTHING BOOKED"
        : `${bookings.length} ${bookings.length === 1 ? "TABLE" : "TABLES"}${covers ? ` · ${covers} COVERS` : ""}`;

  return (
    <StaffShell slug={slug} section="home" isPad={isPad}>
      <div className="staff-home">
        <div className="staff-home-head">
          <div className="staff-eyebrow">
            {dayLabel(now)} {dayDateLabel(now)}&nbsp;·&nbsp;{clock}
          </div>
          <h1 className="staff-greeting">
            {greeting}, {firstName}
          </h1>
        </div>

        <div className="staff-home-col">
          <TonightPanel working={working} next={next} />

          {/* Worth knowing — stated once each, no badges, no count that climbs.
              When there's nothing, one sage line and out of the way. */}
          <div>
            <div className="staff-mono" style={{ marginBottom: 6 }}>
              Worth knowing
            </div>
            <div className="staff-band">
              {nudges.length > 0 ? (
                nudges.map((n) => (
                  <Link key={n.key} href={n.href} className="staff-band-row">
                    <span className={`staff-band-mark ${n.mark}`} />
                    <div className="staff-band-text">
                      {n.text}
                      {n.detail && <span className="staff-band-detail">{n.detail}</span>}
                    </div>
                    <span className="staff-chevron">›</span>
                  </Link>
                ))
              ) : (
                <div className="staff-band-row">
                  <span className="staff-band-mark sage" />
                  <div className="staff-band-text">{allClear}</div>
                </div>
              )}
              {dayNote && (
                <div className="staff-band-row">
                  <span className="staff-band-mark sage" />
                  <div className="staff-band-text serif-note">{dayNote.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The iPad has room to show tonight's tables outright; the phone keeps
            them one tap away behind the Bookings tile. */}
        {isPad && (
          <div className="staff-home-tables">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span className="staff-mono" style={{ fontSize: 10.5 }}>
                Tonight&apos;s tables
              </span>
              <span className="staff-mono" style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--brass)" }}>
                {covers} covers
              </span>
            </div>
            {bookings.length === 0 ? (
              <p style={{ margin: 0, fontSize: 16, color: "var(--dim)" }}>
                {!isCalConfigured()
                  ? "Bookings aren't connected."
                  : bookingsDown
                    ? "Can't reach the book right now."
                    : "Nothing booked in. Walk-ins only."}
              </p>
            ) : (
              <div className="staff-booking-list">
                {bookings.map((b) => {
                  const passed = b.start < now;
                  return (
                    <div key={String(b.id)} className={passed ? "staff-booking pad passed" : "staff-booking pad"}>
                      <span className="staff-booking-time" style={passed ? undefined : { color: "var(--brass)" }}>
                        {b.start.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}
                      </span>
                      <span className="staff-serif staff-booking-name">{b.name}</span>
                      <span className="staff-booking-party">{b.partySize ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="staff-footnote">No guest contact details in here.</div>
          </div>
        )}

        <div className="staff-tiles">
          <Link href={`/staff/${slug}/bookings`} className="staff-tile">
            <span className="staff-tile-title">Bookings</span>
            <span className="staff-tile-stat">{bookingsStat}</span>
          </Link>
          <Link href={`/staff/${slug}/lockdown`} className="staff-tile">
            <span className="staff-tile-title">Lockdown</span>
            <span
              className="staff-tile-stat"
              style={
                checklist.submittedAt
                  ? { color: "var(--sage)" }
                  : checklist.total > 0 && closingTime
                    ? { color: "var(--brass)" }
                    : undefined
              }
            >
              {checklistStat}
            </span>
          </Link>
          <Link href={`/staff/${slug}/rota`} className="staff-tile">
            <span className="staff-tile-title">My rota</span>
            <span className="staff-tile-stat">{formatHours(weekHours)}H THIS WEEK</span>
          </Link>
        </div>
      </div>

      {!isPad && <LockButton slug={slug} />}
    </StaffShell>
  );
}

function TonightPanel({ working, next }: { working: ShiftRow[]; next: ShiftRow | null }) {
  if (working.length === 0) {
    return (
      <div className="staff-panel">
        <div className="staff-mono" style={{ marginBottom: 8 }}>
          Tonight
        </div>
        <div className="staff-serif" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.1, color: "rgba(232,224,207,.8)" }}>
          You&apos;re not on.
        </div>
        <div style={{ fontSize: 15, color: "rgba(232,224,207,.55)", marginTop: 8 }}>
          {next && next.startMinutes !== null
            ? `Next shift ${dayLongLabel(next.date)}, ${minutesTo24h(next.startMinutes)}.`
            : "Nothing else on the rota this week."}
        </div>
      </div>
    );
  }

  const slots = working.map(slotFrom);
  const endsLabel = slots[slots.length - 1].endsLabel;
  const notes = slots.map((s) => s.note).filter(Boolean);

  return (
    <div className="staff-panel brass">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="staff-mono" style={{ color: "var(--brass)", fontSize: 10.5 }}>
          Tonight
        </span>
        {(endsLabel || slots.length > 1) && (
          <span className="staff-mono" style={{ fontSize: 11, letterSpacing: ".14em" }}>
            {[endsLabel, slots.length > 1 ? "Split shift" : null].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
      {slots.map((s, i) => (
        <div key={i} className="staff-serif" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15 }}>
          {s.label}
        </div>
      ))}
      {notes.length > 0 && (
        <div style={{ fontSize: 15, color: "rgba(232,224,207,.6)", marginTop: 6 }}>
          {notes.join(" · ")}
        </div>
      )}
    </div>
  );
}
