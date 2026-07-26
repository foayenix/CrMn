import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStaffSlug, getVenuePhone, hasLegacySharedPin } from "@/lib/settings";
import { StaffAppSettings } from "./settings";

export const dynamic = "force-dynamic";

export default async function StaffAppAdminPage() {
  const [slug, staff, venuePhone, legacySharedPin] = await Promise.all([
    getStaffSlug(),
    prisma.staffMember.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, active: true, pinHash: true, pinSetAt: true },
    }),
    getVenuePhone(),
    hasLegacySharedPin(),
  ]);

  // Build the staff link from the request's own host rather than
  // NEXT_PUBLIC_SITE_URL. This is the URL the boss copies to a staff phone, so a
  // stale or unset env var would hand out a link to the wrong place (or to
  // "/staff/<slug>" with no origin at all). The request always knows where it
  // arrived, on any deployment, with nothing to configure.
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const fullUrl = slug ? `${protocol}://${host}/staff/${slug}` : "";

  return (
    <div>
      <h1 className="admin-h1">Staff app</h1>
      <p className="admin-sub">
        The back-of-house app: this week&apos;s rota and tonight&apos;s tables on
        a phone or the bar iPad. Two gates, layered — an unguessable link for the
        device, a personal four-digit PIN for the person. No shared PIN: whoever
        is signed in is who the app says did the work.
      </p>
      <StaffAppSettings
        fullUrl={fullUrl}
        venuePhone={venuePhone ?? ""}
        legacySharedPin={legacySharedPin}
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          active: s.active,
          pinSet: s.pinHash !== null,
          pinSetAt: s.pinSetAt
            ? s.pinSetAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })
            : null,
        }))}
      />
    </div>
  );
}
