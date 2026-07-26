import { businessNightRange, businessNightLabel } from "@/lib/business-date";
import { fetchBookings, isCalConfigured } from "@/lib/cal";
import { requireStaff } from "../access";
import { StaffShell } from "../shell";

export const dynamic = "force-dynamic";

// Screen 04 — Bookings.
//
// Three columns and nothing else: time, name, party size. No email, no phone,
// no way to tap through to one — the footnote says so out loud so nobody hunts
// for it. Read-only, so a wet thumb can't change the night.
export default async function BookingsScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { device } = await requireStaff(slug);
  const isPad = device === "ipad";

  const now = new Date();
  const night = businessNightRange(now);
  const result = isCalConfigured() ? await fetchBookings(night.from, night.to) : null;
  const bookings = result?.configured && result.ok ? result.bookings : [];
  const down = result?.configured === true && result.ok === false;
  const covers = bookings.reduce((sum, b) => sum + (Number(b.partySize) || 0), 0);

  return (
    <StaffShell
      slug={slug}
      section="bookings"
      isPad={isPad}
      title="Bookings"
      stat={`${covers} covers`}
      statBrass={covers > 0}
    >
      {!isCalConfigured() || down || bookings.length === 0 ? (
        <Empty connected={isCalConfigured()} down={down} night={businessNightLabel(now)} />
      ) : (
        <>
          <div style={{ padding: "8px 0 14px" }}>
            <div className="staff-serif" style={{ fontSize: 34, lineHeight: 1 }}>
              Tonight
            </div>
            <div className="staff-eyebrow" style={{ marginTop: 8 }}>
              {businessNightLabel(now)}&nbsp;·&nbsp;{bookings.length}{" "}
              {bookings.length === 1 ? "table" : "tables"}
            </div>
          </div>

          <div className="staff-booking-list">
            {bookings.map((b) => {
              const passed = b.start < now;
              return (
                <div key={String(b.id)} className={passed ? "staff-booking passed" : "staff-booking"}>
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

          {/* Not decoration: it stops people hunting for a number that isn't here. */}
          <div className="staff-footnote">
            Dimmed = time passed.
            <br />
            No guest emails or numbers in here — ask a manager.
          </div>
        </>
      )}
    </StaffShell>
  );
}

function Empty({ connected, down, night }: { connected: boolean; down: boolean; night: string }) {
  const headline = !connected
    ? "Bookings aren't connected"
    : down
      ? "Can't reach the book"
      : "No bookings tonight";
  const body = !connected
    ? "A manager connects cal.diy in the admin area. Until then, the book behind the bar is the only one."
    : down
      ? "The booking system isn't answering. The book behind the bar is the one that counts tonight."
      : "Walk-ins only. Keep the two window tables free until 20:00 and see what the street brings.";

  return (
    <div className="staff-empty">
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path
          d="M 52 8 A 42 42 0 1 0 52 92 A 31 42 0 1 1 52 8 Z"
          fill="none"
          stroke="rgba(168,135,90,.5)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="staff-serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
        {headline}
      </div>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "rgba(232,224,207,.58)", maxWidth: "26ch" }}>
        {body}
      </p>
      <div className="staff-mono" style={{ fontSize: 10.5, letterSpacing: ".18em", marginTop: 6 }}>
        {night}
      </div>
    </div>
  );
}
