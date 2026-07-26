import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSlug, getVenuePhone } from "@/lib/settings";
import { getThrottle } from "@/lib/staff-pin";
import { getStaffSession, getDeviceMode } from "@/lib/staff-cookies";
import { LockScreen } from "./lock-screen";
import { DeviceChoice } from "./device-choice";
import { Home } from "./home";

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

  return <Home slug={slug} me={me} isPad={device === "ipad"} />;
}
