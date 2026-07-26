import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getStaffSlug } from "@/lib/settings";
import { startOfWeekMonday, endOfWeekSunday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  const [
    whatsOnCount,
    activeStaff,
    staffWithPin,
    shiftsThisWeek,
    slug,
    checklistItems,
    openStock,
    lastNight,
  ] = await Promise.all([
      prisma.whatsOnEntry.count({ where: { active: true } }),
      prisma.staffMember.count({ where: { active: true } }),
      prisma.staffMember.count({ where: { active: true, pinHash: { not: null } } }),
      prisma.shift.count({ where: { date: { gte: weekStart, lte: weekEnd } } }),
      getStaffSlug(),
      prisma.checklistItem.count({ where: { active: true } }),
      prisma.stockReport.findMany({
        where: { resolvedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          item: { select: { name: true } },
          reportedBy: { select: { name: true } },
        },
      }),
      // The most recent night anyone actually closed.
      prisma.checklistRun.findFirst({
        orderBy: { businessDate: "desc" },
        include: {
          submittedBy: { select: { name: true } },
          checks: {
            include: { item: { select: { label: true } }, checkedBy: { select: { name: true } } },
          },
        },
      }),
    ]);

  const escalated = (lastNight?.checks ?? []).filter((c) => c.note);

  const calConfigured = !!process.env.CAL_API_URL && !!process.env.CAL_API_KEY;
  const plausibleConfigured = !!process.env.PLAUSIBLE_SHARED_LINK;

  const tiles = [
    { label: "What's On (live)", value: whatsOnCount, href: "/admin/whats-on" },
    { label: "Active staff", value: activeStaff, href: "/admin/rota" },
    { label: "Shifts this week", value: shiftsThisWeek, href: "/admin/rota" },
  ];

  return (
    <div>
      <h1 className="admin-h1">Good day.</h1>
      <p className="admin-sub">
        Everything for Crescent Moon in one place — the website's What&apos;s On
        section, the staff rota, table bookings and visitor stats.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card" style={{ display: "block", marginBottom: 0 }}>
            <div style={{ fontSize: 40, fontFamily: "'Cormorant', serif" }}>{t.value}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)" }}>
              {t.label}
            </div>
          </Link>
        ))}
      </div>

      {openStock.length > 0 && (
        <div className="card">
          <h2>
            Flagged low{" "}
            <span className="badge" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {openStock.length}
            </span>
          </h2>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18, lineHeight: 1.8, fontSize: 13 }}>
            {openStock.slice(0, 6).map((r) => (
              <li key={r.id}>
                <strong>{r.item?.name ?? r.freeText}</strong> — {r.level === "OUT" ? "out" : "low"}
                {r.note ? `, "${r.note}"` : ""}{" "}
                <span className="muted">
                  ({r.reportedBy.name},{" "}
                  {r.createdAt.toLocaleString("en-GB", {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}
                  )
                </span>
              </li>
            ))}
          </ul>
          {openStock.length > 6 && (
            <p className="muted" style={{ fontSize: 12, margin: "0 0 10px" }}>
              …and {openStock.length - 6} more.
            </p>
          )}
          <p style={{ margin: 0, fontSize: 12 }}>
            <Link href="/admin/stock">Work through the list →</Link>
          </p>
        </div>
      )}

      <div className="card">
        <h2>Last night&apos;s lockdown</h2>
        {!lastNight ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {checklistItems === 0
              ? "No checklist yet — write one and the closing team can start ticking."
              : "Nothing closed yet."}
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>
              <strong>
                {lastNight.businessDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </strong>{" "}
              — {lastNight.checks.length} of {checklistItems} ticked
              {lastNight.submittedAt ? (
                <>
                  , submitted at{" "}
                  <strong>
                    {lastNight.submittedAt.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}
                  </strong>{" "}
                  by {lastNight.submittedBy?.name}.
                </>
              ) : (
                <> — not submitted.</>
              )}
            </p>
            {escalated.length > 0 && (
              <div className="alert error" style={{ marginBottom: 0 }}>
                <strong>
                  {escalated.length} note{escalated.length === 1 ? "" : "s"} for you:
                </strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
                  {escalated.map((c) => (
                    <li key={c.id}>
                      <strong>{c.item.label}</strong> — {c.note}{" "}
                      <span className="muted">({c.checkedBy.name})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{ margin: "10px 0 0", fontSize: 12 }}>
              <Link href="/admin/checklist">Recent nights and the list itself →</Link>
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Setup status</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 13 }}>
          <li>Staff app URL: {slug ? <code>/staff/{slug}</code> : "not generated yet"}</li>
          <li>
            Staff PINs:{" "}
            {staffWithPin === 0 ? (
              <strong>none set — nobody can sign in yet</strong>
            ) : (
              `${staffWithPin} of ${activeStaff} active staff ✓`
            )}
          </li>
          <li>cal.diy bookings: {calConfigured ? "connected ✓" : "not connected yet (add CAL_API_URL / CAL_API_KEY)"}</li>
          <li>Plausible analytics: {plausibleConfigured ? "connected ✓" : "not connected yet (add PLAUSIBLE_SHARED_LINK)"}</li>
        </ul>
      </div>
    </div>
  );
}
