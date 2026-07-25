import type { Metadata } from "next";
import "../staff-app.css";

// Weaker protection than the boss login (an unguessable slug plus a personal
// PIN), so the staff app stays out of search indexes — belt and braces with the
// disallow in robots.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Crescent Moon — Staff",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="staff-root">{children}</div>;
}
