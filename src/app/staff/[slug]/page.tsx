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
import { StaffPinForm } from "./pin-form";
import { describeShift } from "@/lib/rota";
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

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px", marginBottom: "32px" }}>
          {days.map((d) => {
            const dKey = dateKey(d);
            const dayNote = notes.find((n) => dateKey(n.date) === dKey)?.note;
            const dayShifts = shifts.filter((s) => dateKey(s.date) === dKey);
            const workingShifts = dayShifts.filter((s) => s.kind === "WORKING");
            
            const dayLabel = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
            const isToday = dateKey(now) === dKey;
            
            return (
              <div 
                key={dKey} 
                className="glass-panel glass-panel-light" 
                style={{ 
                  padding: "24px 28px", 
                  borderRadius: "12px", 
                  border: isToday ? "1px solid var(--accent-gold)" : "1px solid var(--border-light)",
                  backgroundColor: isToday ? "rgba(244, 240, 230, 0.6)" : "var(--glass-bg)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "21px", fontWeight: 400, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    {dayLabel}
                    {isToday && (
                      <span style={{ 
                        fontFamily: "var(--font-mono)", 
                        fontSize: "9px", 
                        letterSpacing: "0.1em", 
                        textTransform: "uppercase", 
                        backgroundColor: "var(--accent-gold)", 
                        color: "#fff", 
                        padding: "2px 6px", 
                        borderRadius: "3px" 
                      }}>
                        Today
                      </span>
                    )}
                  </h3>
                  {dayNote && (
                    <span style={{ 
                      fontFamily: "var(--font-mono)", 
                      fontSize: "11px", 
                      letterSpacing: "0.08em", 
                      color: "var(--accent-green)",
                      textTransform: "uppercase"
                    }}>
                      {dayNote}
                    </span>
                  )}
                </div>
                
                {workingShifts.length === 0 ? (
                  <p className="muted" style={{ fontSize: "14px", margin: 0, fontStyle: "italic", color: "var(--text-muted-dark)" }}>
                    {dayShifts.some(s => s.kind === "CLOSED") ? "Bar Closed" : "No shifts scheduled"}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {workingShifts.map((s) => {
                      const staffMember = staff.find(st => st.id === s.staffMemberId);
                      if (!staffMember) return null;
                      
                      const shiftNote = s.notes ? ` · ${s.notes}` : "";
                      
                      return (
                        <div 
                          key={s.id} 
                          style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            padding: "10px 0", 
                            borderBottom: "1px solid rgba(18, 18, 18, 0.05)"
                          }}
                        >
                          <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 400 }}>
                            {staffMember.name}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-gold)", letterSpacing: "0.03em" }}>
                            {describeShift(s)}{shiftNote}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
