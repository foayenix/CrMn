import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSlug } from "@/lib/settings";
import { getStaffSession } from "@/lib/staff-cookies";
import type { DeviceMode } from "@/lib/staff-session";

export type StaffAccess = {
  me: { id: string; name: string };
  device: DeviceMode;
};

// Both gates, in one place, for every screen past the lock.
//
// A wrong slug 404s and says nothing. A missing or expired session sends you
// back to the pad at the root rather than showing a lock screen three levels
// deep — the iPad's two-minute idle expiry lands here constantly, and it should
// always leave you somewhere you recognise.
export async function requireStaff(slug: string): Promise<StaffAccess> {
  const realSlug = await getStaffSlug();
  if (!realSlug || slug !== realSlug) notFound();

  const session = await getStaffSession();
  const me = session
    ? await prisma.staffMember.findFirst({
        where: { id: session.staffId, active: true },
        select: { id: true, name: true },
      })
    : null;

  if (!me || !session) redirect(`/staff/${slug}`);
  return { me, device: session.device };
}
