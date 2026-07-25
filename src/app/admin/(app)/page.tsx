import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getStaffSlug } from "@/lib/settings";
import { startOfWeekMonday, endOfWeekSunday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  const [whatsOnCount, activeStaff, staffWithPin, shiftsThisWeek, slug] = await Promise.all([
    prisma.whatsOnEntry.count({ where: { active: true } }),
    prisma.staffMember.count({ where: { active: true } }),
    prisma.staffMember.count({ where: { active: true, pinHash: { not: null } } }),
    prisma.shift.count({ where: { date: { gte: weekStart, lte: weekEnd } } }),
    getStaffSlug(),
  ]);

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
