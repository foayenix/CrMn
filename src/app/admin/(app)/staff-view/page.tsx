import { getStaffSlug, isStaffPinSet } from "@/lib/settings";
import { StaffViewSettings } from "./settings";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function StaffViewAdminPage() {
  const [slug, pinSet] = await Promise.all([getStaffSlug(), isStaffPinSet()]);
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const fullUrl = slug ? `${siteUrl.replace(/\/$/, "")}/staff/${slug}` : "";

  return (
    <div>
      <h1 className="admin-h1">Staff view &amp; PIN</h1>
      <p className="admin-sub">
        A no-login page for staff to check this week&apos;s rota and today&apos;s
        bookings on a shared device. It&apos;s protected by an unguessable URL{" "}
        <em>and</em> a shared PIN. Share both with the team.
      </p>
      <StaffViewSettings fullUrl={fullUrl} pinSet={pinSet} />
    </div>
  );
}
